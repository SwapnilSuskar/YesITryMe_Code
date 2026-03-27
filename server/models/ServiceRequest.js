import mongoose from "mongoose";

const serviceRequestSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    serviceKey: {
      type: String,
      required: true,
      index: true,
    },
    name: { type: String, default: "" },
    mobile: { type: String, default: "" },
    email: { type: String, default: "" },
    notes: { type: String, default: "" },
    status: {
      type: String,
      enum: ["new", "contacted", "closed"],
      default: "new",
      index: true,
    },
  },
  { timestamps: true }
);

serviceRequestSchema.index({ serviceKey: 1, createdAt: -1 });

const ServiceRequest = mongoose.model("ServiceRequest", serviceRequestSchema);

export default ServiceRequest;

