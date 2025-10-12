import mongoose from "mongoose";
import "dotenv/config";
import User from "../models/User.js";

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/itryme");
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};

const makeAdmin = async (emailOrMobile) => {
  try {
    await connectDB();
    
    // Find user by email or mobile
    const user = await User.findOne({
      $or: [
        { email: emailOrMobile },
        { mobile: emailOrMobile }
      ]
    });

    if (!user) {
      // console.log("❌ User not found. Please check the email or mobile number.");
      process.exit(1);
    }

    // Update user role to admin
    user.role = "admin";
    await user.save();

    // console.log("✅ Success! User is now an admin:");
    // console.log(`   Name: ${user.firstName} ${user.lastName}`);
    // console.log(`   Email: ${user.email}`);
    // console.log(`   Mobile: ${user.mobile}`);
    // console.log(`   Role: ${user.role}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error making user admin:", error);
    process.exit(1);
  }
};

// Get command line argument
const emailOrMobile = process.argv[2];

if (!emailOrMobile) {
  // console.log("❌ Please provide an email or mobile number as an argument.");
  // console.log("Usage: node makeAdmin.js <email_or_mobile>");
  // console.log("Example: node makeAdmin.js user@example.com");
  // console.log("Example: node makeAdmin.js 9876543210");
  process.exit(1);
}

makeAdmin(emailOrMobile); 