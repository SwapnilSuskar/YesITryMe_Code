import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['commission', 'withdrawal', 'refund', 'bonus', 'fund_credit', 'special_income_credit', 'payout_received', 'leadership', 'royalty', 'reward', 'wallet_topup', 'wallet_transfer', 'recharge_payment', 'recharge_refund'],
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
    type: Number,
    required: false,
    min: 1,
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

const Wallet = mongoose.model("Wallet", walletSchema);

export default Wallet; 