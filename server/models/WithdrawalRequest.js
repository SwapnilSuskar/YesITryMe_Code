import mongoose from "mongoose";

const withdrawalRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    coins: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed"],
      default: "pending",
      index: true,
    },
    requestType: {
      type: String,
      enum: ["wallet", "fund", "special_income", "active_income"],
      default: "wallet",
    },
    adminNotes: {
      type: String,
      default: "",
    },
    approvedBy: {
      type: String,
    },
    approvedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },
    paymentDetails: {
      upiId: String,
      bankAccount: String,
      ifscCode: String,
      accountHolderName: String,
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

// Index for efficient queries
withdrawalRequestSchema.index({ userId: 1, status: 1 });
withdrawalRequestSchema.index({ status: 1, createdAt: -1 });

const WithdrawalRequest = mongoose.model("WithdrawalRequest", withdrawalRequestSchema);

export default WithdrawalRequest;
