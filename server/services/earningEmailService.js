import { AsyncLocalStorage } from "async_hooks";
import nodemailer from "nodemailer";
import "dotenv/config";
import User from "../models/User.js";
import { renderCard, buildEmailHtml } from "./storyCard/design.js";
import { formatRupees } from "./storyCard/svgText.js";

// Emails sent when income is credited to a user, and when a withdrawal is
// paid out to them. Each email carries a 1080x1920 "story image" users can
// post on WhatsApp Status / Instagram Story with their referral code.
//
// Credit emails come from the Wallet model (models/Wallet.js) whenever a new
// income transaction is saved. Withdrawal emails are queued by the admin
// "completed" actions (payoutController, coinsController), once per payout.
//
// Settings (server/.env):
//   EARNING_EMAILS_ENABLED=false        turn these emails off
//   CREDIT_EMAIL_MIN_AMOUNT=100         skip credit emails below this amount (₹, min 1).
//                                       Deep-level commissions are often under ₹1.
//   EARNING_EMAIL_USER / EARNING_EMAIL_PASSWORD
//                                       optional separate Gmail account for these emails,
//                                       so they can't use up the daily quota that OTP and
//                                       receipt emails need. Falls back to EMAIL_USER.
//   EARNING_EMAILS_OUTSIDE_REQUEST=true also send from scripts / background jobs
//                                       (off by default so maintenance scripts stay silent)
//   PUBLIC_SITE_URL=https://www.yesitryme.com   website link shown in the emails

const SITE_URL = (process.env.PUBLIC_SITE_URL || "https://www.yesitryme.com").replace(/\/+$/, "");
const SITE_LABEL = SITE_URL.replace(/^https?:\/\//, "");
const CARD_CID = "story-card@yesitryme";

// Longest a response waits for its emails before going out anyway.
const FLUSH_TIMEOUT_MS = 5000;

// Wallet transaction types that count as income for the credit email.
const CREDIT_TYPES = new Set([
  "commission",
  "bonus",
  "fund_credit",
  "special_income_credit",
  "leadership",
  "royalty",
  "reward",
  "shop_cashback",
]);

const SPECIAL_INCOME_LABELS = {
  leaderShipFund: "Leadership Fund",
  royaltyIncome: "Royalty Income",
  rewardIncome: "Reward Income",
};

const FUND_LABELS = {
  mobileFund: "Mobile Fund",
  laptopFund: "Laptop Fund",
  bikeFund: "Bike Fund",
  carFund: "Car Fund",
  houseFund: "House Fund",
  travelFund: "Travel Fund",
};

const TYPE_LABELS = {
  bonus: "Bonus",
  leadership: "Leadership Income",
  royalty: "Royalty Income",
  reward: "Reward Income",
  fund_credit: "Wallet Credit",
};

const PAYMENT_METHOD_LABELS = {
  bank_transfer: "Bank transfer",
  upi: "UPI",
  cash: "Cash",
};

// ---------- settings ----------

const senderUser = () => process.env.EARNING_EMAIL_USER || process.env.EMAIL_USER;
const senderPass = () =>
  process.env.EARNING_EMAIL_USER ? process.env.EARNING_EMAIL_PASSWORD : process.env.EMAIL_PASSWORD;

let warnedNoCredentials = false;
const isEnabled = () => {
  if (String(process.env.EARNING_EMAILS_ENABLED ?? "true").toLowerCase() === "false") return false;
  if (!senderUser() || !senderPass()) {
    if (!warnedNoCredentials) {
      console.warn("⚠️ Earning emails off: no email credentials in server/.env");
      warnedNoCredentials = true;
    }
    return false;
  }
  return true;
};

const minCreditAmount = () => {
  const raw = String(process.env.CREDIT_EMAIL_MIN_AMOUNT ?? "").trim();
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n >= 1 ? n : 100;
};

const sendOutsideRequest = () =>
  String(process.env.EARNING_EMAILS_OUTSIDE_REQUEST ?? "").toLowerCase() === "true";

// ---------- formatting ----------

const formatDateTime = (date) =>
  new Date(date || Date.now()).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

const rupees = (amount) => `₹${formatRupees(amount)}`;

// "Rahul Patil" -> "Rahul P." (team members' full names stay private)
const shortName = (name) => {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return parts[0] || "";
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
};

const fullName = (user) =>
  [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || "YesITryMe Member";

// ---------- transporter + Gmail quota pause ----------

let transporter = null;
const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      pool: true,
      maxConnections: 3,
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 15000,
      auth: { user: senderUser(), pass: senderPass() },
    });
  }
  return transporter;
};

// When Gmail reports its daily sending limit, stop trying until midnight IST
// (per server instance) instead of hammering the account.
let pausedUntil = 0;
const nextIstMidnight = () => {
  const IST = 330 * 60 * 1000;
  const istNow = new Date(Date.now() + IST);
  istNow.setUTCHours(24, 0, 0, 0);
  return istNow.getTime() - IST;
};
const isQuotaError = (error) =>
  /daily user sending limit|sending limit exceeded|quota|5\.4\.5|4\.7\.0 Too many/i.test(
    `${error?.response || ""} ${error?.message || ""}`,
  );

// ---------- which credits get an email ----------

const isUnassignedCommission = (tx) => /^unassigned/i.test(String(tx.description || ""));

// Income a user can make a share image for (any amount from ₹1; no email minimum).
export const isIncomeTransaction = (tx) =>
  !!tx &&
  CREDIT_TYPES.has(tx.type) &&
  (tx.status || "completed") === "completed" &&
  Number(tx.amount) >= 1 &&
  !isUnassignedCommission(tx);

export const isCreditEmailable = (tx) => isIncomeTransaction(tx) && Number(tx.amount) >= minCreditAmount();

// ---------- email content ----------

// What the credit was, and where it landed (wallet, or a fund).
const creditSource = (tx) => {
  const pkg = tx.packageName ? String(tx.packageName) : "";
  if (tx.type === "commission") {
    if (tx.incomeType === "recharge_commission") return { income: "Recharge Cashback", pkg: "" };
    if (Number(tx.level) >= 1) return { income: `Level ${tx.level} Income`, pkg };
    return { income: "Commission Income", pkg };
  }
  if (tx.type === "shop_cashback") return { income: "Shop Reward", pkg };
  if (tx.type === "special_income_credit") {
    const label = SPECIAL_INCOME_LABELS[tx.incomeType] || "Special Income";
    return { income: label, pkg: "", creditedTo: label };
  }
  if (tx.type === "fund_credit" && tx.fundType) {
    const label = FUND_LABELS[tx.fundType] || "Fund";
    return { income: `${label} Credit`, pkg: "", creditedTo: label };
  }
  return { income: TYPE_LABELS[tx.type] || "Income", pkg };
};

const baseData = (user) => ({
  name: fullName(user),
  firstName: user.firstName || fullName(user).split(" ")[0],
  // No referral code anywhere in these emails or images (owner's choice), so
  // the link is the plain website rather than the user's referral link.
  referralCode: "",
  referralLink: SITE_URL,
  website: SITE_LABEL,
});

export const buildCreditEmailData = (user, tx, wallet) => {
  const { income, pkg, creditedTo } = creditSource(tx);
  const date = tx.createdAt || new Date();
  const details = [{ label: "Income type", value: income }];
  if (pkg) details.push({ label: "Package", value: pkg });
  if (tx.purchaserName && Number(tx.level) >= 1) {
    details.push({ label: "From", value: shortName(tx.purchaserName) });
  }
  details.push({ label: "Credited on", value: formatDateTime(date) });

  // Fund / special-income credits don't change the wallet balance, so don't show it.
  const balance = !creditedTo && wallet ? Number(wallet.balance) : NaN;
  return {
    ...baseData(user),
    kind: "credit",
    amount: Number(tx.amount),
    sourceLabel: pkg ? `${income} · ${pkg}` : income,
    creditedTo: creditedTo || undefined,
    date,
    details,
    walletBalance: Number.isFinite(balance) ? balance : undefined,
  };
};

/**
 * payout: { amount (gross), netAmount, tds, adminCharge, paymentMethod, processedDate, coins }
 */
export const buildWithdrawalEmailData = (user, payout) => {
  const date = payout.processedDate || new Date();
  const net = Number(payout.netAmount ?? payout.amount);
  const gross = Number(payout.amount);
  const details = [];
  if (Number(payout.coins) > 0) {
    details.push({ label: "Coins redeemed", value: `${formatRupees(payout.coins)} coins` });
  }
  if (Number.isFinite(gross) && gross !== net) {
    details.push({ label: "Withdrawal amount", value: rupees(gross) });
  }
  if (Number(payout.tds) > 0) details.push({ label: "TDS", value: `− ${rupees(payout.tds)}` });
  if (Number(payout.adminCharge) > 0) {
    details.push({ label: "Admin charge", value: `− ${rupees(payout.adminCharge)}` });
  }
  details.push({ label: "Received in bank", value: rupees(net) });
  if (PAYMENT_METHOD_LABELS[payout.paymentMethod]) {
    details.push({ label: "Paid via", value: PAYMENT_METHOD_LABELS[payout.paymentMethod] });
  }
  details.push({ label: "Paid on", value: formatDateTime(date) });

  return {
    ...baseData(user),
    kind: "withdrawal",
    amount: net,
    sourceLabel: "Paid to my bank account",
    date,
    details,
  };
};

const subjectFor = (data) =>
  data.kind === "withdrawal"
    ? `✅ ${rupees(data.amount)} withdrawal successful – it's in your bank!`
    : `🎉 ${rupees(data.amount)} credited to your YesITryMe ${data.creditedTo || "wallet"}`;

// Plain-text version for clients that don't show HTML.
const buildEmailText = (data) => {
  const lines = [
    `Hi ${data.firstName},`,
    "",
    data.kind === "withdrawal"
      ? `Your withdrawal is complete. ${rupees(data.amount)} has been received in your bank account.`
      : `${rupees(data.amount)} has been credited to your YesITryMe ${data.creditedTo || "wallet"} (${data.sourceLabel}).`,
    "",
    ...data.details.map((d) => `${d.label}: ${d.value}`),
  ];
  if (data.kind === "credit" && data.walletBalance !== undefined) {
    lines.push(`Wallet balance: ${rupees(data.walletBalance)}`);
  }
  lines.push(
    "",
    "Share your success: the attached image is ready for your WhatsApp Status or Instagram Story.",
  );
  if (data.referralCode) lines.push(`Your referral code: ${data.referralCode}`);
  lines.push(
    `Join YesITryMe: ${data.referralLink}`,
    "",
    "YesITryMe · +91 7066916324 · YesITryMeofficial@gmail.com",
    "You received this email because money moved in your YesITryMe account.",
  );
  return lines.join("\n");
};

// Story image (JPEG Buffer). It is posted publicly, so it gets only the public fields.
export const renderStoryImage = (data) => {
  const { kind, amount, name, firstName, sourceLabel, date, referralCode, referralLink, website } = data;
  return renderCard({ kind, amount, name, firstName, sourceLabel, date, referralCode, referralLink, website });
};

export const storyFileName = (kind) =>
  kind === "withdrawal" ? "YesITryMe-Withdrawal-Story.jpg" : "YesITryMe-Earning-Story.jpg";

// Renders the story image and sends the email. Never throws.
export const sendEarningEmail = async (data, email, { subjectPrefix = "" } = {}) => {
  try {
    if (!email) return false;
    if (Date.now() < pausedUntil) {
      console.warn(`⏸️ Earning email to ${email} skipped: Gmail daily limit reached earlier today`);
      return false;
    }
    const { kind, amount } = data;
    const card = await renderStoryImage(data);
    const fileName = storyFileName(kind);

    await getTransporter().sendMail({
      from: `"YesITryMe" <${senderUser()}>`,
      to: email,
      subject: `${subjectPrefix}${subjectFor(data)}`,
      html: buildEmailHtml(data, { cardCid: CARD_CID }),
      text: buildEmailText(data),
      attachments: [
        // Shown inside the email
        { filename: fileName, content: card, contentType: "image/jpeg", cid: CARD_CID },
        // Separate copy so phones show a "download" chip for posting to a story
        { filename: fileName, content: card, contentType: "image/jpeg", contentDisposition: "attachment" },
      ],
    });
    console.log(`📧 ${kind} email sent to ${email} (${rupees(amount)})`);
    return true;
  } catch (error) {
    if (isQuotaError(error)) {
      pausedUntil = nextIstMidnight();
      console.error("❌ Gmail sending limit reached; earning emails paused until midnight IST");
    }
    console.error(`❌ Failed to send ${data?.kind} email to ${email}:`, error.message);
    return false;
  }
};

// ---------- jobs ----------

const loadRecipient = async (userId) => {
  const user = await User.findOne({ userId })
    .select("firstName lastName email referralCode role status isActive")
    .lean();
  if (!user || !user.email || user.role === "admin") return null;
  if (user.status === "blocked" || user.isActive === false) return null;
  return user;
};

// Marks a payout as announced; returns false if it already was (so each
// payout gets at most one email, even if it is completed twice).
const claimOnce = async (model, id) => {
  if (!model || !id) return true;
  const result = await model.updateOne(
    { _id: id, earningEmailSentAt: null },
    { $set: { earningEmailSentAt: new Date() } },
  );
  return result.modifiedCount === 1;
};

// Builds and sends one job. Never throws.
const runJob = async (job) => {
  try {
    const user = await loadRecipient(job.userId);
    if (!user) return;
    if (job.kind === "withdrawal") {
      if (!(await claimOnce(job.onceModel, job.onceId))) return;
      await sendEarningEmail(buildWithdrawalEmailData(user, job.payout), user.email);
    } else {
      await sendEarningEmail(buildCreditEmailData(user, job.tx, { balance: job.walletBalance }), user.email);
    }
  } catch (error) {
    console.error("❌ Earning email job failed:", error.message);
  }
};

// ---------- per-request queue ----------
// Emails queued during a request are sent just before its response goes out,
// after all database work is done. Sending inside the commission loop would
// slow it down; sending after the response is unsafe on Vercel, which can
// freeze the function as soon as the response ends.

const requestStore = new AsyncLocalStorage();

const runAll = (jobs) => Promise.allSettled(jobs.map(runJob));

let warnedOutsideRequest = false;
const enqueue = async (jobs) => {
  if (!jobs.length) return;
  const store = requestStore.getStore();
  if (store && !store.flushed) {
    store.jobs.push(...jobs);
    return;
  }
  if (store) {
    // Work done after this request's response went out: send now.
    await runAll(jobs);
    return;
  }
  if (sendOutsideRequest()) {
    await runAll(jobs);
    return;
  }
  if (!warnedOutsideRequest) {
    console.log("ℹ️ Earning emails skipped outside a web request (set EARNING_EMAILS_OUTSIDE_REQUEST=true to send)");
    warnedOutsideRequest = true;
  }
};

// Called by the Wallet model after a save with the transactions it just added. Never throws.
export const queueWalletEmails = async (wallet, newTransactions) => {
  try {
    if (!isEnabled() || !wallet || !newTransactions?.length) return;
    const jobs = newTransactions.filter(isCreditEmailable).map((tx) => ({
      kind: "credit",
      userId: wallet.userId,
      tx: typeof tx.toObject === "function" ? tx.toObject() : { ...tx },
      walletBalance: wallet.balance,
    }));
    await enqueue(jobs);
  } catch (error) {
    console.error("❌ Could not queue wallet emails:", error.message);
  }
};

// Call after a Payout is saved as "completed". Sends at most once per payout. Never throws.
export const queuePayoutEmail = async (payout) => {
  try {
    if (!isEnabled() || !payout || payout.status !== "completed" || !(Number(payout.netAmount ?? payout.amount) > 0)) return;
    await enqueue([
      {
        kind: "withdrawal",
        userId: payout.userId,
        onceModel: payout.constructor,
        onceId: payout._id,
        payout: {
          amount: payout.amount,
          netAmount: payout.netAmount,
          tds: payout.tds,
          adminCharge: payout.adminCharge,
          paymentMethod: payout.paymentMethod,
          processedDate: payout.processedDate,
        },
      },
    ]);
  } catch (error) {
    console.error("❌ Could not queue payout email:", error.message);
  }
};

// Call after a social-earning (coins) WithdrawalRequest is saved as "completed". Never throws.
export const queueCoinWithdrawalEmail = async (request) => {
  try {
    if (!isEnabled() || !request || request.status !== "completed" || !(Number(request.amount) > 0)) return;
    await enqueue([
      {
        kind: "withdrawal",
        userId: request.userId,
        onceModel: request.constructor,
        onceId: request._id,
        payout: {
          amount: request.amount,
          netAmount: request.amount,
          coins: request.coins,
          processedDate: request.completedAt,
        },
      },
    ]);
  } catch (error) {
    console.error("❌ Could not queue coin withdrawal email:", error.message);
  }
};

const flush = async (store) => {
  store.flushed = true;
  const jobs = store.jobs.splice(0);
  if (!jobs.length) return;
  let timer;
  await Promise.race([
    runAll(jobs),
    new Promise((resolve) => {
      timer = setTimeout(() => {
        console.warn(`⚠️ Earning emails still sending after ${FLUSH_TIMEOUT_MS}ms; sending response anyway`);
        resolve();
      }, FLUSH_TIMEOUT_MS);
    }),
  ]);
  clearTimeout(timer);
};

// Express middleware: holds the response until queued earning emails are sent.
// Requests that queue nothing are not delayed. Covers res.send / res.json /
// res.jsonp / res.sendStatus (they all go through res.send).
export const earningEmailMiddleware = (req, res, next) => {
  const store = { jobs: [], flushed: false };
  const originalSend = res.send;
  let pending = false;

  res.send = function sendAfterEmails(...args) {
    if (pending) {
      console.warn("⚠️ Response already being sent after earning emails; ignoring a second send");
      return this;
    }
    if (store.flushed || store.jobs.length === 0) {
      store.flushed = true;
      return originalSend.apply(this, args);
    }
    pending = true;
    const statusCode = res.statusCode;
    flush(store)
      .catch(() => {})
      .finally(() => {
        // Put Express's send back so res.send(object) -> res.json -> res.send works normally.
        res.send = originalSend;
        if (res.headersSent || res.writableEnded) return;
        res.statusCode = statusCode;
        try {
          res.send(...args);
        } catch (error) {
          console.error("❌ Could not send response after earning emails:", error.message);
          res.destroy(error);
        }
      });
    return this;
  };

  // If the response ends without res.send (res.end, redirects, files),
  // still send whatever was queued.
  res.on("finish", () => {
    if (!store.flushed && store.jobs.length) flush(store).catch(() => {});
  });

  requestStore.run(store, next);
};
