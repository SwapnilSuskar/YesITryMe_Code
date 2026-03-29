/**
 * Same shape as super-package ₹500 reference: levels 1–120.
 * Amounts scale linearly to an arbitrary pool (e.g. % of product line subtotal).
 */
const REFERENCE_POOL = 500;

const roundMoney = (n) => Math.round(Number(n) * 100) / 100;

export function generateStandardCommissionTemplate() {
  const structure = [];
  structure.push({ level: 1, percentage: 50, amount: 250 });
  structure.push({ level: 2, percentage: 20, amount: 100 });
  structure.push({ level: 3, percentage: 10, amount: 50 });
  structure.push({ level: 4, percentage: 2, amount: 10 });
  structure.push({ level: 5, percentage: 2, amount: 10 });
  for (let i = 6; i <= 20; i++) {
    structure.push({ level: i, percentage: 1, amount: 5 });
  }
  for (let i = 21; i <= 120; i++) {
    structure.push({ level: i, percentage: 0.01, amount: 0.05 });
  }
  return structure;
}

/**
 * @param {number} poolRupees - Total rupees to split across 120 levels (same ratios as ₹500 ref).
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
    amount: roundMoney((t.amount / REFERENCE_POOL) * pool),
  }));
  const sum = rows.reduce((s, r) => s + r.amount, 0);
  const diff = roundMoney(pool - sum);
  if (Math.abs(diff) >= 0.001 && rows.length > 0) {
    rows[0].amount = roundMoney(rows[0].amount + diff);
  }
  return rows;
}
