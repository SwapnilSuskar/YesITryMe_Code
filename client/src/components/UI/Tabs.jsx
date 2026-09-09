import { forwardRef, useRef } from 'react';
import { cx, focusRing, transitions } from '../../design/tokens';

/**
 *   <Tabs
 *     tabs={[
 *       { key: 'all', label: 'All', count: 128 },
 *       { key: 'pending', label: 'Pending', count: 4 },
 *       { key: 'rejected', label: 'Rejected' },
 *     ]}
 *     active={tab}
 *     onChange={setTab}
 *   />
 *
 * The active tab is marked by a brand underline - one of only two places the
 * orange is allowed (the other is the primary action). Everything else is a
 * slate weight shift, so the strip reads as structure, not decoration.
 *
 * Keyboard: one tab stop for the whole strip (roving tabindex), then Left,
 * Right, Home and End move and activate. `onChange(key)` fires with the tab key
 * and nothing else - filtering, refetching and URL state stay in the screen.
 *
 * A tab may carry `panelId` to point at the region it controls. Used as a
 * filter switch with no panel, the strip is still valid and announced.
 */
const Tabs = forwardRef(function Tabs(
  { tabs = [], active, onChange, label = 'Sections', className = '', ...rest },
  ref
) {
  const listRef = useRef(null);

  const setRefs = (node) => {
    listRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  };

  const activeIndex = tabs.findIndex((tab) => tab.key === active);

  const focusTab = (key) => {
    const node = listRef.current;
    if (!node) return;
    const next = node.querySelector(`[data-tab-key="${key}"]`);
    if (next) next.focus();
  };

  const move = (index) => {
    const next = tabs[index];
    if (!next) return;
    if (typeof onChange === 'function') onChange(next.key);
    focusTab(next.key);
  };

  const onKeyDown = (event) => {
    if (tabs.length === 0) return;
    /* Unknown `active` means no tab is current; start from the first. */
    const from = activeIndex < 0 ? 0 : activeIndex;

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      move((from + 1) % tabs.length);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      move((from - 1 + tabs.length) % tabs.length);
    } else if (event.key === 'Home') {
      event.preventDefault();
      move(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      move(tabs.length - 1);
    }
  };

  return (
    <div
      ref={setRefs}
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cx(
        'flex items-center gap-1 overflow-x-auto overscroll-x-contain border-b border-slate-200/80',
        className
      )}
      {...rest}
    >
      {tabs.map((tab, index) => {
        const isActive = tab.key === active;
        /* If `active` matches nothing, the first tab holds the tab stop so the
           strip can never become unreachable from the keyboard. */
        const isTabStop = isActive || (activeIndex < 0 && index === 0);

        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            data-tab-key={tab.key}
            aria-selected={isActive}
            aria-controls={tab.panelId || undefined}
            tabIndex={isTabStop ? 0 : -1}
            onClick={() => {
              if (typeof onChange === 'function') onChange(tab.key);
            }}
            className={cx(
              'inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-t-lg border-b-2 px-3 py-2.5 text-sm font-medium',
              transitions.fast,
              focusRing,
              isActive
                ? 'border-brand-primary text-slate-900'
                : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900'
            )}
          >
            {tab.label}
            {tab.count != null ? (
              /* Denser than a badge token on purpose: this is a counter inside
                 a control, not a standalone badge. Same hues, tighter box. */
              <span
                className={cx(
                  'rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
                  isActive
                    ? 'bg-brand-primary/10 text-brand-deeper'
                    : 'bg-slate-100 text-slate-600'
                )}
              >
                {tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
});

export { Tabs };
export default Tabs;
