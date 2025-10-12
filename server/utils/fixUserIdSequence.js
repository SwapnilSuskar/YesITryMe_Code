import mongoose from "mongoose";
import User from "../models/User.js";
import { config } from "dotenv";

config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    // console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

// Fix userId sequence
const fixUserIdSequence = async () => {
  try {

    // Find all users with userId pattern
    const users = await User.find({ userId: /^YITM\d+$/ }).sort({ userId: 1 });

    if (users.length === 0) {
      return;
    }

    // Find the highest number
    let highestNumber = 0;
    users.forEach((user) => {
      const match = user.userId.match(/^YITM(\d+)$/);
      if (match) {
        const number = parseInt(match[1], 10);
        if (number > highestNumber) {
          highestNumber = number;
        }
      }
    });

  } catch (error) {
    console.error("Error fixing userId sequence:", error);
  }
};

// Run the fix
const run = async () => {
  await connectDB();
  await fixUserIdSequence();
  await mongoose.disconnect();
  // console.log("Disconnected from MongoDB");
};

run();
