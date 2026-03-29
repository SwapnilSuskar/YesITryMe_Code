import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    title: { type: String, required: true },
    packageName: { type: String, required: true },
    unitPrice: { type: Number, required: true },
    quantity: { type: Number, required: true },
    lineSubtotal: { type: Number, required: true },
    deliveryChargePerUnit: { type: Number, default: 0 },
    lineDeliveryTotal: { type: Number, default: 0 },
  },
  { _id: false }
);

const productOrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    items: { type: [orderItemSchema], required: true },
    shipping: {
      fullName: { type: String, required: true },
      mobile: { type: String, required: true },
      pincode: { type: String, required: true },
      address: { type: String, required: true },
    },
    productSubtotal: { type: Number, required: true },
    deliveryTotal: { type: Number, default: 0 },
    maxCoinDiscountRupees: { type: Number, default: 0 },
    coinDiscountRupees: { type: Number, default: 0 },
    coinsApplied: { type: Number, default: 0 },
    amountPayable: { type: Number, required: true },
    upiPayUri: { type: String, default: null },
    status: {
      type: String,
      enum: [
        "awaiting_payment",
        "payment_submitted",
        "confirmed",
        "cancelled",
        "rejected",
      ],
      default: "awaiting_payment",
    },
    coinsDeducted: { type: Boolean, default: false },
    paymentMethod: { type: String, default: "" },
    transactionId: { type: String, sparse: true, index: true },
    payerNotes: { type: String, default: "" },
    paymentProofUrl: { type: String, default: "" },
    paymentProofPublicId: { type: String, default: "" },
    verifiedAt: { type: Date },
    verifiedBy: { type: String },
    adminNotes: { type: String, default: "" },
    rejectionReason: { type: String, default: "" },
    productCommissionsDistributed: { type: Boolean, default: false },
    commissionsDistributedAt: { type: Date },
    totalCommissionDistributed: { type: Number, default: 0 },
    commissionDistributions: {
      type: [
        {
          productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            default: null,
          },
          productTitle: { type: String, default: "" },
          packageName: { type: String, default: "" },
          lineSubtotal: { type: Number, default: 0 },
          distributionPool: { type: Number, default: 0 },
          level: { type: Number, min: 1, max: 120 },
          sponsorId: { type: String, default: "" },
          sponsorName: { type: String, default: "" },
          percentage: { type: Number, default: 0 },
          amount: { type: Number, default: 0 },
          status: { type: String, default: "distributed" },
          distributedAt: { type: Date },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

const ProductOrder = mongoose.model("ProductOrder", productOrderSchema);

export default ProductOrder;
