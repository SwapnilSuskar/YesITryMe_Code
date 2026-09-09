import { forwardRef, useId } from 'react';
import { control, cx } from '../../design/tokens';
import FormField, { fieldAria } from './FormField';
import { controlClass } from './Input';

/**
 * Same contract as Input. Resizes vertically only, so a long note can never
 * push a form sideways.
 *
 *   <Textarea label="Admin notes" name="adminNotes" rows={4}
 *             value={notes} onChange={(e) => setNotes(e.target.value)}
 *             help="Only other admins see this." />
 */
export const Textarea = forwardRef(function Textarea(
  {
    label,
    help,
    error,
    required = false,
    requiredMark,
    id,
    name,
    rows = 4,
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
      <textarea
        ref={ref}
        id={fieldId}
        name={name}
        rows={rows}
        required={required}
        aria-invalid={invalid}
        aria-describedby={cx(describedBy, describedByProp) || undefined}
        className={controlClass(control.textarea, { error, className })}
        {...rest}
      />
    </FormField>
  );
});

export default Textarea;
