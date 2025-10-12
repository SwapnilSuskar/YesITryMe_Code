import mongoose from "mongoose";

const superPackagePaymentVerificationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    ref: 'User'
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
  paymentAmount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    required: true
  },
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  paymentProofUrl: {
    type: String,
    required: true
  },
  payerName: {
    type: String,
    required: true
  },
  payerMobile: {
    type: String,
    required: true
  },
  payerEmail: {
    type: String,
    required: true
  },
  additionalNotes: {
    type: String,
    default: ""
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    default: ""
  },
  rejectionReason: {
    type: String,
    default: ""
  },
  verifiedAt: {
    type: Date
  },
  verifiedBy: {
    type: String,
    ref: 'User'
  },
  purchaseId: {
    type: String
  },
  purchaseRecord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SuperPackagePurchase'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
superPackagePaymentVerificationSchema.index({ userId: 1 });
superPackagePaymentVerificationSchema.index({ status: 1 });
superPackagePaymentVerificationSchema.index({ submittedAt: -1 });
superPackagePaymentVerificationSchema.index({ transactionId: 1 }, { unique: true });

const SuperPackagePaymentVerification = mongoose.model('SuperPackagePaymentVerification', superPackagePaymentVerificationSchema);

export default SuperPackagePaymentVerification;
