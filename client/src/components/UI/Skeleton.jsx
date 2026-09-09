import { forwardRef } from 'react';
import { cx } from '../../design/tokens';

/**
 * Loading placeholders. All three are aria-hidden: a screen reader should hear
 * the container's aria-busy once, not a wall of empty boxes. The pulse stops
 * under prefers-reduced-motion.
 *
 *   <Skeleton className="h-8 w-40" />
 *   <SkeletonText lines={3} />
 *   <SkeletonRows rows={6} cols={5} />
 *
 * Size comes from the caller, because only the caller knows the shape of the
 * thing being waited for. Give the wrapper aria-busy="true" while loading.
 */
const Skeleton = forwardRef(function Skeleton({ className = '', ...rest }, ref) {
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cx(
        'animate-pulse rounded-lg bg-slate-200/70 motion-reduce:animate-none',
        className
      )}
      {...rest}
    />
  );
});

/** A paragraph of `lines` bars. The last one is short, the way real text is. */
export function SkeletonText({ lines = 3, className = '', ...rest }) {
  return (
    <div className={cx('flex flex-col gap-2', className)} {...rest}>
      {Array.from({ length: Math.max(lines, 0) }, (_, i) => (
        <Skeleton
          key={i}
          className={cx('h-3', i === lines - 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </div>
  );
}

/**
 * Table-shaped placeholder at real row height, so the table does not jump when
 * the data lands. DataTable renders this itself while `loading` is true.
 */
export function SkeletonRows({ rows = 5, cols = 4, className = '', ...rest }) {
  return (
    <div className={cx('flex flex-col', className)} {...rest}>
      {Array.from({ length: Math.max(rows, 0) }, (_, r) => (
        <div
          key={r}
          className="flex items-center gap-4 border-b border-slate-200/70 px-4 py-3 last:border-b-0"
        >
          {Array.from({ length: Math.max(cols, 1) }, (_, c) => (
            <Skeleton
              key={c}
              className={cx('h-3', c === 0 ? 'w-40' : 'flex-1')}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export { Skeleton };
export default Skeleton;
