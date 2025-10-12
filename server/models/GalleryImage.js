import mongoose from "mongoose";

const galleryImageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Image title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    imageUrl: {
      type: String,
      required: [true, "Image URL is required"],
    },
    category: {
      type: String,
      enum: ["motivation", "success", "team", "achievement", "general"],
      default: "general",
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

const GalleryImage = mongoose.model("GalleryImage", galleryImageSchema);

export default GalleryImage; 