import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    referralCode: {
      type: String,
      required: true,
      trim: true,
    },
    referralLink: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    sponsorId: {
      type: String,
      required: [true, "Sponsor ID is required"],
      trim: true,
    },
    sponsorName: {
      type: String,
      required: [true, "Sponsor name is required"],
      trim: true,
    },
    sponsorMobile: {
      type: String,
      trim: true,
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      minlength: [2, "First name must be at least 2 characters"],
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      minlength: [2, "Last name must be at least 2 characters"],
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    imageUrl: {
      type: String,
      default: "",
    },
    // Genealogy status: 🔴 Red: free, 🟡 Yellow: active, 🟢 Green: kyc_verified, ⚫ Black: blocked
    status: {
      type: String,
      enum: ["free", "active", "kyc_verified", "blocked"],
      default: "free",
    },
    mobile: {
      type: String,
      required: [true, "Mobile number is required"],
      trim: true,
      match: [/^\d{10}$/, "Mobile number must be 10 digits"],
      unique: true,
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email address is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email address",
      ],
    },
    agreeToTerms: {
      type: Boolean,
      required: [true, "You must agree to the Terms and Conditions"],
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    kycApprovedDate: {
      type: Date,
      default: null,
    },
    activationDate: {
      type: Date,
      default: null,
    },
    // MLM Level System
    mlmLevel: {
      type: String,
      enum: [
        "Free",
        "Active Member",
        "Team Leader",
        "Assistant Manager",
        "Manager",
        "Zonal Head",
        "National Head Promoter",
      ],
      default: "Free",
    },
    mlmLevelDate: {
      type: Date,
      default: null,
    },
    // Team structure tracking
    directActiveMembers: {
      type: Number,
      default: 0,
    },
    teamLeaders: {
      type: Number,
      default: 0,
    },
    assistantManagers: {
      type: Number,
      default: 0,
    },
    managers: {
      type: Number,
      default: 0,
    },
    zonalHeads: {
      type: Number,
      default: 0,
    },
    kycRejected: {
      type: Boolean,
      default: false,
    },
    adminNotes: {
      type: String,
      default: "",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt
  }
);

// Indexes for better query performance
userSchema.index({ userId: 1 });
userSchema.index({ referralCode: 1 });
userSchema.index({ referralLink: 1 });
userSchema.index({ sponsorId: 1 });
userSchema.index({ mobile: 1 });
userSchema.index({ email: 1 });
userSchema.index({ status: 1 });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ updatedAt: -1 });
userSchema.index({ isActive: 1 });
userSchema.index({ kycApprovedDate: 1 });
userSchema.index({ activationDate: 1 });
userSchema.index({ mlmLevel: 1 });
userSchema.index({ sponsorId: 1, status: 1 }); // Compound index for referral queries
userSchema.index({ status: 1, createdAt: -1 }); // Compound index for status-based queries
userSchema.index({ role: 1, isActive: 1 }); // Compound index for admin queries

const User = mongoose.model("User", userSchema);

export default User;
