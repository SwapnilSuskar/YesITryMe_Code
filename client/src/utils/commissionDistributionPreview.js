/**
 * Same 120-level % split as server: L1 50%, L2 20%, L3 10%, L4–L5 2%,
 * L6–L20 1% each, L21–L120 0.01% each.
 */
const roundMoney = (n) => Math.round(Number(n) * 100) / 100;

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
