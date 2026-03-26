import mongoose from "mongoose";

const engagementVideoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    videoUrl: { type: String, required: true, trim: true },
    publicId: { type: String, trim: true },
    durationSeconds: { type: Number, default: null },
    isActive: { type: Boolean, default: true, index: true },
    createdByAdminId: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

const EngagementVideo = mongoose.model("EngagementVideo", engagementVideoSchema);

export default EngagementVideo;

