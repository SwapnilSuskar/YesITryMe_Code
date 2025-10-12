import mongoose from "mongoose";

const youtubeTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    accessToken: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
    },
    scope: {
      type: String,
    },
    tokenType: {
      type: String,
    },
    expiryDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

const YoutubeToken = mongoose.model("YoutubeToken", youtubeTokenSchema);

export default YoutubeToken;



