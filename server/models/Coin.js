import mongoose from "mongoose";

const coinTransactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "view",
        "like",
        "comment",
        "subscribe",
        "activation_bonus",
        "withdrawal",
        "admin_adjust",
        "referral_bonus"
      ],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    reference: {
      type: String,
    },
    metadata: {
      type: Object,
      default: {},
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "cancelled", "rejected"],
      default: "completed",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const coinWalletSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      ref: "User",
      index: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalWithdrawn: {
      type: Number,
      default: 0,
      min: 0,
    },
    activeIncome: {
      type: Number,
      default: 0,
      min: 0,
    },
    activationBonusGranted: {
      type: Boolean,
      default: false,
    },
    transactions: [coinTransactionSchema],
  },
  { timestamps: true }
);

coinWalletSchema.methods.addCoins = async function (type, amount, metadata = {}, reference) {
  const numericAmount = parseInt(amount, 10) || 0;
  this.balance += numericAmount;
  this.totalEarned += numericAmount;
  
  // Track active income for social earnings (view, like, comment, subscribe)
  // Add to active income when user earns 10+ rupees (1000+ coins)
  if (['view', 'like', 'comment', 'subscribe'].includes(type) && numericAmount >= 1000) {
    this.activeIncome += numericAmount;
  }
  
  this.transactions.push({ type, amount: numericAmount, metadata, reference, status: "completed" });
  await this.save();
  return this;
};

coinWalletSchema.methods.deductCoins = async function (type, amount, metadata = {}, reference) {
  const numericAmount = parseInt(amount, 10) || 0;
  if (numericAmount <= 0) throw new Error("Amount must be positive");
  if (this.balance < numericAmount) throw new Error("Insufficient coins");
  this.balance -= numericAmount;
  this.totalWithdrawn += numericAmount;
  this.transactions.push({ type, amount: -numericAmount, metadata, reference, status: "completed" });
  await this.save();
  return this;
};

coinWalletSchema.methods.addTransaction = async function (type, amount, metadata = {}, reference, status = "completed") {
  const numericAmount = parseInt(amount, 10) || 0;
  this.transactions.push({ type, amount: numericAmount, metadata, reference, status });
  await this.save();
  return this;
};

coinWalletSchema.statics.getOrCreateWallet = async function (userId) {
  let wallet = await this.findOne({ userId });
  if (!wallet) {
    wallet = new this({ userId });
    await wallet.save();
  }
  return wallet;
};

const CoinWallet = mongoose.model("CoinWallet", coinWalletSchema);

export default CoinWallet;



