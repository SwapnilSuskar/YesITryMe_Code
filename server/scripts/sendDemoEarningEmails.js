import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Sends one demo credit email and one demo withdrawal email with made-up
// amounts, so you can see how they look. Does not touch the database.
//
// Usage (from server/): node scripts/sendDemoEarningEmails.js you@example.com
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const to = process.argv[2];
if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
  console.error("Usage: node scripts/sendDemoEarningEmails.js you@example.com");
  process.exit(1);
}
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  console.error("EMAIL_USER / EMAIL_PASSWORD missing in server/.env");
  process.exit(1);
}

const { buildCreditEmailData, buildWithdrawalEmailData, sendEarningEmail } = await import(
  "../services/earningEmailService.js"
);

const user = { firstName: "Avishkar", lastName: "Kakde", referralCode: "YITM48213" };
const now = new Date();

const credit = buildCreditEmailData(
  user,
  {
    type: "commission",
    amount: 2500,
    level: 1,
    packageName: "Daimond",
    purchaserName: "Rahul Patil",
    createdAt: now,
  },
  { balance: 18450 },
);

const withdrawal = buildWithdrawalEmailData(
  user,
  { amount: 15000, netAmount: 13500, tds: 750, adminCharge: 750, paymentMethod: "bank_transfer", processedDate: now },
);

const opts = { subjectPrefix: "[DEMO] " };
const results = [
  await sendEarningEmail(credit, to, opts),
  await sendEarningEmail(withdrawal, to, opts),
];
console.log(results.every(Boolean) ? `Done: 2 demo emails sent to ${to}` : "Some demo emails failed (see errors above)");
process.exit(results.every(Boolean) ? 0 : 1);
