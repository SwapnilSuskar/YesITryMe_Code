/**
 * Shop design tokens - one visual language for the product listing page and
 * the product detail page (and ready for cart/checkout to adopt, which today
 * still mix `orange-*` and `gray-*`).
 *
 * Everything exported here is either a Tailwind class string or a pure
 * formatter. No state, no side effects, no API calls.
 *
 * Palette
 *   action / selection   brand.primary   #FF4E00  (tailwind.config.js)
 *   pressed / hover      brand.secondary #E64500
 *   structure            neutral slates
 *   type                 Inter via font-canva. index.css loads 400/500/600/700
 *                        only, so nothing here goes above `font-bold`.
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
};

/* ----------------------------------- type --------------------------------- */
export const type = {
  eyebrow: 'text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500',
  h1: 'text-2xl font-bold leading-tight tracking-tight text-slate-900 sm:text-3xl',
  h2: 'text-lg font-bold tracking-tight text-slate-900',
  h3: 'text-base font-semibold leading-snug text-slate-900',
  body: 'text-sm leading-relaxed text-slate-600',
  muted: 'text-xs text-slate-500',
  price: 'font-bold tabular-nums text-slate-900',
};

/* --------------------------------- controls ------------------------------- */
export const control = {
  input: `w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 ${transitions.base} focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/25`,
  select: `w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3.5 pr-10 text-sm font-medium text-slate-900 ${transitions.base} focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/25`,
  selectCaret:
    'pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400',
};

export const button = {
  primary: `inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-secondary disabled:cursor-not-allowed disabled:opacity-50 ${transitions.base} ${focusRing}`,
  dark: `inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 ${transitions.base} ${focusRing}`,
  outline: `inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 ${transitions.base} ${focusRing}`,
  ghost: `inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 ${transitions.base} ${focusRing}`,
  icon: `inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 ${transitions.base} ${focusRing}`,
};

/* ---------------------------------- chips --------------------------------- */
export const chip = {
  base: `inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium ${transitions.base} ${focusRing}`,
  off: 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-100',
  on: 'border-brand-primary bg-brand-primary text-white shadow-sm hover:bg-brand-secondary',
  tag: 'inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600',
};

export const badge = {
  neutral:
    'inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600',
  accent:
    'inline-flex items-center gap-1.5 rounded-full bg-brand-primary/10 px-2.5 py-1 text-[11px] font-semibold text-brand-secondary',
  featured:
    'inline-flex items-center gap-1 rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-sm',
  fresh:
    'inline-flex items-center rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-sm',
  popular:
    'inline-flex items-center rounded-full bg-brand-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white',
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
