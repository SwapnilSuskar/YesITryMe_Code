import mongoose from "mongoose";

const videoEngagementSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    videoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EngagementVideo",
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ["view", "like", "comment", "share"],
      required: true,
      index: true,
    },
    metadata: { type: Object, default: {} },
  },
  { timestamps: true }
);

videoEngagementSchema.index({ userId: 1, videoId: 1, action: 1 }, { unique: true });

const VideoEngagement = mongoose.model("VideoEngagement", videoEngagementSchema);

export default VideoEngagement;

