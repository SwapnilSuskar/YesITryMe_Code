import mongoose from "mongoose";

// Tracks a public social task verification session initiated from a shareable link
const publicActionSessionSchema = new mongoose.Schema(
  {
    // Unique session id token used in URL state/params
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // Optional: if an internal SocialTask is referenced
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SocialTask",
    },
    // Action to verify: view | like | comment | subscribe
    action: {
      type: String,
      enum: ["view", "like", "comment", "subscribe"],
      required: true,
    },
    // Source video/channel details (if not using taskId)
    videoId: { type: String },
    channelId: { type: String },
    url: { type: String },
    title: { type: String },

    // Referrer attribution captured from share link
    referralCode: { type: String, index: true },
    referrerUserId: { type: String, index: true },

    // The lightweight public user created/identified for this session (by mobile maybe) is optional
    actingUserId: { type: String },

    // OAuth token linkage for the acting user (stored in YoutubeToken by actingUserId)
    youtubeConnected: { type: Boolean, default: false },

    // Coins configured for this public action (fallback to SocialTask.coins if taskId provided)
    coins: { type: Number, default: 1 },

    // Lightweight device fingerprint (IP + User-Agent hash) to prevent duplicate public claims
    clientHash: { type: String, index: true },

    // Status tracking
    status: {
      type: String,
      enum: ["initiated", "oauth_pending", "oauth_connected", "verified", "failed", "expired"],
      default: "initiated",
      index: true,
    },
    error: { type: String },

    // Expiry control to limit session validity
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

publicActionSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { expiresAt: { $type: "date" } } });

const PublicActionSession = mongoose.model("PublicActionSession", publicActionSessionSchema);

export default PublicActionSession;


