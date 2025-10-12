import mongoose from "mongoose";

const motivationQuoteSchema = new mongoose.Schema(
  {
    quote: {
      type: String,
      trim: true,
      maxlength: [500, "Quote cannot exceed 500 characters"],
    },
    author: {
      type: String,
      trim: true,
      maxlength: [100, "Author name cannot exceed 100 characters"],
    },
    category: {
      type: String,
      enum: ["success", "motivation", "leadership", "perseverance", "general", "business", "mindset"],
      default: "general",
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const MotivationQuote = mongoose.model("MotivationQuote", motivationQuoteSchema);

export default MotivationQuote; 