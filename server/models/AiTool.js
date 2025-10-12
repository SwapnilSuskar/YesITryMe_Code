import mongoose from "mongoose";

const aiToolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  link: {
    type: String,
    required: true,
    trim: true,
  },
  benefit: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

aiToolSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Ensure updatedAt updates on findOneAndUpdate / findByIdAndUpdate
aiToolSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// Text index for search over name, benefit, and category
aiToolSchema.index({ name: "text", benefit: "text", category: "text" });

const AiTool = mongoose.model("AiTool", aiToolSchema);

export default AiTool;
