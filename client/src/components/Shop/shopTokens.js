/**
 * Shop design tokens.
 *
 * These moved to `src/design/tokens.js`, which is now the single source of
 * truth for the storefront and the admin console alike. This file stays as a
 * re-export so the shop screens that import from it keep working unchanged:
 *
 *   components/Pages/Products.jsx
 *   components/Pages/ProductDetail.jsx
 *   components/Shop/DeliveryNote.jsx
 *
 * New code should import from `src/design/tokens` directly.
 */

export {
  badge,
  button,
  chip,
  control,
  currencySymbol,
  cx,
  focusRing,
  focusRingOnDark,
  formatAmount,
  formatFromPrice,
  formatMoney,
  getPricingSummary,
  modal,
  resolvePrimaryImage,
  status,
  statusTone,
  surface,
  table,
  transitions,
  type,
} from '../../design/tokens';
