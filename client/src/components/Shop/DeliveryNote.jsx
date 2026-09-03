import { Truck } from 'lucide-react';
import { formatMoney } from './shopTokens';

/**
 * The one sentence both shop pages must say about delivery.
 *
 * Delivery is a FLAT fee charged ONCE PER ORDER (server-owned, read through
 * useFlatDeliveryCharge). It is never per product and never per unit, so this
 * component deliberately owns the wording in one place.
 *
 * @param {number|null} amount  flat charge to name explicitly; omit to keep the
 *                              note qualitative (used on listing cards, which
 *                              do not fetch the charge).
 */
const DeliveryNote = ({ amount = null, className = '', iconClassName = '' }) => (
  <p className={`flex items-start gap-1.5 ${className}`}>
    <Truck
      className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${iconClassName || 'text-slate-400'}`}
      aria-hidden="true"
    />
    {amount == null ? (
      <span>Flat delivery, charged once per order</span>
    ) : (
      <span>
        <span className="font-semibold text-slate-900">
          {formatMoney(amount)} flat delivery
        </span>{' '}
        &mdash; charged once per order, however many items.
      </span>
    )}
  </p>
);

export default DeliveryNote;
