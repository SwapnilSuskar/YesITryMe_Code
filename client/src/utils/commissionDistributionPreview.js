/**
 * Distribution previews.
 *
 * Two different structures live here, and they must not be confused:
 *
 *   SUPER PACKAGES — `scaleDistributionPoolToLevels`
 *     L1 50%, L2 20%, L3 10%, L4–L5 2%, L6–L20 1%, L21–L120 0.01%.
 *     Mirrors server/utils/scaleStandardCommissionPool.js.
 *
 *   SHOP (product orders) — `buildShopDistributionPreview`
 *     buyer 50%, L1 20%, L2 10%, L3–L119 share 20%.
 *     Mirrors server/utils/shopDistribution.js, including its paise-exact
 *     rounding, so the preview never disagrees with what actually gets paid.
 */
const roundMoney = (n) => Math.round(Number(n) * 100) / 100;

/* ------------------------------ super packages ----------------------------- */

export function levelPercentages120() {
  const p = [50, 20, 10, 2, 2];
  for (let i = 0; i < 15; i++) p.push(1);
  for (let i = 0; i < 100; i++) p.push(0.01);
  return p;
}

/** @returns {{ level: number, percentage: number, amount: number }[]} */
export function scaleDistributionPoolToLevels(poolRupees) {
  const pool = Math.max(0, roundMoney(poolRupees));
  if (pool < 0.01) return [];
  const pcts = levelPercentages120();
  const rows = pcts.map((pct, idx) => ({
    level: idx + 1,
    percentage: pct,
    amount: roundMoney((pool * pct) / 100),
  }));
  const sum = rows.reduce((s, r) => s + r.amount, 0);
  const diff = roundMoney(pool - sum);
  if (Math.abs(diff) >= 0.001 && rows.length) {
    rows[0].amount = roundMoney(rows[0].amount + diff);
  }
  return rows;
}

/**
 * Group 120 rows for UI: L1–5 individual, L6–20 and L21–120 aggregated with summed ₹.
 */
export function groupDistributionForDisplay(rows) {
  if (!rows?.length) return [];
  const out = [];
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    const r = rows[i];
    out.push({
      key: `l${r.level}`,
      label: `Level ${r.level}`,
      percentageLabel: `${r.percentage}%`,
      amount: r.amount,
    });
  }
  if (rows.length > 5) {
    const slice620 = rows.slice(5, 20);
    const sum620 = roundMoney(slice620.reduce((s, r) => s + r.amount, 0));
    out.push({
      key: '6-20',
      label: 'Levels 6–20',
      percentageLabel: '1% each',
      amount: sum620,
    });
  }
  if (rows.length > 20) {
    const slice21120 = rows.slice(20);
    const sum21120 = roundMoney(slice21120.reduce((s, r) => s + r.amount, 0));
    out.push({
      key: '21-120',
      label: 'Levels 21–120',
      percentageLabel: '0.01% each',
      amount: sum21120,
    });
  }
  return out;
}

/* ---------------------------------- shop ---------------------------------- */

export const DEFAULT_DISTRIBUTION_PERCENT = 5;

export const SHOP_SPLIT = { self: 50, level1: 20, level2: 10, tail: 20 };
export const SHOP_TAIL_FIRST_LEVEL = 3;
export const SHOP_TAIL_LAST_LEVEL = 119;
export const SHOP_TAIL_LEVEL_COUNT =
  SHOP_TAIL_LAST_LEVEL - SHOP_TAIL_FIRST_LEVEL + 1; // 117
export const SHOP_TAIL_PERCENT_EACH = SHOP_SPLIT.tail / SHOP_TAIL_LEVEL_COUNT;

const toPaise = (rupees) => Math.max(0, Math.round((Number(rupees) || 0) * 100));
const toRupees = (paise) => Math.round(paise) / 100;

/** Pool for one line: `percent`% of what the customer pays for it. */
export function shopPoolForLine(lineSubtotal, percent = DEFAULT_DISTRIBUTION_PERCENT) {
  const base = Number(lineSubtotal) || 0;
  const pct = Number(percent);
  if (!(base > 0) || !Number.isFinite(pct) || !(pct > 0)) return 0;
  return roundMoney((base * pct) / 100);
}

/**
 * @returns {{
 *   self: { level: number, percentage: number, amount: number },
 *   levels: Array<{ level: number, percentage: number, amount: number }>,
 *   total: number
 * }}
 */
export function buildShopDistributionPreview(poolRupees) {
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
  const tailPaise = Math.max(0, poolPaise - selfPaise - l1Paise - l2Paise);

  const levels = [
    { level: 1, percentage: SHOP_SPLIT.level1, amount: toRupees(l1Paise) },
    { level: 2, percentage: SHOP_SPLIT.level2, amount: toRupees(l2Paise) },
  ];

  const perLevel = Math.floor(tailPaise / SHOP_TAIL_LEVEL_COUNT);
  let spare = tailPaise - perLevel * SHOP_TAIL_LEVEL_COUNT;
  for (let level = SHOP_TAIL_FIRST_LEVEL; level <= SHOP_TAIL_LAST_LEVEL; level++) {
    let paise = perLevel;
    if (spare > 0) {
      paise += 1;
      spare -= 1;
    }
    levels.push({ level, percentage: SHOP_TAIL_PERCENT_EACH, amount: toRupees(paise) });
  }

  return {
    self: { level: 0, percentage: SHOP_SPLIT.self, amount: toRupees(selfPaise) },
    levels,
    total: toRupees(poolPaise),
  };
}

/** Four display rows: the buyer, L1, L2, and the L3–L119 block. */
export function groupShopDistributionForDisplay(split) {
  if (!split || split.total <= 0) return [];
  const tail = split.levels.filter((r) => r.level >= SHOP_TAIL_FIRST_LEVEL);
  const tailSum = roundMoney(tail.reduce((s, r) => s + r.amount, 0));
  return [
    {
      key: 'self',
      label: 'You (the buyer)',
      percentageLabel: `${SHOP_SPLIT.self}%`,
      amount: split.self.amount,
    },
    {
      key: 'l1',
      label: 'Your sponsor',
      percentageLabel: `${SHOP_SPLIT.level1}%`,
      amount: split.levels[0]?.amount ?? 0,
    },
    {
      key: 'l2',
      label: 'Level 2',
      percentageLabel: `${SHOP_SPLIT.level2}%`,
      amount: split.levels[1]?.amount ?? 0,
    },
    {
      key: 'tail',
      label: `Levels ${SHOP_TAIL_FIRST_LEVEL}–${SHOP_TAIL_LAST_LEVEL}`,
      percentageLabel: `${SHOP_SPLIT.tail}% shared`,
      amount: tailSum,
    },
  ];
}
