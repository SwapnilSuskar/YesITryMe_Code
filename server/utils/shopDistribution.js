/**
 * Shop distribution — product orders ONLY.
 *
 * Deliberately separate from `scaleStandardCommissionPool.js`, which super
 * packages still use. The two structures are different and must stay
 * independent: editing one must never move the other.
 *
 *   pool        = distributionPercent% of the line subtotal (default 5%)
 *   self  (buyer)   50%
 *   level 1         20%
 *   level 2         10%
 *   levels 3–119    20%, shared equally across those 117 levels
 *
 * Level 119 is the deepest a sponsor chain can reach: `getSponsorGenealogy`
 * walks at most 120 hops and skips the buyer, so it emits sponsor levels 1–119.
 *
 * ---------------------------------------------------------------------------
 * Rounding
 *
 * All arithmetic is in integer paise. The tail is taken as the REMAINDER after
 * self/L1/L2, not computed independently, so the parts always add up to the
 * pool exactly. The old super-package helper computes every level separately
 * and then dumps the leftover onto level 1, which quietly costs the direct
 * sponsor up to a rupee per order. This does not do that.
 */

export const DEFAULT_DISTRIBUTION_PERCENT = 5;

export const SHOP_SPLIT = {
  self: 50,
  level1: 20,
  level2: 10,
  tail: 20,
};

export const SHOP_TAIL_FIRST_LEVEL = 3;
export const SHOP_TAIL_LAST_LEVEL = 119;
export const SHOP_TAIL_LEVEL_COUNT =
  SHOP_TAIL_LAST_LEVEL - SHOP_TAIL_FIRST_LEVEL + 1; // 117
export const SHOP_MAX_LEVEL = SHOP_TAIL_LAST_LEVEL;

/** Percentage each tail level receives. ~0.1709%. */
export const SHOP_TAIL_PERCENT_EACH = SHOP_SPLIT.tail / SHOP_TAIL_LEVEL_COUNT;

const toPaise = (rupees) => Math.max(0, Math.round((Number(rupees) || 0) * 100));
const toRupees = (paise) => Math.round(paise) / 100;

/**
 * The pool for one order line.
 *
 * @param {number} lineSubtotal  what the customer paid for the line (price x qty)
 * @param {number} percent       the product's distributionPercent
 * @returns {number} rupees, 2dp
 */
export function shopPoolForLine(lineSubtotal, percent = DEFAULT_DISTRIBUTION_PERCENT) {
  const base = Number(lineSubtotal) || 0;
  const pct = Number(percent);
  if (!(base > 0) || !Number.isFinite(pct) || !(pct > 0)) return 0;
  return toRupees(Math.round((base * pct) / 100 * 100));
}

/**
 * Split a pool into the buyer's share plus levels 1–119.
 *
 * @param {number} poolRupees
 * @returns {{
 *   self: { level: number, percentage: number, amount: number },
 *   levels: Array<{ level: number, percentage: number, amount: number }>,
 *   total: number
 * }}
 */
export function buildShopDistribution(poolRupees) {
  const poolPaise = toPaise(poolRupees);

  const empty = {
    self: { level: 0, percentage: SHOP_SPLIT.self, amount: 0 },
    levels: [],
    total: 0,
  };
  if (poolPaise <= 0) return empty;

  const selfPaise = Math.round((poolPaise * SHOP_SPLIT.self) / 100);
  const l1Paise = Math.round((poolPaise * SHOP_SPLIT.level1) / 100);
  const l2Paise = Math.round((poolPaise * SHOP_SPLIT.level2) / 100);

  // Remainder, not an independent calculation — this is what keeps the sum exact.
  const tailPaise = Math.max(0, poolPaise - selfPaise - l1Paise - l2Paise);

  const levels = [
    { level: 1, percentage: SHOP_SPLIT.level1, amount: toRupees(l1Paise) },
    { level: 2, percentage: SHOP_SPLIT.level2, amount: toRupees(l2Paise) },
  ];

  // Spread the tail evenly, handing the indivisible remainder to the shallowest
  // levels one paisa at a time. Deterministic, and never loses a paisa.
  const perLevel = Math.floor(tailPaise / SHOP_TAIL_LEVEL_COUNT);
  let spare = tailPaise - perLevel * SHOP_TAIL_LEVEL_COUNT;

  for (let level = SHOP_TAIL_FIRST_LEVEL; level <= SHOP_TAIL_LAST_LEVEL; level++) {
    let paise = perLevel;
    if (spare > 0) {
      paise += 1;
      spare -= 1;
    }
    levels.push({
      level,
      percentage: SHOP_TAIL_PERCENT_EACH,
      amount: toRupees(paise),
    });
  }

  return {
    self: { level: 0, percentage: SHOP_SPLIT.self, amount: toRupees(selfPaise) },
    levels,
    total: toRupees(poolPaise),
  };
}
