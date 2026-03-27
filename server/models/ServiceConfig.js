import mongoose from "mongoose";

const serviceConfigSchema = new mongoose.Schema(
  {
    serviceKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: { type: String, required: true },
    actionType: {
      type: String,
      required: true,
      enum: ["contact_form", "link"],
      default: "contact_form",
    },
    linkUrl: { type: String, default: "" },
    linkLabel: { type: String, default: "" },
    message: { type: String, default: "" },
    isActive: { type: Boolean, default: true, index: true },
    updatedByAdminId: { type: String, default: "" },
  },
  { timestamps: true }
);

const ServiceConfig = mongoose.model("ServiceConfig", serviceConfigSchema);

export default ServiceConfig;

