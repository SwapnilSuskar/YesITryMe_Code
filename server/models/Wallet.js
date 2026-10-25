import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['commission', 'withdrawal', 'refund', 'bonus', 'fund_credit', 'special_income_credit', 'payout_received', 'leadership', 'royalty', 'reward', 'wallet_topup', 'wallet_transfer', 'recharge_payment', 'recharge_refund', 'shop_cashback'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  packageName: {
    type: String,
    required: false
  },
  purchaserId: {
    type: String,
    required: false
  },
  purchaserName: {
    type: String,
    required: false
  },
  level: {
    /** 0 marks a buyer's own shop cashback; 1–120 are upline commissions. */
    type: Number,
    required: false,
    min: 0,
    max: 120
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'completed'
  },
  reference: {
    type: String,
    required: false
  },
  fundType: {
    type: String,
    required: false
  },
  incomeType: {
    type: String,
    required: false
  },
  adminNotes: {
    type: String,
    required: false
  },
  withdrawalType: {
    type: String,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const walletSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    ref: 'User'
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  activeIncome: {
    type: Number,
    default: 0,
    min: 0
  },
  passiveIncome: {
    type: Number,
    default: 0,
    min: 0
  },
  totalEarned: {
    type: Number,
    default: 0,
    min: 0
  },
  totalWithdrawn: {
    type: Number,
    default: 0,
    min: 0
  },
  smartWalletBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  transactions: [transactionSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for faster queries
walletSchema.index({ userId: 1 });
walletSchema.index({ 'transactions.createdAt': -1 });
walletSchema.index({ 'transactions.type': 1 });
walletSchema.index({ 'transactions.status': 1 });
walletSchema.index({ 'transactions.level': 1 });
walletSchema.index({ 'transactions.purchaserId': 1 });
walletSchema.index({ isActive: 1 });
walletSchema.index({ createdAt: -1 });
walletSchema.index({ updatedAt: -1 });
walletSchema.index({ 'transactions.type': 1, 'transactions.status': 1 }); // Compound index for transaction queries
walletSchema.index({ 'transactions.purchaserId': 1, 'transactions.createdAt': -1 }); // Compound index for user transaction history
walletSchema.index({ 'transactions.type': 1, 'transactions.createdAt': -1 }); // Compound index for transaction type history

// Credit emails: after a save, hand the transactions that were just added
// (not yet in the database) to the email service.
walletSchema.pre('save', function () {
  this.$locals.newTxForEmail = (this.transactions || []).filter((t) => t.isNew);
});

walletSchema.post('save', async function () {
  const fresh = this.$locals.newTxForEmail || [];
  this.$locals.newTxForEmail = [];
  if (!fresh.length) return;
  try {
    const { queueWalletEmails } = await import('../services/earningEmailService.js');
    await queueWalletEmails(this, fresh);
  } catch (error) {
    console.error('❌ Could not queue wallet emails:', error.message);
  }
});

const Wallet = mongoose.model("Wallet", walletSchema);

export default Wallet; 