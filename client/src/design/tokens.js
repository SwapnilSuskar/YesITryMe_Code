/**
 * Design tokens - one visual language for the whole app: the storefront (shop
 * listing / detail / checkout) and the admin console.
 *
 * Grown out of components/Shop/shopTokens.js, which now re-exports this file so
 * the shop screens keep working untouched.
 *
 * Everything exported here is either a Tailwind class string or a pure
 * formatter. No state, no side effects, no API calls, no JSX.
 *
 * Palette
 *   solid fills          brand.deep      #CC3E00  white on it = 4.93:1 (AA pass)
 *   fill hover / active  brand.deeper    #B33700  white on it = 6.06:1
 *   accents / borders    brand.primary   #FF4E00  never behind white text: 3.31:1
 *   selection / tints    brand.primary/10, brand.primary/25
 *   structure            neutral slates
 *   type                 Inter via font-canva. index.css loads 400/500/600/700
 *                        only, so nothing here goes above `font-bold`.
 *
 * Colour is semantic, never decorative - one meaning per hue:
 *   emerald = success/paid   amber = pending/warning   red = failed/destructive
 *   blue    = informational  slate = neutral           orange = the one action
 *
 * Radii are exactly three: rounded-lg (dense controls), rounded-xl (inputs and
 * buttons), rounded-2xl (cards). Depth is one hairline border plus one soft
 * layered shadow - never stacked shadows.
 */

/* --------------------------------- motion --------------------------------- */
/** 150-250ms only, and every token opts out under prefers-reduced-motion. */
export const transitions = {
  fast: 'transition duration-150 ease-out motion-reduce:transition-none',
  base: 'transition duration-200 ease-out motion-reduce:transition-none',
  slow: 'transition duration-[250ms] ease-out motion-reduce:transition-none',
  zoom:
    'transition-transform duration-[250ms] ease-out motion-reduce:transition-none motion-reduce:transform-none',
};

/* ---------------------------------- focus --------------------------------- */
export const focusRing =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white';

export const focusRingOnDark =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950';

/* -------------------------------- surfaces -------------------------------- */
export const surface = {
  page: 'min-h-screen bg-slate-50 font-canva text-slate-900 antialiased',
  shell: 'mx-auto w-full max-w-7xl px-4 sm:px-6',
  card: 'rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_30px_-18px_rgba(15,23,42,0.28)]',
  cardHover:
    'hover:border-slate-300 hover:shadow-[0_2px_6px_rgba(15,23,42,0.06),0_20px_44px_-22px_rgba(15,23,42,0.38)]',
  inset: 'rounded-xl border border-slate-200/70 bg-slate-50',
  accent: 'rounded-2xl border border-brand-primary/25 bg-brand-primary/5',
  /* Navbar is a fixed h-14 (56px) bar, so sticky elements sit just below it. */
  stickyTop: 'sticky top-[4.5rem] z-30',
  /* Admin chrome. Both are structural, so they carry a hairline and no shadow. */
  sidebar:
    'flex h-full w-64 shrink-0 flex-col border-r border-slate-200/80 bg-white',
  topbar:
    'sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200/80 bg-white px-4 sm:px-6',
};

/* ----------------------------------- type --------------------------------- */
/* One h1, one section style, one body style, one muted style - for every screen.
   Nothing lighter than slate-500 carries copy (slate-400 on white is 2.56:1). */
export const type = {
  eyebrow: 'text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500',
  h1: 'text-2xl font-bold leading-tight tracking-tight text-slate-900 sm:text-3xl',
  h2: 'text-lg font-bold tracking-tight text-slate-900',
  h3: 'text-base font-semibold leading-snug text-slate-900',
  body: 'text-sm leading-relaxed text-slate-600',
  muted: 'text-xs text-slate-500',
  price: 'font-bold tabular-nums text-slate-900',
  /* Table type is denser than page type: rows read as data, not as prose. */
  tableHead:
    'text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500',
  cell: 'text-sm text-slate-700',
  cellNum: 'text-sm tabular-nums text-slate-900',
};

/* --------------------------------- controls ------------------------------- */
export const control = {
  input: `w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 ${transitions.base} focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/25 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500`,
  select: `w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3.5 pr-10 text-sm font-medium text-slate-900 ${transitions.base} focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/25 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500`,
  selectCaret:
    'pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500',
  textarea: `w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-slate-900 placeholder:text-slate-500 ${transitions.base} focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/25 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500`,
  label: 'block text-sm font-medium text-slate-700',
  help: 'text-xs text-slate-500',
  error: 'text-xs font-medium text-red-700',
  required: 'ml-0.5 text-brand-primary',
  checkbox: `h-4 w-4 shrink-0 rounded border-slate-300 text-brand-deep ${transitions.fast} ${focusRing}`,
};

/* --------------------------------- buttons -------------------------------- */
/* Solid fills use brand-deep; brand-primary stays on borders, rings and tints. */
export const button = {
  primary: `inline-flex items-center justify-center gap-2 rounded-xl bg-brand-deep px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-deeper disabled:cursor-not-allowed disabled:opacity-50 ${transitions.base} ${focusRing}`,
  dark: `inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 ${transitions.base} ${focusRing}`,
  outline: `inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 ${transitions.base} ${focusRing}`,
  ghost: `inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 ${transitions.base} ${focusRing}`,
  icon: `inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 ${transitions.base} ${focusRing}`,
  /* red-600 (4.83:1) and emerald-700 (5.48:1) are the lightest steps that keep
     white label text at AA. emerald-600 is 3.77:1 and is not used behind text. */
  danger: `inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 ${transitions.base} ${focusRing}`,
  success: `inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50 ${transitions.base} ${focusRing}`,
  /* Size modifier - appended to a variant above, it overrides the padding. */
  sm: 'px-3 py-1.5 text-xs',
};

/* ---------------------------------- chips --------------------------------- */
export const chip = {
  base: `inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium ${transitions.base} ${focusRing}`,
  off: 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-100',
  on: 'border-brand-deep bg-brand-deep text-white shadow-sm hover:bg-brand-deeper',
  tag: 'inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600',
};

/* --------------------------------- badges --------------------------------- */
export const badge = {
  neutral:
    'inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600',
  accent:
    'inline-flex items-center gap-1.5 rounded-full bg-brand-primary/10 px-2.5 py-1 text-[11px] font-semibold text-brand-deeper',
  featured:
    'inline-flex items-center gap-1 rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-sm',
  fresh:
    'inline-flex items-center rounded-full bg-emerald-700 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-sm',
  popular:
    'inline-flex items-center rounded-full bg-brand-deep px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white',
};

/* --------------------------------- status --------------------------------- */
/* Semantic badge strings. One hue, one meaning, app-wide. Every foreground is
   >= 4.5:1 on its own tint (emerald 5.21, amber 4.84, red 5.91, blue 6.16,
   slate 7.24). `pending` deliberately shares amber with `warning`. */
const statusBase =
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize';

export const status = {
  success: `${statusBase} border-emerald-200 bg-emerald-50 text-emerald-700`,
  warning: `${statusBase} border-amber-200 bg-amber-50 text-amber-700`,
  danger: `${statusBase} border-red-200 bg-red-50 text-red-700`,
  info: `${statusBase} border-blue-200 bg-blue-50 text-blue-700`,
  neutral: `${statusBase} border-slate-200 bg-slate-50 text-slate-600`,
  pending: `${statusBase} border-amber-200 bg-amber-50 text-amber-700`,
};

/**
 * Every status string the app uses, mapped to one of the six tones above, so
 * one word means one colour everywhere. Keys are normalised to lower_snake, so
 * 'KYC Verified', 'kyc-verified' and 'kyc_verified' all land on the same tone.
 * Anything unrecognised falls back to 'neutral'.
 */
const STATUS_TONES = {
  /* settled, paid, done */
  active: 'success',
  approved: 'success',
  completed: 'success',
  verified: 'success',
  kyc_verified: 'success',
  published: 'success',
  paid: 'success',
  delivered: 'success',
  success: 'success',
  /* in flight */
  pending: 'pending',
  processing: 'pending',
  submitted: 'pending',
  /* needs attention, but not an error */
  draft: 'warning',
  on_hold: 'warning',
  unverified: 'warning',
  /* refused, failed, destructive */
  rejected: 'danger',
  failed: 'danger',
  cancelled: 'danger',
  canceled: 'danger',
  blocked: 'danger',
  suspended: 'danger',
  expired: 'danger',
  /* informational */
  refunded: 'info',
  free: 'info',
  shipped: 'info',
  /* dormant */
  inactive: 'neutral',
  archived: 'neutral',
  closed: 'neutral',
};

export function statusTone(value) {
  if (!value) return 'neutral';
  const key = String(value).trim().toLowerCase().replace(/[\s-]+/g, '_');
  return STATUS_TONES[key] || 'neutral';
}

/* --------------------------------- tables --------------------------------- */
/* Rows land at ~46px: admin screens are for reading data fast. The wrapper owns
   the horizontal scroll so the page body never scrolls sideways. */
export const table = {
  wrap: 'w-full overflow-x-auto overscroll-x-contain rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_30px_-18px_rgba(15,23,42,0.28)]',
  table: 'w-full min-w-full border-collapse text-left',
  thead: 'sticky top-0 z-10 bg-slate-50',
  th: 'whitespace-nowrap border-b border-slate-200 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500',
  thSortable: `cursor-pointer select-none hover:text-slate-900 ${transitions.fast} ${focusRing}`,
  tbody: 'divide-y divide-slate-200/70',
  tr: `${transitions.fast} hover:bg-slate-50`,
  td: 'px-4 py-3 align-middle text-sm text-slate-700',
  tdNum: 'px-4 py-3 text-right align-middle text-sm tabular-nums text-slate-900',
  tdActions: 'whitespace-nowrap px-4 py-3 text-right align-middle',
};

/* --------------------------------- modals --------------------------------- */
/* The panel is capped at 90vh and its BODY scrolls - never the page behind it. */
export const modal = {
  backdrop:
    'fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-6',
  panel:
    'flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_24px_64px_-24px_rgba(15,23,42,0.45)] sm:rounded-2xl',
  header:
    'flex shrink-0 items-start justify-between gap-4 border-b border-slate-200/80 px-5 py-4',
  body: 'min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4',
  footer:
    'flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-slate-200/80 bg-slate-50 px-5 py-3.5',
};

/* -------------------------------- formatters ------------------------------ */
export const currencySymbol = (currency) =>
  !currency || currency === 'INR' ? '₹' : `${currency} `;

export const formatAmount = (value, decimals = 0) =>
  Number(value).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

export const formatMoney = (value, currency = 'INR', decimals = 0) =>
  `${currencySymbol(currency)}${formatAmount(value, decimals)}`;

/**
 * Min/max/currency/count across a product's pricing packages.
 * Same arithmetic the listing page has always used.
 */
export function getPricingSummary(pricing) {
  if (!Array.isArray(pricing) || pricing.length === 0) {
    return { min: null, max: null, currency: 'INR', count: 0 };
  }
  const prices = pricing.map((p) => p.price).filter((n) => typeof n === 'number');
  if (prices.length === 0) {
    return {
      min: null,
      max: null,
      currency: pricing[0]?.currency || 'INR',
      count: pricing.length,
    };
  }
  const currency = pricing.find((p) => p.currency)?.currency || 'INR';
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
    currency,
    count: pricing.length,
  };
}

/**
 * "from Rs.X" pricing for a card, split into parts so the card can style the
 * prefix and the number independently.
 */
export function formatFromPrice({ min, max, currency, count }) {
  if (min == null) {
    return { prefix: null, primary: 'See options', secondary: null };
  }
  const sym = currencySymbol(currency);
  if (min === max) {
    return {
      prefix: null,
      primary: `${sym}${formatAmount(min)}`,
      secondary: count > 1 ? `${count} packages` : null,
    };
  }
  return {
    prefix: 'from',
    primary: `${sym}${formatAmount(min)}`,
    secondary: `up to ${sym}${formatAmount(max)} · ${count} packages`,
  };
}

/** Primary image if flagged, else the first one. */
export const resolvePrimaryImage = (images) => {
  if (!Array.isArray(images) || images.length === 0) return null;
  return images.find((img) => img?.isPrimary) || images[0];
};

/* --------------------------------- helpers -------------------------------- */
/** Join conditional class strings: cx('a', false && 'b', 'c') -> 'a c'. */
export const cx = (...parts) => parts.filter(Boolean).join(' ');
