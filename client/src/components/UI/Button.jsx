import { forwardRef, isValidElement } from 'react';
import { button, cx } from '../../design/tokens';

/**
 * Every button in the app. Styling comes from design/tokens.js only - a screen
 * never writes a button class string of its own.
 *
 *   <Button variant="danger" size="sm" icon={Trash2} loading={deleting}>Delete</Button>
 *   <Button as={Link} to="/admin/users" variant="outline">All users</Button>
 *   <Button variant="icon" icon={X} onClick={onClose} aria-label="Close" />
 *   <Button type="submit" loading={saving}>Save changes</Button>
 */

const VARIANTS = {
  primary: button.primary,
  dark: button.dark,
  outline: button.outline,
  ghost: button.ghost,
  danger: button.danger,
  success: button.success,
  /* Square 40px action for table rows and dialog headers. Icon-only by design,
     so it always needs an aria-label. */
  icon: button.icon,
};

/* ---------------------------------------------------------------------------
 * Tailwind resolves two conflicting utilities by their position in the emitted
 * stylesheet, NOT by their order in the class attribute. `.px-5` is emitted
 * after `.px-3`, so appending button.sm ("px-3 py-1.5 text-xs") to a variant
 * that already says "px-5 py-3 text-sm" would change the font size and nothing
 * else. The conflicting utilities are therefore removed from the variant string
 * before the size modifier is appended.
 *
 * Only removal happens here. Every class that reaches the DOM is still written
 * literally in tokens.js or in this file, so Tailwind's content scanner still
 * emits it - a class assembled by string concatenation never would.
 * ------------------------------------------------------------------------ */
const without = (classes, pattern) =>
  classes
    .split(/\s+/)
    .filter((c) => c && !pattern.test(c))
    .join(' ');

/** Unprefixed padding and font-size utilities - what button.sm replaces. */
const SIZE_CONFLICT = /^(?:p[xy]?-[\d.]+|text-(?:xs|sm|base|lg))$/;
/** Unprefixed box utilities - what the small icon button replaces. */
const BOX_CONFLICT = /^[hw]-[\d.]+$/;

function sizedVariant(base, variant, size) {
  if (size !== 'sm') return base;
  /* A fixed-size square keeps its shape: it shrinks, it does not get padding. */
  if (variant === 'icon') return cx(without(base, BOX_CONFLICT), 'h-8 w-8');
  return cx(without(base, SIZE_CONFLICT), button.sm);
}

/** Inline spinner. Holds still under prefers-reduced-motion. */
function Spinner({ className }) {
  return (
    <svg
      className={cx('animate-spin motion-reduce:animate-none', className)}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="8"
        cy="8"
        r="6.5"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.25"
      />
      <path
        d="M14.5 8a6.5 6.5 0 0 0-6.5-6.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** `icon` takes either a component (icon={Trash2}) or an element (<Trash2 />). */
function renderIcon(node, sizeClass) {
  if (!node) return null;
  if (isValidElement(node)) return node;
  const Icon = node;
  return <Icon className={cx(sizeClass, 'shrink-0')} aria-hidden="true" />;
}

const isEmpty = (children) =>
  children === undefined ||
  children === null ||
  children === false ||
  children === '';

export const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    icon,
    iconRight,
    as,
    type: htmlType,
    className = '',
    children,
    onClick,
    ...rest
  },
  ref
) {
  /* An anchor is inferred from href so <Button href="..."> is never an invalid
     <button href>. Anything else is explicit: as={Link}, as="a", as="label". */
  const Component = as || (rest.href ? 'a' : 'button');
  const isNativeButton = Component === 'button';
  const variantKey = VARIANTS[variant] ? variant : 'primary';
  const isDisabled = disabled || loading;
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  if (process.env.NODE_ENV !== 'production') {
    const labelled =
      rest['aria-label'] || rest['aria-labelledby'] || rest.title;
    if (isEmpty(children) && !labelled) {
      // eslint-disable-next-line no-console
      console.warn(
        '[Button] An icon-only button needs an aria-label so a screen reader can announce it.'
      );
    }
  }

  const classes = cx(
    sizedVariant(VARIANTS[variantKey], variantKey, size),
    /* A non-button element cannot carry `disabled`, so the pointer and the tab
       order are stopped instead. */
    isDisabled && !isNativeButton && 'pointer-events-none opacity-50',
    className
  );

  const elementProps = isNativeButton
    ? { type: htmlType || 'button', disabled: isDisabled }
    : {
        'aria-disabled': isDisabled || undefined,
        tabIndex: isDisabled ? -1 : undefined,
      };

  return (
    <Component
      ref={ref}
      className={classes}
      aria-busy={loading || undefined}
      onClick={isDisabled ? undefined : onClick}
      {...elementProps}
      {...rest}
    >
      {loading
        ? <Spinner className={cx(iconSize, 'shrink-0')} />
        : renderIcon(icon, iconSize)}
      {children}
      {loading ? null : renderIcon(iconRight, iconSize)}
    </Component>
  );
});

export default Button;
