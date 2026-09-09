import { forwardRef } from 'react';
import { cx, status as statusTokens, statusTone } from '../../design/tokens';

/**
 * Normalise the way tokens.statusTone() does, so the two agree on what a key is.
 * 'KYC Verified', 'kyc-verified' and 'kyc_verified' are all one status.
 */
const normalise = (value) =>
  String(value == null ? '' : value)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

/**
 * Compound statuses resolve on their last segment, so a prefixed word keeps the
 * colour its meaning deserves: the API's `payment_success` is green like every
 * other success, and `payment_submitted` is amber like every other in-flight
 * state. Without this they would both fall to grey, which reads as "dormant".
 *
 * Only applied when statusTone() itself found nothing, and only when the tail
 * resolves to something - so a mapped word (kyc_verified, on_hold) and a
 * genuinely neutral one (inactive, archived, fund_debit) are left alone.
 */
function resolveTone(value) {
  const direct = statusTone(value);
  if (direct !== 'neutral') return direct;

  const key = normalise(value);
  const tail = key.slice(key.lastIndexOf('_') + 1);
  if (!tail || tail === key) return direct;

  const fromTail = statusTone(tail);
  return fromTail === 'neutral' ? direct : fromTail;
}

/** 'kyc_verified' -> 'KYC verified', 'payment_success' -> 'payment success'. */
function humanise(value) {
  const words = normalise(value).replace(/_+/g, ' ');
  if (!words) return '';
  /* The status token capitalises the first letter; KYC stays an acronym. */
  if (/^kyc\b/.test(words)) return `KYC${words.slice(3)}`;
  return words;
}

/**
 * One status word, one colour, on every screen.
 *
 *   <StatusBadge status="pending" />
 *   <StatusBadge status={order.status} />
 *   <StatusBadge status="payment_success" label="Payment done" />
 *   <StatusBadge status={row.state} icon={Clock} />
 *
 * The colour is derived from tokens.statusTone() - never passed in by the
 * screen. That is the whole point: `active` was amber on one screen and green
 * on another because each screen carried its own switch statement.
 *
 * `tone` exists only as an escape hatch for a status the map has never seen. In
 * development it warns if it is used to override a status the map already
 * resolves, because that is exactly how the screens drifted apart before.
 */
const StatusBadge = forwardRef(function StatusBadge(
  { status, label, tone, icon: Icon, className = '', ...rest },
  ref
) {
  if (status == null && !label) return null;

  const derived = resolveTone(status);
  const resolved = statusTokens[tone] ? tone : derived;

  if (process.env.NODE_ENV !== 'production' && tone) {
    if (!statusTokens[tone]) {
      // eslint-disable-next-line no-console
      console.warn(
        `[StatusBadge] tone="${tone}" is not a token tone. Use one of: ${Object.keys(
          statusTokens
        ).join(', ')}.`
      );
    } else if (status != null && derived !== 'neutral' && derived !== tone) {
      // eslint-disable-next-line no-console
      console.warn(
        `[StatusBadge] "${status}" already maps to "${derived}" app-wide; tone="${tone}" makes this screen disagree with the others. Drop the tone prop, or map the status in design/tokens.js.`
      );
    }
  }

  const text = label || humanise(status);

  return (
    <span ref={ref} className={cx(statusTokens[resolved], className)} {...rest}>
      {Icon ? <Icon className="h-3 w-3 shrink-0" aria-hidden="true" /> : null}
      {text}
    </span>
  );
});

export { StatusBadge };
export default StatusBadge;
