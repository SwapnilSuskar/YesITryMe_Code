import { useCallback, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { button, cx, modal, transitions, type } from '../../design/tokens';

/**
 * Everything a focus trap should be able to land on. Hidden inputs and
 * disabled controls are excluded here; invisible ones are filtered at runtime.
 */
const FOCUSABLE = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const SIZES = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
};

/* --------------------------- shared page-scroll lock ---------------------- */
/* Counted, so nested dialogs do not fight over document.body and the last one
   to close is the one that hands the page its scrolling back. */
let lockCount = 0;
let priorOverflow = '';
let priorPaddingRight = '';

function lockPageScroll() {
  if (typeof document === 'undefined') return;
  if (lockCount === 0) {
    const { body } = document;
    priorOverflow = body.style.overflow;
    priorPaddingRight = body.style.paddingRight;
    /* Compensate for the scrollbar we are about to remove, so the page behind
       the backdrop does not jump sideways as the dialog opens. */
    const gutter = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = 'hidden';
    if (gutter > 0) body.style.paddingRight = gutter + 'px';
  }
  lockCount += 1;
}

function unlockPageScroll() {
  if (typeof document === 'undefined') return;
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = priorOverflow;
    document.body.style.paddingRight = priorPaddingRight;
  }
}

/* ------------------------------- dialog stack ----------------------------- */
/* Escape must close only the topmost dialog. Each open Modal pushes a token. */
const openDialogs = [];

function isVisible(el) {
  if (el.offsetParent !== null) return true;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 || rect.height > 0;
}

/**
 *   <Modal open={open} onClose={close} title="Edit product" size="lg"
 *          footer={<><Button variant="outline" onClick={close}>Cancel</Button>
 *                    <Button onClick={save}>Save</Button></>}>
 *     ...fields...
 *   </Modal>
 *
 * Escape closes the topmost dialog, a backdrop press closes, Tab and Shift+Tab
 * cycle inside the panel, focus lands inside on open and returns to the trigger
 * on close, and the page behind is scroll-locked. The panel caps at 90vh and
 * its BODY scrolls - the page never does.
 *
 * On phones the panel is a bottom sheet (full width, rounded top corners) and
 * from `sm` up it is a centred card, so nothing clips at 375px.
 */
export function Modal({
  open,
  onClose,
  title,
  size = 'md',
  footer,
  closeOnBackdrop = true,
  closeOnEscape = true,
  showClose = true,
  initialFocusRef,
  className = '',
  panelClassName = '',
  bodyClassName = '',
  children,
  ...rest
}) {
  const panelRef = useRef(null);
  const restoreRef = useRef(null);
  const backdropPressRef = useRef(false);
  const tokenRef = useRef(null);
  if (tokenRef.current === null) tokenRef.current = {};
  const titleId = useId();

  const close = useCallback(() => {
    if (typeof onClose === 'function') onClose();
  }, [onClose]);

  /* Claim the top of the dialog stack while open. */
  useEffect(() => {
    if (!open) return undefined;
    const token = tokenRef.current;
    openDialogs.push(token);
    return () => {
      const at = openDialogs.indexOf(token);
      if (at !== -1) openDialogs.splice(at, 1);
    };
  }, [open]);

  /* Remember the trigger, and give focus back to it when the dialog closes. */
  useEffect(() => {
    if (!open) return undefined;
    restoreRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    return () => {
      const node = restoreRef.current;
      restoreRef.current = null;
      if (node && document.contains(node)) node.focus({ preventScroll: true });
    };
  }, [open]);

  /* Initial focus: the caller's choice, else the first control in the panel
     (normally the close button - a safe target that never pops a keyboard),
     else the panel itself so the trap has something to hold. */
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;
    const wanted = initialFocusRef && initialFocusRef.current;
    if (wanted instanceof HTMLElement) {
      wanted.focus();
      return;
    }
    const first = Array.from(panel.querySelectorAll(FOCUSABLE)).find(isVisible);
    (first || panel).focus();
    // initialFocusRef is read once, when the dialog opens, by design.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /* Lock the page behind the dialog. */
  useEffect(() => {
    if (!open) return undefined;
    lockPageScroll();
    return unlockPageScroll;
  }, [open]);

  /* One document-level listener, so Escape still works after a backdrop click
     has dropped focus onto <body>, and Tab is pulled back into the panel from
     anywhere on the page. */
  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      /* Only the topmost dialog reacts. */
      if (openDialogs[openDialogs.length - 1] !== tokenRef.current) return;

      const panel = panelRef.current;
      if (!panel) return;

      if (event.key === 'Escape') {
        if (!closeOnEscape) return;
        event.preventDefault();
        event.stopPropagation();
        close();
        return;
      }

      if (event.key !== 'Tab') return;

      const items = Array.from(panel.querySelectorAll(FOCUSABLE)).filter(isVisible);
      if (items.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const active = document.activeElement;
      const first = items[0];
      const last = items[items.length - 1];

      if (!panel.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [open, closeOnEscape, close]);

  if (!open || typeof document === 'undefined') return null;

  /* A press that starts on the backdrop and also ends there closes. Tracking
     both halves stops a text drag that began inside the panel from dismissing
     the dialog when the pointer is released over the backdrop. */
  const onBackdropMouseDown = (event) => {
    backdropPressRef.current = event.target === event.currentTarget;
  };
  const onBackdropMouseUp = (event) => {
    const startedOnBackdrop = backdropPressRef.current;
    backdropPressRef.current = false;
    if (!closeOnBackdrop) return;
    if (startedOnBackdrop && event.target === event.currentTarget) close();
  };

  return createPortal(
    <div
      className={cx(modal.backdrop, className)}
      onMouseDown={onBackdropMouseDown}
      onMouseUp={onBackdropMouseUp}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={cx(modal.panel, SIZES[size] || SIZES.md, panelClassName)}
        {...rest}
      >
        {title || showClose ? (
          <div className={modal.header}>
            {title ? (
              <h2 id={titleId} className={type.h2}>
                {title}
              </h2>
            ) : (
              <span aria-hidden="true" />
            )}
            {showClose ? (
              <button
                type="button"
                onClick={close}
                aria-label="Close dialog"
                className={cx(button.ghost, '-mr-1 shrink-0 p-2', transitions.fast)}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : null}
          </div>
        ) : null}

        <div className={cx(modal.body, bodyClassName)}>{children}</div>

        {footer ? <div className={modal.footer}>{footer}</div> : null}
      </div>
    </div>,
    document.body
  );
}

export default Modal;
