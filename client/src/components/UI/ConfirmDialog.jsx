import { useId } from 'react';
import { cx, type } from '../../design/tokens';
import Button from './Button';
import Modal from './Modal';

/**
 * The replacement for every window.confirm() and alert() in the admin.
 *
 *   <ConfirmDialog
 *     open={pendingDelete !== null}
 *     onClose={() => setPendingDelete(null)}
 *     onConfirm={remove}
 *     tone="danger"
 *     title="Delete this product?"
 *     description="Orders that already reference it are unaffected."
 *     confirmLabel="Delete"
 *     loading={deleting}
 *   />
 *
 * While `loading`, both buttons are disabled and the backdrop, the Escape key
 * and the close button are all inert, so a request in flight cannot be
 * abandoned halfway and fired twice.
 *
 * `onConfirm` is called as-is - this dialog owns no request and no state. The
 * screen decides whether to close on success, keep it open on failure, or show
 * an error inside it via `children`.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'primary',
  loading = false,
  size = 'sm',
  children,
  ...rest
}) {
  const descriptionId = useId();
  const dismiss = loading ? undefined : onClose;

  return (
    <Modal
      open={open}
      onClose={dismiss}
      title={title}
      size={size}
      closeOnBackdrop={!loading}
      closeOnEscape={!loading}
      showClose={!loading}
      aria-describedby={description ? descriptionId : undefined}
      footer={
        <>
          <Button variant="outline" onClick={dismiss} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
      {...rest}
    >
      {description ? (
        <p id={descriptionId} className={cx(type.body, 'text-slate-600')}>
          {description}
        </p>
      ) : null}
      {children}
    </Modal>
  );
}

export default ConfirmDialog;
