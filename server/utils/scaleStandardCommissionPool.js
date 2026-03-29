/**
 * 120-level distribution — percentages of the pool (sums to 100%):
 * L1: 50%, L2: 20%, L3: 10%, L4: 2%, L5: 2%,
 * L6–L20: 1% each (15 levels),
 * L21–L120: 0.01% each (100 levels).
 */
const roundMoney = (n) => Math.round(Number(n) * 100) / 100;

export function generateStandardCommissionTemplate() {
  const rows = [];
  rows.push({ level: 1, percentage: 50 });
  rows.push({ level: 2, percentage: 20 });
  rows.push({ level: 3, percentage: 10 });
  rows.push({ level: 4, percentage: 2 });
  rows.push({ level: 5, percentage: 2 });
  for (let i = 6; i <= 20; i++) {
    rows.push({ level: i, percentage: 1 });
  }
  for (let i = 21; i <= 120; i++) {
    rows.push({ level: i, percentage: 0.01 });
  }
  return rows;
}

/**
 * @param {number} poolRupees - Total rupees to split across 120 levels
 * @returns {Array<{ level: number, percentage: number, amount: number }>}
 */
export function scaleCommissionStructureToPool(poolRupees) {
  const template = generateStandardCommissionTemplate();
  const pool = Math.max(0, roundMoney(poolRupees));
  if (pool < 0.01) {
    return template.map((t) => ({ ...t, amount: 0 }));
  }
  const rows = template.map((t) => ({
    level: t.level,
    percentage: t.percentage,
    amount: roundMoney((pool * t.percentage) / 100),
  }));
  const sum = rows.reduce((s, r) => s + r.amount, 0);
  const diff = roundMoney(pool - sum);
  if (Math.abs(diff) >= 0.001 && rows.length > 0) {
    rows[0].amount = roundMoney(rows[0].amount + diff);
  }
  return rows;
}

/** ₹500 reference snapshot (e.g. super packages stored in DB) — uses same % formula */
export function buildCommissionStructureForReferenceRupees(referencePool = 500) {
  return scaleCommissionStructureToPool(referencePool);
}
