import mongoose from "mongoose";

const rechargeTransactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['topup', 'recharge_payment', 'recharge_refund', 'admin_adjustment'],
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
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'completed'
  },
  reference: {
    type: String,
    required: false
  },
  rechargeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recharge',
    required: false
  },
  topUpId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WalletTopUp',
    required: false
  },
  adminNotes: {
    type: String,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const rechargeWalletSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    ref: 'User',
    index: true
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAdded: {
    type: Number,
    default: 0,
    min: 0
  },
  totalSpent: {
    type: Number,
    default: 0,
    min: 0
  },
  totalRefunded: {
    type: Number,
    default: 0,
    min: 0
  },
  transactions: [rechargeTransactionSchema],
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
rechargeWalletSchema.index({ userId: 1 });
rechargeWalletSchema.index({ 'transactions.createdAt': -1 });
rechargeWalletSchema.index({ 'transactions.type': 1 });
rechargeWalletSchema.index({ 'transactions.status': 1 });
rechargeWalletSchema.index({ 'transactions.rechargeId': 1 });
rechargeWalletSchema.index({ 'transactions.topUpId': 1 });
rechargeWalletSchema.index({ isActive: 1 });
rechargeWalletSchema.index({ createdAt: -1 });
rechargeWalletSchema.index({ updatedAt: -1 });

// Static method to get or create recharge wallet
rechargeWalletSchema.statics.getOrCreateWallet = async function(userId) {
  let wallet = await this.findOne({ userId });
  if (!wallet) {
    wallet = new this({ userId });
    await wallet.save();
  }
  return wallet;
};

const RechargeWallet = mongoose.model("RechargeWallet", rechargeWalletSchema);

export default RechargeWallet;

