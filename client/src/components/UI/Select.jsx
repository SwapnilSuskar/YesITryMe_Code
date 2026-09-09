import { forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { control, cx } from '../../design/tokens';
import FormField, { fieldAria } from './FormField';
import { affix, controlClass, renderAffix } from './Input';

/**
 * Same contract as Input, plus the caret every select in the app shares. The
 * native menu is kept - only the chrome is ours.
 *
 *   <Select label="Status" name="status" value={status} onChange={onChange}>
 *     <option value="all">All statuses</option>
 *     <option value="pending">Pending</option>
 *   </Select>
 */
export const Select = forwardRef(function Select(
  {
    label,
    help,
    error,
    required = false,
    requiredMark,
    id,
    name,
    icon,
    className = '',
    fieldClassName = '',
    children,
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

        <select
          ref={ref}
          id={fieldId}
          name={name}
          required={required}
          aria-invalid={invalid}
          aria-describedby={cx(describedBy, describedByProp) || undefined}
          className={controlClass(control.select, { error, icon, className })}
          {...rest}
        >
          {children}
        </select>

        {/* The token already reserves pr-10 for this. */}
        <ChevronDown className={control.selectCaret} aria-hidden="true" />
      </div>
    </FormField>
  );
});

export default Select;
