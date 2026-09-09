import { control, cx, type } from '../../design/tokens';

/**
 * The label / help / error shell shared by Input, Select and Textarea, so all
 * three wire `htmlFor`, `aria-invalid` and `aria-describedby` identically.
 *
 * Internal - screens import Input/Select/Textarea from '../UI', not this.
 */
export default function FormField({
  id,
  label,
  help,
  error,
  required,
  helpId,
  errorId,
  className = '',
  children,
}) {
  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      {label ? (
        <label htmlFor={id} className={control.label}>
          {label}
          {required ? (
            <span className={control.required} aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : null}

      {children}

      {help && !error ? (
        <p id={helpId} className={control.help}>
          {help}
        </p>
      ) : null}

      {error ? (
        <p id={errorId} className={control.error} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Shared plumbing: which ids describe the control, and the invalid border.
 * `error` wins over `help` in the description, matching what FormField renders.
 */
export function fieldAria({ id, help, error }) {
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const describedBy = error ? errorId : help ? helpId : undefined;
  return {
    helpId,
    errorId,
    describedBy,
    invalid: error ? true : undefined,
  };
}

/** Red hairline + red focus ring when a field is in error. */
export const invalidRing =
  'border-red-300 focus:border-red-500 focus:ring-red-500/25';

/** Re-exported so field files do not reach past the tokens module. */
export { control, type };
