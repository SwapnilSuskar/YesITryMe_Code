import mongoose from "mongoose";

const kycSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  accountNo: {
    type: String,
    required: true,
    trim: true
  },
  ifsc: {
    type: String,
    required: true,
    trim: true
  },
  branch: {
    type: String,
    required: true,
    trim: true
  },
  aadhaarUrl: {
    type: String,
    required: true
  },
  panUrl: {
    type: String,
    required: true
  },
  kycDocUrl: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    trim: true,
    default: ''
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  reviewedBy: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
kycSchema.index({ userId: 1, status: 1 });
kycSchema.index({ status: 1, submittedAt: -1 });
kycSchema.index({ userId: 1 });
kycSchema.index({ status: 1 });
kycSchema.index({ submittedAt: -1 });
kycSchema.index({ reviewedAt: -1 });
kycSchema.index({ reviewedBy: 1 });
kycSchema.index({ createdAt: -1 });
kycSchema.index({ updatedAt: -1 });
kycSchema.index({ userId: 1, submittedAt: -1 }); // Compound index for user KYC history
kycSchema.index({ status: 1, createdAt: -1 }); // Compound index for status-based queries
kycSchema.index({ reviewedBy: 1, reviewedAt: -1 }); // Compound index for admin review history

const Kyc = mongoose.model("Kyc", kycSchema);

export default Kyc; 