import mongoose from "mongoose";

// Represents a social task and the required action type
const socialTaskSchema = new mongoose.Schema(
  {
    createdByAdminId: {
      type: String,
      required: true,
      index: true,
    },
    platform: {
      type: String,
      enum: ["social"],
      default: "social",
    },
    action: {
      type: String,
      enum: ["view", "like", "comment", "subscribe"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    videoId: {
      type: String,
      trim: true,
    },
    channelId: {
      type: String,
      trim: true,
    },
    coins: {
      type: Number,
      required: true,
      min: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    maxClaimsPerUser: {
      type: Number,
      default: 1,
      min: 1,
    },
    startAt: {
      type: Date,
    },
    endAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const SocialTask = mongoose.model("SocialTask", socialTaskSchema);

export default SocialTask;



