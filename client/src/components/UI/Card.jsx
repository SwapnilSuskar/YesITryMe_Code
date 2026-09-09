import { forwardRef } from 'react';
import { cx, focusRing, surface, transitions } from '../../design/tokens';

/**
 * The one container in the app: one hairline border, one soft layered shadow.
 *
 *   <Card>...</Card>
 *   <Card padded={false} as="li">...</Card>
 *   <Card hover as={Link} to={`/admin/users/${id}`}>...</Card>
 *
 * `hover` shifts the border and the shadow only - never the size - so a grid of
 * cards never reflows under the cursor and a row never nudges its neighbours.
 * The focus ring is added automatically when the card is a focusable element
 * (button, anchor, router Link, or anything given a tabIndex), so a clickable
 * card is never a keyboard dead end.
 */
const Card = forwardRef(function Card(
  {
    padded = true,
    hover = false,
    as: Component = 'div',
    className = '',
    children,
    ...rest
  },
  ref
) {
  const focusable =
    Component === 'button' ||
    Component === 'a' ||
    rest.href !== undefined ||
    rest.to !== undefined ||
    rest.tabIndex !== undefined;

  return (
    <Component
      ref={ref}
      className={cx(
        surface.card,
        padded && 'p-5',
        hover && `${surface.cardHover} ${transitions.base}`,
        focusable && focusRing,
        className
      )}
      {...rest}
    >
      {children}
    </Component>
  );
});

export { Card };
export default Card;
