import mongoose from "mongoose";

const payoutSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      ref: "User",
    },
    userName: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    netAmount: {
      type: Number,
      required: true,
      min: 1,
    },
    adminCharge: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    tds: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed"],
      default: "pending",
    },
    requestDate: {
      type: Date,
      default: Date.now,
    },
    processedDate: {
      type: Date,
      default: null,
    },
    adminNotes: {
      type: String,
      default: "",
    },
    withdrawalType: {
      type: String,
      enum: ["regular", "fund", "special_income", "active_income"],
      default: "regular",
    },
    fundType: {
      type: String,
      enum: ["mobileFund", "laptopFund", "bikeFund", "carFund", "houseFund", "travelFund"],
    },
    incomeType: {
      type: String,
      enum: ["leaderShipFund", "royaltyIncome", "rewardIncome"],
    },
    paymentMethod: {
      type: String,
      enum: ["bank_transfer", "upi", "cash"],
      default: "bank_transfer",
    },
    paymentDetails: {
      accountNumber: String,
      ifscCode: String,
      upiId: String,
      accountHolderName: String,
    },
    type: {
      type: String,
      enum: ["withdrawal", "active_income"],
      default: "withdrawal",
    },
    description: {
      type: String,
      default: "",
    },
    source: {
      type: String,
      default: "",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Indexes for better query performance
payoutSchema.index({ userId: 1 });
payoutSchema.index({ status: 1 });
payoutSchema.index({ requestDate: -1 });
payoutSchema.index({ processedDate: -1 });
payoutSchema.index({ paymentMethod: 1 });
payoutSchema.index({ createdAt: -1 });
payoutSchema.index({ updatedAt: -1 });
payoutSchema.index({ userId: 1, status: 1 }); // Compound index for user payout status
payoutSchema.index({ status: 1, requestDate: -1 }); // Compound index for status-based queries
payoutSchema.index({ userId: 1, requestDate: -1 }); // Compound index for user payout history

const Payout = mongoose.model("Payout", payoutSchema);

export default Payout;
