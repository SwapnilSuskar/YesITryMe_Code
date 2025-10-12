import mongoose from "mongoose";

const commissionLevelSchema = new mongoose.Schema({
  level: {
    type: Number,
    required: true,
    min: 1,
    max: 120
  },
  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  }
});

const packageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  commissionStructure: [commissionLevelSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
packageSchema.index({ name: 1 });
packageSchema.index({ price: 1 });
packageSchema.index({ isActive: 1 });
packageSchema.index({ createdAt: -1 });
packageSchema.index({ updatedAt: -1 });
packageSchema.index({ isActive: 1, price: 1 }); // Compound index for active packages by price

const Package = mongoose.model("Package", packageSchema);

export default Package; 