import Kyc from "../models/Kyc.js";
import User from "../models/User.js";
import cloudinary from "cloudinary";
import fs from "fs";
import { compressKycDocument } from "../utils/imageCompression.js";

// Cloudinary config
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Submit KYC application
export const submitKyc = async (req, res) => {
  try {
    const { name, accountNo, ifsc, branch } = req.body;
    const userId = req.user.userId;

    // Check if user already has a KYC submission
    const existingKyc = await Kyc.findOne({ userId });

    // If existing KYC exists and is not rejected, prevent resubmission
    if (existingKyc && existingKyc.status !== "rejected") {
      return res.status(400).json({
        success: false,
        message: "KYC application already submitted",
      });
    }

    // Track if this is a resubmission
    let isResubmission = false;

    // If existing KYC is rejected, delete the old one to allow resubmission
    if (existingKyc && existingKyc.status === "rejected") {
      isResubmission = true;

      // Delete old document files from Cloudinary if they exist
      const oldFields = ["aadhaarUrl", "panUrl", "kycDocUrl"];
      for (const field of oldFields) {
        if (existingKyc[field]) {
          try {
            // Extract public_id from URL and delete from Cloudinary
            const urlParts = existingKyc[field].split("/");
            const publicId = urlParts[urlParts.length - 1].split(".")[0];
            await cloudinary.v2.uploader.destroy(publicId);
          } catch (deleteError) {
            
          }
        }
      }

      // Delete the old KYC record
      await Kyc.findByIdAndDelete(existingKyc._id);
    }

    // Upload documents to Cloudinary with compression
    const uploadPromises = [];
    const fileFields = ["aadhaar", "pan", "kycDoc"];

    for (const field of fileFields) {
      if (req.files && req.files[field]) {
        const file = req.files[field];

        // Compress and resize KYC document image before uploading
        const compressedImageBuffer = await compressKycDocument(file.data);

        const uploadPromise = new Promise((resolve, reject) => {
          const uploadStream = cloudinary.v2.uploader.upload_stream(
            {
              folder: "kyc-documents",
              public_id: `${userId}-${field}-${Date.now()}`,
              transformation: [
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
        uploadPromises.push({ field, promise: uploadPromise });
      }
    }

    const uploadResults = await Promise.all(
      uploadPromises.map((item) => item.promise)
    );

    // No need to clean up files when using memory storage

    // Create KYC record
    const kycData = {
      userId,
      name,
      accountNo,
      ifsc,
      branch,
    };

    // Map uploaded files to their respective fields
    uploadResults.forEach((result, index) => {
      const field = uploadPromises[index].field;
      kycData[`${field}Url`] = result.secure_url;
    });

    const kyc = new Kyc(kycData);
    await kyc.save();

    res.status(201).json({
      success: true,
      message: isResubmission
        ? "KYC application resubmitted successfully with optimized documents"
        : "KYC application submitted successfully with optimized documents",
      data: kyc,
    });
  } catch (error) {
    console.error("Error submitting KYC:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit KYC application",
      error: error.message,
    });
  }
};

// Get user's KYC status
export const getUserKycStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const kyc = await Kyc.findOne({ userId }).sort({ createdAt: -1 });

    if (!kyc) {
      return res.status(404).json({
        success: false,
        message: "No KYC application found",
      });
    }

    res.json({
      success: true,
      data: kyc,
    });
  } catch (error) {
    console.error("Error fetching KYC status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch KYC status",
    });
  }
};

// Admin: Get all KYC applications
export const getAllKycApplications = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (status && status !== "all") {
      query.status = status;
    }

    const kycApplications = await Kyc.find(query)
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    const userIds = kycApplications.map((k) => k.userId);
    const users = await User.find(
      { userId: { $in: userIds } },
      "userId firstName lastName mobile email"
    );
    const userMap = {};
    users.forEach((u) => {
      userMap[u.userId] = u;
    });
    const applicationsWithUser = kycApplications.map((k) => ({
      ...k.toObject(),
      user: userMap[k.userId] || null,
    }));
    const total = await Kyc.countDocuments(query);

    res.json({
      success: true,
      data: {
        applications: applicationsWithUser,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          totalRecords: total,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching KYC applications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch KYC applications",
    });
  }
};

// Admin: Get single KYC application
export const getKycApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const kyc = await Kyc.findById(id);

    if (!kyc) {
      return res.status(404).json({
        success: false,
        message: "KYC application not found",
      });
    }

    // Get user details manually
    const user = await User.findOne(
      { userId: kyc.userId },
      "userId firstName lastName mobile email"
    );

    const kycWithUser = {
      ...kyc.toObject(),
      userId: user || null,
    };

    res.json({
      success: true,
      data: kycWithUser,
    });
  } catch (error) {
    console.error("Error fetching KYC application:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch KYC application",
    });
  }
};

// Admin: Approve KYC
export const approveKyc = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    const adminId = req.user.userId;

    const kyc = await Kyc.findById(id);
    if (!kyc) {
      return res.status(404).json({
        success: false,
        message: "KYC application not found",
      });
    }

    if (kyc.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "KYC application has already been processed",
      });
    }

    // Update KYC status
    kyc.status = "approved";
    kyc.adminNotes = adminNotes || "";
    kyc.reviewedAt = new Date();
    kyc.reviewedBy = adminId;
    await kyc.save();

    // Update user status to kyc_verified
    await User.findOneAndUpdate(
      { userId: kyc.userId },
      {
        status: "kyc_verified",
        kycVerified: true,
        kycApprovedDate: new Date(),
      }
    );

    res.json({
      success: true,
      message: "KYC approved successfully",
      data: kyc,
    });
  } catch (error) {
    console.error("Error approving KYC:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve KYC",
    });
  }
};

// Admin: Reject KYC
export const rejectKyc = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    const adminId = req.user.userId;

    const kyc = await Kyc.findById(id);
    if (!kyc) {
      return res.status(404).json({
        success: false,
        message: "KYC application not found",
      });
    }

    if (kyc.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "KYC application has already been processed",
      });
    }

    // Update KYC status
    kyc.status = "rejected";
    kyc.adminNotes = adminNotes || "";
    kyc.reviewedAt = new Date();
    kyc.reviewedBy = adminId;
    await kyc.save();

    res.json({
      success: true,
      message: "KYC rejected successfully",
      data: kyc,
    });
  } catch (error) {
    console.error("Error rejecting KYC:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject KYC",
    });
  }
};

// Get KYC statistics for admin dashboard
export const getKycStats = async (req, res) => {
  try {
    const [pending, approved, rejected, total] = await Promise.all([
      Kyc.countDocuments({ status: "pending" }),
      Kyc.countDocuments({ status: "approved" }),
      Kyc.countDocuments({ status: "rejected" }),
      Kyc.countDocuments(),
    ]);

    // Get recent submissions (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentSubmissions = await Kyc.countDocuments({
      submittedAt: { $gte: sevenDaysAgo },
    });

    res.json({
      success: true,
      data: {
        pending,
        approved,
        rejected,
        total,
        recentSubmissions,
      },
    });
  } catch (error) {
    console.error("Error fetching KYC stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch KYC statistics",
    });
  }
};
