import mongoose from "mongoose";

const commissionDistributionSchema = new mongoose.Schema({
  level: {
    type: Number,
    required: true,
    min: 1,
    max: 120
  },
  sponsorId: {
    type: String,
    required: true
  },
  sponsorName: {
    type: String,
    required: true
  },
  percentage: {
    type: Number,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'distributed', 'failed'],
    default: 'pending'
  },
  distributedAt: {
    type: Date,
    default: null
  }
});

const purchaseSchema = new mongoose.Schema({
  purchaseId: {
    type: String,
    required: true,
    unique: true
  },
  purchaserId: {
    type: String,
    required: true,
    ref: 'User'
  },
  purchaserName: {
    type: String,
    required: true
  },
  packageId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Package'
  },
  packageName: {
    type: String,
    required: true
  },
  packagePrice: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: [
      'online', 'upi', 'bank_transfer', 'cash',
      'google_pay', 'phonepe', 'paytm', 'amazon_pay',
      'net_banking', 'credit_card', 'debit_card',
      'Google Pay', 'PhonePe', 'Paytm', 'Amazon Pay',
      'Net Banking', 'Credit Card', 'Debit Card',
      'UPI', 'Bank Transfer', 'Online', 'Cash'
    ]
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  commissionDistributions: [commissionDistributionSchema],
  totalCommissionDistributed: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled'],
    default: 'active'
  },
  purchaseDate: {
    type: Date,
    default: Date.now
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
purchaseSchema.index({ purchaserId: 1 });
purchaseSchema.index({ purchaseId: 1 });
purchaseSchema.index({ purchaseDate: -1 });
purchaseSchema.index({ paymentStatus: 1 });
purchaseSchema.index({ status: 1 });
purchaseSchema.index({ packageId: 1 });
purchaseSchema.index({ createdAt: -1 });
purchaseSchema.index({ updatedAt: -1 });
purchaseSchema.index({ 'commissionDistributions.sponsorId': 1 });
purchaseSchema.index({ 'commissionDistributions.status': 1 });
purchaseSchema.index({ purchaserId: 1, paymentStatus: 1 }); // Compound index for user purchases
purchaseSchema.index({ purchaserId: 1, status: 1 }); // Compound index for active purchases
purchaseSchema.index({ paymentStatus: 1, purchaseDate: -1 }); // Compound index for payment status queries
purchaseSchema.index({ 'commissionDistributions.sponsorId': 1, 'commissionDistributions.status': 1 }); // Compound index for commission queries

const Purchase = mongoose.model("Purchase", purchaseSchema);

export default Purchase; 