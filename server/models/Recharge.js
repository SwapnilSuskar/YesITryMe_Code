import mongoose from "mongoose";

const rechargeSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      ref: "User",
      index: true,
    },
    mobileNumber: {
      type: String,
      required: true,
    },
    operator: {
      type: String,
      required: true,
      enum: [
        "Airtel", "Vodafone", "BSNL TOPUP", "RELIANCE JIO", "Idea", "BSNL STV",
        "Airtel Postpaid", "Idea Postpaid", "Vodafone Postpaid", "JIO PostPaid", "BSNL Postpaid"
      ],
    },
    operatorCode: {
      type: String,
      required: true,
    },
    circle: {
      type: String,
      required: true,
    },
    rechargeType: {
      type: String,
      enum: ["prepaid", "postpaid", "dth"],
      default: "prepaid",
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    planId: {
      type: String,
      default: "",
    },
    planDescription: {
      type: String,
      default: "",
    },
    // aiTopUp API response
    aiTopUpOrderId: {
      type: String,
      default: "",
    },
    aiTopUpTransactionId: {
      type: String,
      default: "",
    },
    aiTopUpResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Payment gateway details
    paymentMethod: {
      type: String,
      enum: ["phonepe", "google_pay", "upi"],
      required: true,
    },
    phonePeTransactionId: {
      type: String,
      default: "",
    },
    phonePeOrderId: {
      type: String,
      default: "",
    },
    phonePeResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Transaction status
    status: {
      type: String,
      enum: [
        "pending", // Payment pending
        "payment_success", // Payment successful, recharge processing
        "processing", // Recharge processing with aiTopUp
        "success", // Recharge successful
        "failed", // Recharge failed
        "refunded", // Payment refunded
        "cancelled", // Transaction cancelled
      ],
      default: "pending",
      index: true,
    },
    // Admin commission
    adminCommission: {
      type: Number,
      default: 0,
      min: 0,
    },
    adminCommissionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    // User commission
    userCommission: {
      type: Number,
      default: 0,
      min: 0,
    },
    userCommissionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    commissionDistributed: {
      type: Boolean,
      default: false,
    },
    // Error handling
    failureReason: {
      type: String,
      default: "",
    },
    refundReason: {
      type: String,
      default: "",
    },
    refundTransactionId: {
      type: String,
      default: "",
    },
    // Timestamps
    paymentInitiatedAt: {
      type: Date,
    },
    paymentCompletedAt: {
      type: Date,
    },
    rechargeInitiatedAt: {
      type: Date,
    },
    rechargeCompletedAt: {
      type: Date,
    },
    refundedAt: {
      type: Date,
    },
    adminNotes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
rechargeSchema.index({ userId: 1, createdAt: -1 });
rechargeSchema.index({ status: 1, createdAt: -1 });
rechargeSchema.index({ mobileNumber: 1 });
rechargeSchema.index({ aiTopUpOrderId: 1 });
rechargeSchema.index({ phonePeTransactionId: 1 });
rechargeSchema.index({ createdAt: -1 });

const Recharge = mongoose.model("Recharge", rechargeSchema);

export default Recharge;

