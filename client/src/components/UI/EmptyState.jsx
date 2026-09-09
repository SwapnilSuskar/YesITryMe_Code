import { forwardRef } from 'react';
import { cx, type } from '../../design/tokens';

/**
 * What a table, list or panel shows when it holds nothing. Deliberately quiet:
 * a muted glyph, one line of explanation, and at most one action.
 *
 *   <EmptyState
 *     icon={Inbox}
 *     title="No withdrawal requests"
 *     description="Requests appear here as members submit them."
 *     action={<Button size="sm" variant="outline" onClick={refresh}>Refresh</Button>}
 *   />
 *
 * DataTable renders this for you when `rows` is empty, so a screen only reaches
 * for it directly outside a table (an empty card, panel or search result).
 */
const EmptyState = forwardRef(function EmptyState(
  { icon: Icon, title, description, action, className = '', ...rest },
  ref
) {
  return (
    <div
      ref={ref}
      className={cx(
        'flex flex-col items-center justify-center gap-2 px-6 py-12 text-center',
        className
      )}
      {...rest}
    >
      {Icon ? (
        <span className="mb-1 flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200/80 bg-slate-50 text-slate-500">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      ) : null}

      {title ? <p className={type.h3}>{title}</p> : null}

      {description ? (
        <p className={cx(type.body, 'max-w-sm')}>{description}</p>
      ) : null}

      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
});

export { EmptyState };
export default EmptyState;
