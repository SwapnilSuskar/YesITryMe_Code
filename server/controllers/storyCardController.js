import mongoose from "mongoose";
import Wallet from "../models/Wallet.js";
import {
  buildCreditEmailData,
  buildWithdrawalEmailData,
  isIncomeTransaction,
  renderStoryImage,
  storyFileName,
} from "../services/earningEmailService.js";

// Share images ("story cards") users can open from Wallet Transactions and
// post on WhatsApp Status / Instagram Story. Same image as in the emails.
// Everything on the image comes from the database, never from the request,
// so nobody can make an image for an amount they didn't receive.

const isId = (id) => mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id);

const sendJpeg = (res, jpg, kind) => {
  res.set({
    "Content-Type": "image/jpeg",
    "Content-Disposition": `inline; filename="${storyFileName(kind)}"`,
    "Cache-Control": "private, max-age=3600",
  });
  res.send(jpg);
};

const fail = (res, status, message) => res.status(status).json({ success: false, message });

const isBlocked = (user) => user?.status === "blocked" || user?.isActive === false;

// When a transaction was made: its createdAt, else the time inside its id.
const txDate = (tx) => {
  if (tx.createdAt && !Number.isNaN(new Date(tx.createdAt).getTime())) return new Date(tx.createdAt);
  if (tx._id && isId(String(tx._id))) return new mongoose.Types.ObjectId(String(tx._id)).getTimestamp();
  return new Date();
};

const isPayoutReceived = (tx) =>
  tx.type === "payout_received" && (tx.status || "completed") === "completed" && Number(tx.amount) >= 1;

/**
 * Finds a transaction in the user's wallet. Old transactions saved without an
 * _id get a new random one each time the list loads, so if the id isn't found
 * we fall back to matching type + amount + time (sent as ?type=&amount=&at=).
 */
const findWalletTransaction = async (userId, txId, query) => {
  if (isId(txId)) {
    const hit = await Wallet.findOne(
      { userId, "transactions._id": txId },
      { userId: 1, "transactions.$": 1 },
    ).lean();
    if (hit?.transactions?.[0]) return hit.transactions[0];
  }

  const amount = Number(query.amount);
  const at = Date.parse(query.at);
  if (!query.type || !Number.isFinite(amount) || Number.isNaN(at)) return null;

  const wallet = await Wallet.findOne({ userId }, { transactions: 1 }).lean();
  return (
    (wallet?.transactions || []).find(
      (t) =>
        t.type === query.type &&
        Math.abs(Number(t.amount) - amount) < 0.005 &&
        t.createdAt &&
        new Date(t.createdAt).getTime() === at,
    ) || null
  );
};

// GET /api/story-card/transaction/:txId[?type=&amount=&at=]
// An income or "payout received" row in the user's own wallet.
export const getTransactionStoryCard = async (req, res) => {
  try {
    if (isBlocked(req.user)) return fail(res, 403, "Your account can't create share images");

    const tx = await findWalletTransaction(req.user.userId, req.params.txId, req.query);
    if (!tx) return fail(res, 404, "Transaction not found. Refresh the page and try again.");

    // "Payout received" rows get the withdrawal image ("I just got paid")
    if (isPayoutReceived(tx)) {
      const payout = { amount: tx.amount, netAmount: tx.amount, processedDate: txDate(tx) };
      const jpg = await renderStoryImage(buildWithdrawalEmailData(req.user, payout));
      return sendJpeg(res, jpg, "withdrawal");
    }

    if (!isIncomeTransaction(tx)) return fail(res, 404, "There is no share image for this transaction");

    const jpg = await renderStoryImage(buildCreditEmailData(req.user, { ...tx, createdAt: txDate(tx) }, null));
    sendJpeg(res, jpg, "credit");
  } catch (error) {
    console.error("Error creating transaction story card:", error);
    fail(res, 500, "Could not create the image. Please try again.");
  }
};
