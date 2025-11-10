import mongoose from "mongoose";

const walletTopUpSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      ref: "User",
    },
    paymentAmount: {
      type: Number,
      required: true,
      min: 1,
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ["UPI", "Bank Transfer", "Paytm", "PhonePe", "Google Pay"],
    },
    transactionId: {
      type: String,
      required: true,
      trim: true,
    },
    paymentProofUrl: {
      type: String,
      required: true,
    },
    payerName: {
      type: String,
      required: true,
      trim: true,
    },
    payerMobile: {
      type: String,
      required: true,
      trim: true,
    },
    payerEmail: {
      type: String,
      required: true,
      trim: true,
    },
    additionalNotes: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    adminNotes: {
      type: String,
      trim: true,
      default: "",
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    approvedBy: {
      type: String,
      default: null,
      ref: "User",
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    rejectedBy: {
      type: String,
      default: null,
      ref: "User",
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

// Indexes for better query performance
walletTopUpSchema.index({ userId: 1, status: 1 });
walletTopUpSchema.index({ status: 1, submittedAt: -1 });
walletTopUpSchema.index({ approvedBy: 1, approvedAt: -1 });

const WalletTopUp = mongoose.model("WalletTopUp", walletTopUpSchema);

export default WalletTopUp;

