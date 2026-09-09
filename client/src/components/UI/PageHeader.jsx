import { forwardRef } from 'react';
import { cx, type } from '../../design/tokens';

/**
 * The single page title for every admin screen - so all 28 headings are the
 * same size, weight and colour, and no page ever renders two h1 elements.
 *
 *   <PageHeader
 *     icon={Users}
 *     title="Users"
 *     subtitle="1,204 members across 6 levels"
 *     actions={<Button icon={Plus}>Add user</Button>}
 *   />
 *
 * `actions` is the only place a primary button belongs on a list screen. It
 * wraps under the title on narrow viewports rather than squeezing it.
 */
const PageHeader = forwardRef(function PageHeader(
  { title, subtitle, actions, icon: Icon, className = '', ...rest },
  ref
) {
  return (
    <div
      ref={ref}
      className={cx(
        'flex flex-col gap-3 pb-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6',
        className
      )}
      {...rest}
    >
      <div className="flex min-w-0 items-start gap-3">
        {Icon ? (
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-700">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
        ) : null}

        <div className="min-w-0">
          <h1 className={type.h1}>{title}</h1>
          {subtitle ? <p className={cx(type.body, 'mt-1')}>{subtitle}</p> : null}
        </div>
      </div>

      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  );
});

export { PageHeader };
export default PageHeader;
