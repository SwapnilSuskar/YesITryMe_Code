import User from "../models/User.js";
import MotivationQuote from "../models/MotivationQuote.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { generateUserId } from "../utils/userIdGenerator.js";
import {
  generateAndSendOtp,
  verifyOtp,
  sendUserIdAndPassword,
} from "../services/otpService.js";
import {
  generateAndSendEmailOtp,
  verifyEmailOtp,
  sendPasswordResetConfirmation,
  getOtpStoreStatus,
} from "../services/emailOtpService.js";
import {
  generateAndSendAdminOtp,
  verifyAdminOtp,
  sendAdminOtp,
} from "../services/adminOtpService.js";
import referralService from "../services/referralService.js";
import Wallet from "../models/Wallet.js";
import CoinWallet from "../models/Coin.js";
import SpecialIncome from "../models/SpecialIncome.js";
import Payout from "../models/Payout.js";
import multer from "multer";
import path from "path";
import cloudinary from "cloudinary";
import fs from "fs";
import { compressProfilePhoto } from "../utils/imageCompression.js";

// Cloudinary config
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer setup for profile photo uploads - using memory storage for serverless
const storage = multer.memoryStorage();
export const uploadProfilePhoto = multer({ storage }).single("photo");

// Update user profile photo
export const updateProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    const user = await User.findOne({ userId: req.user.userId });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Compress and resize image before uploading
    const compressedImageBuffer = await compressProfilePhoto(req.file.buffer);

    // Upload compressed image to Cloudinary
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.v2.uploader.upload_stream(
        {
          folder: "profile-photos",
          public_id: req.user.userId + "-" + Date.now(),
          overwrite: true,
          transformation: [
            { width: 400, height: 400, crop: "fill", gravity: "face" }, // Optimize for face detection
            { quality: "auto", fetch_format: "auto" }, // Auto-optimize format and quality
          ],
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      uploadStream.end(compressedImageBuffer);
    });

    const result = await uploadPromise;
    user.imageUrl = result.secure_url;
    await user.save();

    res.json({
      success: true,
      imageUrl: user.imageUrl,
      message: "Profile photo updated successfully with compression",
    });
  } catch (err) {
    console.error("Profile photo upload error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update photo",
      error: err.message,
    });
  }
};

// Check if mobile number already exists
export const checkMobileExists = async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({
        success: false,
        message: "Mobile number is required",
      });
    }

    // Check if mobile number already exists in the database
    const existingUser = await User.findOne({ mobile });

    res.json({
      success: true,
      exists: !!existingUser,
      message: existingUser
        ? "Mobile number already registered"
        : "Mobile number available",
    });
  } catch (error) {
    console.error("Check mobile exists error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check mobile number",
      error: error.message,
    });
  }
};

// Create a new user / Signup
export const signup = async (req, res) => {
  try {
    const {
      sponsorId,
      sponsorName,
      firstName,
      lastName,
      mobile,
      address,
      state,
      city,
      email,
      password,
      agreeToTerms,
      activationDate,
      status,
    } = req.body;
    let { role } = req.body;
    // Only allow 'admin' if explicitly set, otherwise default to 'user'
    if (role !== "admin") {
      role = "user";
    }

    // Basic validation (model will also validate)
    if (
      !sponsorId ||
      !sponsorName ||
      !firstName ||
      !lastName ||
      !mobile ||
      !address ||
      !state ||
      !city ||
      !email ||
      !password
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }
    if (!agreeToTerms) {
      return res
        .status(400)
        .json({ message: "You must agree to the Terms and Conditions." });
    }

    // Check if user already exists (by email or mobile)
    const existingUser = await User.findOne({ $or: [{ email }, { mobile }] });
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(409).json({ message: "Email already registered." });
      } else {
        return res
          .status(409)
          .json({ message: "Mobile number already registered." });
      }
    }

    // Generate unique userId with retry logic for duplicate key errors
    let userId, referralCode, referralLink, user;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        userId = await generateUserId();
        // Always generate a new, unique referralCode for every user
        referralCode = userId;
        referralLink = `${process.env.FRONTEND_URL}/?referrer_code=${referralCode}`;

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // After generating userId, before creating the user:
        let finalSponsorId = sponsorId;
        let finalSponsorName = sponsorName;

        // Validate that sponsor information is provided
        if (!finalSponsorId || !finalSponsorName) {
          return res.status(400).json({
            message:
              "Sponsor ID and Sponsor Name are required. Please use a valid referral link or contact your sponsor.",
          });
        }

        // Prevent self-referral
        if (finalSponsorId === userId) {
          return res.status(400).json({
            message:
              "You cannot refer yourself. Please use a different referral code.",
          });
        }
        // Validate referral chain to prevent circular references
        const isValidReferralChain =
          await referralService.validateReferralChain(userId, finalSponsorId);

        if (!isValidReferralChain) {
          return res.status(400).json({
            message:
              "Invalid referral. Circular references are not allowed. Please use a different referral code.",
          });
        }

        // Then use finalSponsorId and finalSponsorName in User.create:
        // Fetch sponsor's mobile number
        let sponsorMobile = undefined;
        const sponsorUser = await User.findOne({ userId: finalSponsorId });
        if (sponsorUser) sponsorMobile = sponsorUser.mobile;
        user = await User.create({
          userId,
          referralCode,
          referralLink,
          password: hashedPassword,
          sponsorId: finalSponsorId,
          sponsorName: finalSponsorName,
          sponsorMobile,
          firstName,
          lastName,
          mobile,
          address,
          state,
          city,
          email,
          agreeToTerms,
          role,
        });

        // If we get here, user creation was successful

        // Award referral bonus (20 coins) to sponsor's coin wallet
        try {
          const sponsorWallet = await CoinWallet.getOrCreateWallet(
            finalSponsorId
          );
          await sponsorWallet.addCoins(
            "referral_bonus",
            20,
            {
              referredUserId: userId,
              referredUserName: `${firstName} ${lastName}`,
              source: "registration",
            },
            `REFERRAL_REGISTRATION_${userId}`
          );
        } catch (walletErr) {
          // Non-blocking: log and continue signup
          console.error(
            "Failed to credit referral bonus:",
            walletErr?.message || walletErr
          );
        }
        break;
      } catch (createError) {
        retryCount++;

        // If it's a duplicate key error and we haven't exceeded retries, try again
        if (createError.code === 11000 && retryCount < maxRetries) {
          continue;
        }

        // If it's not a duplicate key error or we've exceeded retries, throw the error
        throw createError;
      }
    }
    res.status(201).json({
      message:
        "User registered successfully! Your login credentials are displayed below.",
      user: {
        ...user.toObject(),
        password: undefined, // Don't send hashed password in response
      },
      credentials: {
        userId: userId,
        password: password, // Send plain password for display
        message:
          "Please save these credentials for login. Do not share with anyone.",
      },
    });
  } catch (error) {
    // Mongoose validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: errors.join(" ") });
    }

    // Duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      if (field === "userId") {
        return res.status(500).json({
          message: "Failed to generate unique user ID. Please try again.",
        });
      }
      return res.status(409).json({ message: `${field} already exists.` });
    }

    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Login user with userId/mobile and password
export const login = async (req, res) => {
  try {
    const { userId, mobile, password } = req.body;
    // Basic validation
    if ((!userId && !mobile) || !password) {
      return res
        .status(400)
        .json({ message: "User ID or mobile and password are required." });
    }
    // Find user by userId or mobile
    let user = null;
    if (userId) {
      user = await User.findOne({ userId });
    } else if (mobile) {
      user = await User.findOne({ mobile });
    }
    if (!user) {
      return res
        .status(401)
        .json({ message: "Invalid User ID or mobile number." });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password." });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.userId, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful!",
      token,
      user: {
        ...user.toObject(),
        password: undefined, // Don't send password in response
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Admin OTP Login - Step 1: Send OTP
export const adminSendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required for admin login.",
      });
    }

    // Check if user exists and is admin
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Admin account not found with this email.",
      });
    }

    if (user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    // Send OTP to admin email
    const success = await generateAndSendAdminOtp(email);

    if (success) {
      res.status(200).json({
        success: true,
        message: "Admin OTP sent successfully!",
        expiresIn: "10 minutes",
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to send admin OTP.",
      });
    }
  } catch (error) {
    console.error("Admin OTP send error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Admin OTP Login - Step 2: Verify OTP and Login
export const adminLoginWithOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required.",
      });
    }

    // Check if user exists and is admin
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Admin account not found.",
      });
    }

    if (user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    // Verify OTP
    const isOtpValid = verifyAdminOtp(email, otp);
    if (!isOtpValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired OTP.",
      });
    }

    // Generate JWT token with 8-hour expiration for admin
    const token = jwt.sign(
      {
        userId: user.userId,
        email: user.email,
        role: user.role,
        isAdmin: true,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" } // 8 hours for admin
    );

    res.status(200).json({
      success: true,
      message: "Admin login successful!",
      token,
      user: {
        ...user.toObject(),
        password: undefined, // Don't send password in response
      },
    });
  } catch (error) {
    console.error("Admin OTP login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get active motivation quotes for display
export const getActiveMotivationQuote = async (req, res) => {
  try {
    const quotes = await MotivationQuote.find({ isActive: true })
      .populate("uploadedBy", "firstName lastName")
      .sort({ uploadDate: -1 })
      .limit(4); // Limit to 4 quotes as requested

    // For backward compatibility, also return the first quote as 'quote'
    const quote = quotes.length > 0 ? quotes[0] : null;

    res.json({ quote, quotes });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Toggle motivation quote active status (admin only)
export const toggleMotivationQuoteStatus = async (req, res) => {
  try {
    const quote = await MotivationQuote.findById(req.params.id);
    if (!quote) return res.status(404).json({ message: "Quote not found" });

    quote.isActive = !quote.isActive;
    await quote.save();

    res.json({
      message: `Quote ${
        quote.isActive ? "activated" : "deactivated"
      } successfully`,
      quote,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete motivation quote (admin only)
export const deleteMotivationQuote = async (req, res) => {
  try {
    const quote = await MotivationQuote.findByIdAndDelete(req.params.id);
    if (!quote) return res.status(404).json({ message: "Quote not found" });

    res.json({ message: "Quote deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get user by referral code (for referral links)
export const getUserByReferralCode = async (req, res) => {
  try {
    const { referralCode } = req.params;

    if (!referralCode) {
      return res.status(400).json({ message: "Referral code is required." });
    }

    const user = await User.findOne({ referralCode });

    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found with this referral code." });
    }

    // Return only necessary sponsor information
    res.status(200).json({
      success: true,
      sponsorInfo: {
        sponsorId: user.userId,
        sponsorName: `${user.firstName} ${user.lastName}`,
        sponsorMobile: user.mobile,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Send OTP for password reset
export const sendForgotPasswordOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email address is required.",
    });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found with this email address.",
    });
  }

  // Generate and send OTP via email
  const otpSent = await generateAndSendEmailOtp(email);

  if (!otpSent) {
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP. Please try again.",
    });
  }

  res.json({
    success: true,
    message:
      "OTP sent to your email address. Please check your inbox and spam folder.",
    email: email, // Return email for confirmation
  });
};

// Verify OTP and reset password
export const resetPasswordWithOtp = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Email, OTP, and new password are required.",
    });
  }

  // Verify OTP using email service
  const isOtpValid = verifyEmailOtp(email, otp);

  if (!isOtpValid) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired OTP.",
    });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found.",
    });
  }

  // Hash the new password
  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  // Send password reset confirmation email
  await sendPasswordResetConfirmation(email, user.userId);

  res.json({
    success: true,
    message:
      "Password reset successful. You can now log in with your new password.",
    userId: user.userId,
  });
};

// Debug endpoint to check OTP store status
export const debugOtpStore = async (req, res) => {
  try {
    const storeStatus = getOtpStoreStatus();
    res.json({
      success: true,
      data: storeStatus,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get OTP store status",
      error: error.message,
    });
  }
};

// Twilio: Handle incoming SMS webhook
export const handleTwilioIncoming = (req, res) => {
  // Log or process the incoming SMS
  // TODO: Implement business logic for incoming SMS if needed
  res.sendStatus(200);
};

// Twilio: Handle delivery status callback webhook
export const handleTwilioStatusCallback = (req, res) => {
  // Log or process the delivery status update
  // TODO: Implement business logic for delivery status updates if needed
  res.sendStatus(200);
};

// Get combined referral stats (direct + indirect) for the last 7 days for the logged-in user
export const getReferralStats7Days = async (req, res) => {
  try {
    const userId = req.user.userId;
    const directStats = await referralService.getDirectReferralsLast7Days(
      userId
    );
    const downlineStats = await referralService.getDownlineReferralsLast7Days(
      userId
    );

    // Combine direct and indirect stats correctly
    const combinedStats = directStats.map((directItem, index) => {
      const downlineItem = downlineStats[index] || { count: 0 };
      // Calculate indirect count by subtracting direct from total downline
      const indirectCount = Math.max(0, downlineItem.count - directItem.count);
      return {
        date: directItem.date,
        count: downlineItem.count, // Total is the downline count (includes direct + indirect)
        directCount: directItem.count,
        indirectCount: indirectCount,
      };
    });

    res.status(200).json({ success: true, data: combinedStats });
  } catch (error) {
    console.error("Error getting 7-day referral stats:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to get 7-day referral stats" });
  }
};

// Get combined downline package buyers stats (direct + indirect) for the last 7 days for the logged-in user
export const getDownlineStats7Days = async (req, res) => {
  try {
    const userId = req.user.userId;
    const period = req.query.period || "7days"; // Get period from query parameter

    // Get categorized package buyers data
    const categorizedData =
      await referralService.getCategorizedPackageBuyersByPeriod(userId, period);

    // Get total categorized package buyers count
    const totalCategorized =
      await referralService.getTotalCategorizedPackageBuyers(userId);

    // Combine direct and indirect package buyer stats
    const combinedStats = categorizedData.directBuyers.map(
      (directItem, index) => {
        const indirectItem = categorizedData.indirectBuyers[index] || {
          count: 0,
        };
        return {
          date: directItem.date,
          count: directItem.count + indirectItem.count,
          directCount: directItem.count,
          indirectCount: indirectItem.count,
        };
      }
    );

    res.status(200).json({
      success: true,
      data: combinedStats,
      totalUniqueBuyers: totalCategorized.totalCount,
      directBuyers: totalCategorized.directCount,
      indirectBuyers: totalCategorized.indirectCount,
    });
  } catch (error) {
    console.error("Error getting downline package buyer stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get downline package buyer stats",
    });
  }
};

export const getTopPerformers = async (req, res) => {
  try {
    // Get wallets with any earnings
    const wallets = await Wallet.find({ totalEarned: { $gt: 0 } });
    const userIds = wallets.map((w) => w.userId);

    // Fetch related data in parallel
    const [users, specialIncomes, payouts] = await Promise.all([
      User.find({ userId: { $in: userIds } }),
      SpecialIncome.find({ userId: { $in: userIds } }),
      Payout.find({
        userId: { $in: userIds },
        status: { $in: ["approved", "completed"] },
      }),
    ]);

    // Index for quick lookup
    const userMap = new Map(users.map((u) => [u.userId, u]));
    const specialMap = new Map(specialIncomes.map((s) => [s.userId, s]));
    const withdrawnMap = new Map();
    payouts.forEach((p) => {
      withdrawnMap.set(
        p.userId,
        (withdrawnMap.get(p.userId) || 0) + parseFloat(p.amount || 0)
      );
    });

    // Compute total for each wallet like Dashboard
    const computed = wallets.map((w) => {
      const user = userMap.get(w.userId);
      // Super package total from wallet transactions
      const superTx = (w.transactions || []).filter(
        (t) =>
          t.type === "commission" &&
          t.packageName &&
          (t.packageName.toLowerCase().includes("booster") ||
            t.packageName.toLowerCase().includes("bronze") ||
            t.packageName.toLowerCase().includes("silver") ||
            t.packageName.toLowerCase().includes("gold") ||
            t.packageName.toLowerCase().includes("diamond"))
      );
      const superTotal = superTx.reduce(
        (sum, t) => sum + (parseFloat(t.amount) || 0),
        0
      );

      const s = specialMap.get(w.userId);
      const leader = s?.leaderShipFund || 0;
      const royalty = s?.royaltyIncome || 0;
      const reward = s?.rewardIncome || 0;
      const withdrawn = withdrawnMap.get(w.userId) || 0;

      const activeIncome = w.activeIncome || 0;
      const passiveIncome = w.passiveIncome || 0;

      const computedTotal =
        (parseFloat(activeIncome) || 0) +
        (parseFloat(passiveIncome) || 0) +
        (parseFloat(superTotal) || 0) +
        (parseFloat(royalty) || 0) +
        (parseFloat(reward) || 0) +
        (parseFloat(leader) || 0) +
        (parseFloat(withdrawn) || 0);

      return {
        userId: w.userId,
        name: user ? `${user.firstName} ${user.lastName}` : w.userId,
        firstName: user?.firstName,
        lastName: user?.lastName,
        imageUrl: user?.imageUrl || null,
        status: user?.status || "free",
        totalEarned: w.totalEarned,
        computedTotal,
      };
    });

    // Sort by computedTotal desc and take top 3
    computed.sort((a, b) => (b.computedTotal || 0) - (a.computedTotal || 0));
    const topEarners = computed.slice(0, 3);

    res.json({ success: true, data: { topEarners } });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch top performers",
      error: error.message,
    });
  }
};

// Get top performers in my downline (direct + indirect)
export const getTopDownlinePerformers = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Use MongoDB aggregation for better performance
    const pipeline = [
      {
        $match: { sponsorId: userId },
      },
      {
        $graphLookup: {
          from: "users",
          startWith: "$userId",
          connectFromField: "userId",
          connectToField: "sponsorId",
          as: "descendants",
          maxDepth: 120,
          depthField: "level",
        },
      },
      {
        $project: {
          _id: 0,
          userId: 1,
          descendants: "$descendants.userId",
        },
      },
    ];

    const results = await User.aggregate(pipeline);

    // Extract all unique userIds
    const allUserIds = new Set();
    results.forEach((result) => {
      allUserIds.add(result.userId);
      result.descendants.forEach((descId) => allUserIds.add(descId));
    });

    const downlineUserIds = Array.from(allUserIds);

    if (downlineUserIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // Use aggregation to get top performers in one query
    const topPerformersPipeline = [
      {
        $match: { userId: { $in: downlineUserIds } },
      },
      {
        $lookup: {
          from: "wallets",
          localField: "userId",
          foreignField: "userId",
          as: "wallet",
        },
      },
      {
        $unwind: {
          path: "$wallet",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          userId: 1,
          firstName: 1,
          lastName: 1,
          imageUrl: 1,
          status: 1,
          totalEarned: { $ifNull: ["$wallet.totalEarned", 0] },
        },
      },
      {
        $sort: { totalEarned: -1 },
      },
      {
        $limit: 3,
      },
    ];

    const topPerformers = await User.aggregate(topPerformersPipeline);

    res.json({
      success: true,
      data: topPerformers.map((p) => ({
        userId: p.userId,
        firstName: p.firstName,
        lastName: p.lastName,
        imageUrl: p.imageUrl,
        status: p.status,
        totalEarned: p.totalEarned,
      })),
    });
  } catch (error) {
    console.error("Error in getTopDownlinePerformers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch top downline performers",
      error: error.message,
    });
  }
};

// Get total package buyers count for the logged-in user
export const getTotalPackageBuyersCount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const totalCount = await referralService.getTotalPackageBuyersCount(userId);

    res.status(200).json({
      success: true,
      data: {
        totalPackageBuyers: totalCount,
      },
    });
  } catch (error) {
    console.error("Error getting total package buyers count:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get total package buyers count",
    });
  }
};

// Lookup sponsor by ID
export const lookupSponsorById = async (req, res) => {
  try {
    const { sponsorId } = req.body;

    if (!sponsorId) {
      return res.status(400).json({
        success: false,
        message: "Sponsor ID is required",
      });
    }

    // Find user by userId
    const sponsor = await User.findOne({ userId: sponsorId });

    if (!sponsor) {
      return res.status(404).json({
        success: false,
        message: "Sponsor not found with the provided ID",
      });
    }

    // Return sponsor information (excluding sensitive data)
    res.status(200).json({
      success: true,
      sponsor: {
        userId: sponsor.userId,
        firstName: sponsor.firstName,
        lastName: sponsor.lastName,
        mobile: sponsor.mobile,
        email: sponsor.email,
        status: sponsor.status,
        imageUrl: sponsor.imageUrl,
      },
    });
  } catch (error) {
    console.error("Error in lookupSponsorById:", error);
    res.status(500).json({
      success: false,
      message: "Failed to lookup sponsor by ID",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Lookup sponsor by mobile number
export const lookupSponsorByMobile = async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({
        success: false,
        message: "Mobile number is required",
      });
    }

    // Validate mobile number format
    if (!/^\d{10}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid 10-digit mobile number",
      });
    }

    // Find user by mobile number
    const sponsor = await User.findOne({ mobile });

    if (!sponsor) {
      return res.status(404).json({
        success: false,
        message: "Sponsor not found with the provided mobile number",
      });
    }

    // Return sponsor information (excluding sensitive data)
    res.status(200).json({
      success: true,
      sponsor: {
        userId: sponsor.userId,
        firstName: sponsor.firstName,
        lastName: sponsor.lastName,
        mobile: sponsor.mobile,
        email: sponsor.email,
        status: sponsor.status,
        imageUrl: sponsor.imageUrl,
      },
    });
  } catch (error) {
    console.error("Error in lookupSponsorByMobile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to lookup sponsor by mobile",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};
