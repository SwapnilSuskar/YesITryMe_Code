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
    required: true,
    ref: 'User'
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
    enum: ['distributed', 'pending', 'failed'],
    default: 'distributed'
  },
  distributedAt: {
    type: Date,
    default: Date.now
  }
});

const superPackagePurchaseSchema = new mongoose.Schema({
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
  superPackageId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'SuperPackage'
  },
  superPackageName: {
    type: String,
    required: true
  },
  superPackagePrice: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['online', 'upi', 'bank_transfer', 'cash', 'UPI', 'Bank Transfer', 'Online', 'Cash', 'Paytm', 'PhonePe', 'Google Pay', 'Amazon Pay', 'Net Banking', 'Credit Card', 'Debit Card']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'expired'],
    default: 'active'
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  commissionDistributions: [commissionDistributionSchema],
  totalCommissionDistributed: {
    type: Number,
    default: 0
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
superPackagePurchaseSchema.index({ purchaserId: 1 });
superPackagePurchaseSchema.index({ purchaseId: 1 }, { unique: true });
superPackagePurchaseSchema.index({ status: 1 });
superPackagePurchaseSchema.index({ purchaseDate: -1 });
superPackagePurchaseSchema.index({ superPackageId: 1 });

const SuperPackagePurchase = mongoose.model('SuperPackagePurchase', superPackagePurchaseSchema);

export default SuperPackagePurchase;
