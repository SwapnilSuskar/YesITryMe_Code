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

const superPackageSchema = new mongoose.Schema({
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
superPackageSchema.index({ price: 1 });
superPackageSchema.index({ isActive: 1 });
superPackageSchema.index({ createdAt: -1 });
superPackageSchema.index({ updatedAt: -1 });
superPackageSchema.index({ isActive: 1, price: 1 }); // Compound index for active packages by price

const SuperPackage = mongoose.model("SuperPackage", superPackageSchema);

export default SuperPackage; 
 