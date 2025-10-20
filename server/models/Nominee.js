import mongoose from "mongoose";

const nomineeSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      ref: 'User',
      index: true
    },
    name: {
      type: String,
      required: [true, "Nominee name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"]
    },
    bloodRelation: {
      type: String,
      required: [true, "Blood relation is required"],
      trim: true,
      enum: [
        "Father",
        "Mother", 
        "Son",
        "Daughter",
        "Brother",
        "Sister",
        "Husband",
        "Wife",
        "Grandfather",
        "Grandmother",
        "Uncle",
        "Aunt",
        "Cousin",
      ]
    },
    mobile: {
      type: String,
      required: [true, "Mobile number is required"],
      trim: true,
      match: [/^\d{10}$/, "Mobile number must be 10 digits"]
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
      minlength: [10, "Address must be at least 10 characters"],
      maxlength: [500, "Address cannot exceed 500 characters"]
    },
    isActive: {
      type: Boolean,
      default: true
    },
    addedDate: {
      type: Date,
      default: Date.now
    },
    updatedDate: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Indexes for better query performance
nomineeSchema.index({ userId: 1 });
nomineeSchema.index({ mobile: 1 });

// Pre-save middleware to update updatedDate
nomineeSchema.pre('save', function(next) {
  this.updatedDate = new Date();
  next();
});

// Static method to get nominee by userId
nomineeSchema.statics.getByUserId = function(userId) {
  return this.findOne({ userId, isActive: true });
};

// Static method to create or update nominee
nomineeSchema.statics.createOrUpdate = function(userId, nomineeData) {
  return this.findOneAndUpdate(
    { userId },
    { ...nomineeData, userId },
    { upsert: true, new: true, runValidators: true }
  );
};

const Nominee = mongoose.model('Nominee', nomineeSchema);

export default Nominee;
