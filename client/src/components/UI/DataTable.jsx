import { isValidElement } from 'react';
import { ChevronDown, ChevronsUpDown, ChevronUp, Inbox } from 'lucide-react';
import { cx, focusRing, table as t } from '../../design/tokens';
import EmptyState from './EmptyState';
import { SkeletonRows } from './Skeleton';

let warnedAboutRowKey = false;

function alignClass(align) {
  if (align === 'right') return 'text-right';
  if (align === 'center') return 'text-center';
  return 'text-left';
}

/**
 *   <DataTable
 *     columns={[
 *       { key: 'name',  header: 'Product', sortable: true },
 *       { key: 'price', header: 'Price', align: 'right', width: '8rem',
 *         render: (row) => <Money value={row.price} /> },
 *       { key: 'actions', header: '', align: 'right',
 *         render: (row) => <Button size="sm" variant="outline">Edit</Button> },
 *     ]}
 *     rows={products}
 *     loading={loading}
 *     rowKey={(row) => row._id}
 *     sortKey={sortKey} sortDir={sortDir} onSort={setSort}
 *     empty={{ title: 'No products yet', description: 'Add one to begin.' }}
 *   />
 *
 * The wrapper owns the horizontal scroll, so a wide table never makes the page
 * body scroll sideways. Pass `maxHeight` (any CSS length, e.g. '70vh') to make
 * the wrapper scroll vertically too - that is what makes the sticky header
 * actually stick, since otherwise the page is the scroll container.
 *
 * Loading and empty both render inside the tbody under a full-width cell, so
 * the header stays put and column widths do not jump when the data lands.
 *
 * `onSort(key)` is called with the column key only. The screen owns the sort
 * direction, the request and the refetch; this component renders the indicator
 * and nothing else. No sorting, filtering or paging logic lives in here.
 */
export function DataTable({
  columns = [],
  rows = [],
  loading = false,
  empty,
  onSort,
  sortKey,
  sortDir = 'asc',
  rowKey,
  onRowClick,
  skeletonRows = 6,
  maxHeight,
  caption,
  className = '',
  tableClassName = '',
  ...rest
}) {
  const list = Array.isArray(rows) ? rows : [];
  const span = Math.max(columns.length, 1);

  if (
    process.env.NODE_ENV !== 'production' &&
    !warnedAboutRowKey &&
    !rowKey &&
    list.length > 0 &&
    list[0] &&
    list[0]._id == null &&
    list[0].id == null
  ) {
    warnedAboutRowKey = true;
    // eslint-disable-next-line no-console
    console.warn(
      '[DataTable] rows have no _id or id - pass rowKey so React can keep row identity across sorts and refetches.'
    );
  }

  const resolveKey = (row, index) => {
    if (typeof rowKey === 'function') return rowKey(row, index);
    if (typeof rowKey === 'string' && row && row[rowKey] != null) return row[rowKey];
    if (row && row._id != null) return row._id;
    if (row && row.id != null) return row.id;
    return index;
  };

  const head = (
    <thead className={t.thead}>
      <tr>
        {columns.map((col, index) => {
          const sortable = col.sortable && typeof onSort === 'function';
          const isSorted = sortable && sortKey === col.key;
          const descending = sortDir === 'desc';
          let Indicator = ChevronsUpDown;
          if (isSorted) Indicator = descending ? ChevronDown : ChevronUp;

          let ariaSort;
          if (isSorted) ariaSort = descending ? 'descending' : 'ascending';
          else if (sortable) ariaSort = 'none';

          return (
            <th
              key={col.key || 'col-' + index}
              scope="col"
              style={col.width ? { width: col.width } : undefined}
              aria-sort={ariaSort}
              className={cx(t.th, alignClass(col.align), col.headerClassName)}
            >
              {sortable ? (
                <button
                  type="button"
                  onClick={() => onSort(col.key)}
                  className={cx(
                    t.thSortable,
                    'inline-flex items-center gap-1 rounded-lg uppercase tracking-[0.08em]',
                    col.align === 'right' && 'flex-row-reverse'
                  )}
                >
                  {col.header}
                  <Indicator
                    className={cx(
                      'h-3 w-3 shrink-0',
                      isSorted ? 'text-brand-primary' : 'text-slate-500'
                    )}
                    aria-hidden="true"
                  />
                </button>
              ) : (
                col.header
              )}
            </th>
          );
        })}
      </tr>
    </thead>
  );

  let body;
  if (loading) {
    body = (
      <tbody>
        <tr>
          <td colSpan={span} className="p-0">
            <SkeletonRows rows={skeletonRows} cols={span} />
          </td>
        </tr>
      </tbody>
    );
  } else if (list.length === 0) {
    const config = typeof empty === 'string' ? { title: empty } : empty || {};
    body = (
      <tbody>
        <tr>
          <td colSpan={span} className="p-0">
            {isValidElement(empty) ? (
              empty
            ) : (
              <EmptyState
                icon={config.icon || Inbox}
                title={config.title || 'Nothing here yet'}
                description={config.description}
                action={config.action}
              />
            )}
          </td>
        </tr>
      </tbody>
    );
  } else {
    body = (
      <tbody className={t.tbody}>
        {list.map((row, index) => {
          const clickable = typeof onRowClick === 'function';
          return (
            <tr
              key={resolveKey(row, index)}
              onClick={clickable ? () => onRowClick(row, index) : undefined}
              onKeyDown={
                clickable
                  ? (event) => {
                      if (event.target !== event.currentTarget) return;
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onRowClick(row, index);
                      }
                    }
                  : undefined
              }
              tabIndex={clickable ? 0 : undefined}
              className={cx(t.tr, clickable && cx('cursor-pointer', focusRing))}
            >
              {columns.map((col, colIndex) => {
                const numeric = col.align === 'right';
                return (
                  <td
                    key={col.key || 'col-' + colIndex}
                    className={cx(
                      numeric ? t.tdNum : t.td,
                      !numeric && alignClass(col.align),
                      col.className
                    )}
                  >
                    {typeof col.render === 'function'
                      ? col.render(row, index)
                      : row
                        ? row[col.key]
                        : null}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    );
  }

  return (
    <div
      className={cx(t.wrap, className)}
      style={maxHeight ? { maxHeight, overflowY: 'auto' } : undefined}
      aria-busy={loading || undefined}
      {...rest}
    >
      <table className={cx(t.table, tableClassName)}>
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        {head}
        {body}
      </table>
    </div>
  );
}

export default DataTable;
