import mongoose from "mongoose";

// Track user actions on social tasks to prevent duplicate claims
const socialActionSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SocialTask",
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ["view", "like", "comment", "subscribe"],
      required: true,
    },
    videoId: {
      type: String,
      trim: true,
    },
    channelId: {
      type: String,
      trim: true,
    },
    coinsEarned: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "verified", "failed"],
      default: "pending",
    },
    verifiedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate claims
socialActionSchema.index({ userId: 1, taskId: 1 }, { unique: true });

const SocialAction = mongoose.model("SocialAction", socialActionSchema);

export default SocialAction;



