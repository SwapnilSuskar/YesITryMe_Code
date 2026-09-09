import { forwardRef, isValidElement, useId } from 'react';
import { control, cx } from '../../design/tokens';
import FormField, { fieldAria, invalidRing } from './FormField';

/**
 * A labelled text field. The label is a real <label htmlFor>, the error renders
 * below it in the danger tone, and aria-invalid / aria-describedby are wired.
 *
 *   <Input label="Email" name="email" type="email" required
 *          error={errors.email} help="We never share this." />
 *   <Input icon={Search} placeholder="Search users..." value={q}
 *          onChange={(e) => setQ(e.target.value)} aria-label="Search users" />
 */

/* ---------------------------------------------------------------------------
 * Tailwind resolves two conflicting utilities by their position in the emitted
 * stylesheet, NOT by their order in the class attribute. `.border-slate-200`
 * from control.input is emitted after `.border-red-300`, so appending the error
 * classes alone leaves an invalid field looking perfectly normal at rest. The
 * conflicting utility is therefore removed from the token string before the
 * override is appended.
 *
 * Only removal happens here. Every class that reaches the DOM is written
 * literally in tokens.js, FormField.jsx or this file, so Tailwind's content
 * scanner still emits it - a class assembled by string concatenation never
 * would.
 *
 * Padding needs no such surgery: every per-side utility (`pl-*`, `pr-*`) is
 * emitted after the axis utilities (`px-*`), so a gutter wins over the token's
 * `px-3.5` on its own. Only a same-side padding already in the token (the
 * select's `pl-3.5`) has to be dropped first.
 * ------------------------------------------------------------------------ */
const without = (classes, pattern) =>
  classes
    .split(/\s+/)
    .filter((c) => c && !pattern.test(c))
    .join(' ');

const BORDER_COLOR = /^border-[a-z]+-\d+(?:\/\d+)?$/;
const PAD_LEFT = /^pl-[\d.]+$/;
const PAD_RIGHT = /^pr-[\d.]+$/;

/** Room for a 16px affix at either end of a control. */
const LEADING_GUTTER = 'pl-10';
const TRAILING_GUTTER = 'pr-10';

/** Centred affix slots. slate-500 is the lightest icon colour that clears 3:1. */
export const affix = {
  leading:
    'pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500',
  trailing: 'absolute inset-y-0 right-2 flex items-center text-slate-500',
};

/**
 * Compose a control's classes so the error and affix overrides actually win.
 * Shared by Input, Select and Textarea - internal, not part of the public API.
 */
export function controlClass(base, options) {
  const { error, icon, trailing, className } = options || {};
  let out = base;
  if (error) out = cx(without(out, BORDER_COLOR), invalidRing);
  if (icon) out = cx(without(out, PAD_LEFT), LEADING_GUTTER);
  if (trailing) out = cx(without(out, PAD_RIGHT), TRAILING_GUTTER);
  return cx(out, className);
}

/** `icon` takes either a component (icon={Search}) or an element (<Search />). */
export function renderAffix(node) {
  if (!node) return null;
  if (isValidElement(node)) return node;
  const Icon = node;
  return <Icon className="h-4 w-4" aria-hidden="true" />;
}

export const Input = forwardRef(function Input(
  {
    label,
    help,
    error,
    required = false,
    requiredMark,
    id,
    name,
    type = 'text',
    icon,
    trailing,
    className = '',
    fieldClassName = '',
    'aria-describedby': describedByProp,
    ...rest
  },
  ref
) {
  const autoId = useId();
  const fieldId = id || autoId;
  const { helpId, errorId, describedBy, invalid } = fieldAria({
    id: fieldId,
    help,
    error,
  });

  return (
    <FormField
      id={fieldId}
      label={label}
      help={help}
      error={error}
      required={requiredMark === undefined ? required : requiredMark}
      helpId={helpId}
      errorId={errorId}
      className={fieldClassName}
    >
      <div className="relative">
        {icon ? (
          <span className={affix.leading} aria-hidden="true">
            {renderAffix(icon)}
          </span>
        ) : null}

        <input
          ref={ref}
          id={fieldId}
          name={name}
          type={type}
          required={required}
          aria-invalid={invalid}
          aria-describedby={cx(describedBy, describedByProp) || undefined}
          className={controlClass(control.input, {
            error,
            icon,
            trailing,
            className,
          })}
          {...rest}
        />

        {trailing ? <span className={affix.trailing}>{trailing}</span> : null}
      </div>
    </FormField>
  );
});

export default Input;
