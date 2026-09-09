import { forwardRef } from 'react';
import { currencySymbol, cx, formatAmount } from '../../design/tokens';

/** U+2212 MINUS SIGN. It is digit-width, so columns stay aligned; '-' is not. */
const MINUS = '\u2212';
const PLUS = '+';
/**
 * U+2014 EM DASH - the dashboard convention for "no value", which is not the
 * same claim as zero. It carries no aria-label: ARIA prohibits naming a generic
 * element, and the dash is announced by screen readers as written.
 */
const NO_VALUE = '\u2014';

/**
 * The signed tones are the same foregrounds the `status` tokens use for the
 * same meanings (danger = red-700, success = emerald-700), so a red number and
 * a red badge on the same row mean the same thing. Both clear AA on white.
 */
const SIGNED_TONE = {
  negative: 'text-red-700',
  positive: 'text-emerald-700',
};

/**
 * Every amount in the app renders through this, so grouping, the currency
 * symbol and the figure width are identical on all 28 screens.
 *
 *   <Money value={order.total} />              -> Rs.12,34,567   (en-IN grouping)
 *   <Money value={-4500} />                    -> [minus]Rs.4,500
 *   <Money value={txn.amount} signed />        -> +Rs.900 green / [minus]Rs.900 red
 *   <Money value={fee} decimals={2} />         -> Rs.199.00
 *   <Money value={row.balance} currency="USD" />
 *
 * A debit never loses its sign. The sign is split off the number and put back
 * in front of the symbol, so the magnitude can be grouped on its own - there is
 * no bare Math.abs() in the output path, and no branch that can drop the minus.
 * This replaces the `amount > 0 ? '+' : ''` + `Math.abs(amount)` pattern, which
 * renders a -500 debit as "+/- nothing, Rs.500" - a credit and a debit reading
 * identically.
 *
 * `signed` turns on both the explicit + on credits and the semantic colour.
 * Without it the amount is a plain figure in the inherited colour (a negative
 * still keeps its minus sign - `signed` never controls that).
 */
const Money = forwardRef(function Money(
  {
    value,
    currency = 'INR',
    signed = false,
    decimals = 0,
    className = '',
    ...rest
  },
  ref
) {
  /* Number(null) and Number('') are both 0, which would print a missing amount
     as Rs.0 - a lie on a balance column. Screen them out before converting. */
  const missing = value === null || value === undefined || value === '';
  const amount = missing ? Number.NaN : Number(value);

  if (!Number.isFinite(amount)) {
    return (
      <span
        ref={ref}
        className={cx('tabular-nums text-slate-500', className)}
        {...rest}
      >
        {NO_VALUE}
      </span>
    );
  }

  const negative = amount < 0;
  /* Negate rather than Math.abs() so the sign is a decision made once, here. */
  const magnitude = negative ? -amount : amount;
  const showPlus = signed && !negative && magnitude !== 0;

  return (
    <span
      ref={ref}
      className={cx(
        'tabular-nums',
        signed && negative && SIGNED_TONE.negative,
        signed && showPlus && SIGNED_TONE.positive,
        className
      )}
      {...rest}
    >
      {negative ? MINUS : showPlus ? PLUS : ''}
      {currencySymbol(currency)}
      {formatAmount(magnitude, decimals)}
    </span>
  );
});

export { Money };
export default Money;
