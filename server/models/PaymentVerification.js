import mongoose from "mongoose";

const paymentVerificationSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      ref: "User",
    },
    packageId: {
      type: String,
      required: true,
      ref: "Package",
    },
    packageName: {
      type: String,
      required: true,
    },
    packagePrice: {
      type: Number,
      required: true,
    },
    paymentAmount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      required: true,
    }, // UPI, Bank Transfer, etc.
    transactionId: {
      type: String,
      required: true,
      trim: true,
    },
    paymentProofUrl: {
      type: String,
      required: true,
    }, // Screenshot/photo URL
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
      enum: ["pending", "verified", "rejected"],
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
    verifiedAt: {
      type: Date,
      default: null,
    },
    verifiedBy: {
      type: String,
      default: null,
    },
    rejectionReason: { type: String, trim: true, default: "" },
    purchaseId: { type: String, default: null }, // Reference to the purchase record created after verification
    purchaseRecord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Purchase",
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes for better query performance
paymentVerificationSchema.index({ userId: 1, status: 1 });
paymentVerificationSchema.index({ status: 1, submittedAt: -1 });
paymentVerificationSchema.index({ transactionId: 1 }, { unique: true });
paymentVerificationSchema.index({ userId: 1 });
paymentVerificationSchema.index({ packageId: 1 });
paymentVerificationSchema.index({ status: 1 });
paymentVerificationSchema.index({ submittedAt: -1 });
paymentVerificationSchema.index({ verifiedAt: -1 });
paymentVerificationSchema.index({ verifiedBy: 1 });
paymentVerificationSchema.index({ purchaseId: 1 });
paymentVerificationSchema.index({ createdAt: -1 });
paymentVerificationSchema.index({ updatedAt: -1 });
paymentVerificationSchema.index({ userId: 1, submittedAt: -1 }); // Compound index for user verification history
paymentVerificationSchema.index({ status: 1, createdAt: -1 }); // Compound index for status-based queries
paymentVerificationSchema.index({ verifiedBy: 1, verifiedAt: -1 }); // Compound index for admin verification history

const PaymentVerification = mongoose.model(
  "PaymentVerification",
  paymentVerificationSchema
);
export default PaymentVerification;
