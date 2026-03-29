import cloudinary from "../config/cloudinary.js";
import EngagementVideo from "../models/EngagementVideo.js";
import VideoEngagement from "../models/VideoEngagement.js";
import CoinWallet from "../models/Coin.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

const COIN_REWARDS = {
  view: 50,
  like: 20,
  comment: 30,
  share: 10,
};

export const listVideoComments = async (req, res) => {
  try {
    const { videoId } = req.params;

    const video = await EngagementVideo.findById(videoId).select("_id isActive").lean();
    if (!video || !video.isActive) {
      return res.status(404).json({ success: false, message: "Video not found or inactive" });
    }

    const comments = await VideoEngagement.find({ videoId, action: "comment" })
      .sort({ createdAt: -1 })
      .limit(50)
      .select("userId metadata createdAt")
      .lean();

    const userIds = [...new Set(comments.map((c) => c.userId).filter(Boolean))];
    const users = await User.find({ userId: { $in: userIds } })
      .select("userId firstName lastName imageUrl")
      .lean();

    const userMap = new Map(users.map((u) => [u.userId, u]));

    const data = comments
      .map((c) => {
        const text = String(c.metadata?.commentText || "").trim();
        if (!text) return null;
        const u = userMap.get(c.userId);
        const userName = u ? `${u.firstName || ""} ${u.lastName || ""}`.trim() : c.userId;
        return {
          _id: c._id,
          userId: c.userId,
          userName: userName || "User",
          userImageUrl: u?.imageUrl || "",
          text,
          createdAt: c.createdAt,
        };
      })
      .filter(Boolean);

    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load comments", error: error.message });
  }
};

export const adminVideoAnalytics = async (req, res) => {
  try {
    const { videoId } = req.params;

    const video = await EngagementVideo.findById(videoId).select("_id title isActive createdAt").lean();
    if (!video) return res.status(404).json({ success: false, message: "Video not found" });

    const counts = await VideoEngagement.aggregate([
      { $match: { videoId: video._id } },
      { $group: { _id: "$action", count: { $sum: 1 } } },
    ]);

    const byAction = { view: 0, like: 0, comment: 0, share: 0 };
    for (const row of counts) {
      if (row && row._id && typeof row.count === "number") byAction[row._id] = row.count;
    }

    const uniqueUsers = await VideoEngagement.distinct("userId", { videoId: video._id });

    const totalCoins =
      byAction.view * COIN_REWARDS.view +
      byAction.like * COIN_REWARDS.like +
      byAction.comment * COIN_REWARDS.comment +
      byAction.share * COIN_REWARDS.share;

    const lastEngagement = await VideoEngagement.findOne({ videoId: video._id }).sort({ createdAt: -1 }).select("createdAt").lean();

    return res.json({
      success: true,
      data: {
        videoId: String(video._id),
        title: video.title,
        isActive: video.isActive,
        createdAt: video.createdAt,
        byAction,
        uniqueUserCount: uniqueUsers.length,
        totalCoins,
        lastEngagementAt: lastEngagement?.createdAt || null,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load analytics", error: error.message });
  }
};

export const getVideoStats = async (req, res) => {
  try {
    const { videoId } = req.params;

    const video = await EngagementVideo.findById(videoId).select("_id isActive").lean();
    if (!video || !video.isActive) {
      return res.status(404).json({ success: false, message: "Video not found or inactive" });
    }

    const counts = await VideoEngagement.aggregate([
      { $match: { videoId: video._id } },
      { $group: { _id: "$action", count: { $sum: 1 } } },
    ]);

    const byAction = { view: 0, like: 0, comment: 0, share: 0 };
    for (const row of counts) {
      if (row && row._id && typeof row.count === "number") byAction[row._id] = row.count;
    }

    return res.json({ success: true, data: { videoId: String(video._id), byAction } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load stats", error: error.message });
  }
};

export const createVideoShareToken = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { videoId } = req.params;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const video = await EngagementVideo.findById(videoId).select("_id isActive").lean();
    if (!video || !video.isActive) {
      return res.status(404).json({ success: false, message: "Video not found or inactive" });
    }

    // Award "share" coins ONLY when a share link is generated (one-time per video)
    const exists = await VideoEngagement.findOne({ userId, videoId, action: "share" }).lean();
    if (!exists) {
      await VideoEngagement.create({
        userId,
        videoId,
        action: "share",
        metadata: { shareLinkCreatedAt: new Date().toISOString() },
      });

      const wallet = await CoinWallet.getOrCreateWallet(userId);
      const coins = COIN_REWARDS.share || 0;
      await wallet.addCoins(
        "share",
        coins,
        { videoId: video._id, action: "share" },
        `VIDEO_SHARE_${video._id}_${userId}`
      );
    }

    const token = jwt.sign(
      { videoId: String(video._id), mode: "view_only", issuedBy: userId },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      data: {
        token,
        videoId: String(video._id),
        mode: "view_only",
        shareCoinsEarned: exists ? 0 : (COIN_REWARDS.share || 0),
      },
    });
  } catch (error) {
    if (error && error.code === 11000) {
      // share engagement already exists (race) - still issue token
      try {
        const video = await EngagementVideo.findById(req.params.videoId).select("_id").lean();
        const token = video
          ? jwt.sign({ videoId: String(video._id), mode: "view_only", issuedBy: req.user?.userId }, process.env.JWT_SECRET, { expiresIn: "7d" })
          : null;
        return res.status(200).json({ success: true, data: { token, shareCoinsEarned: 0 } });
      } catch (_) {
        return res.status(200).json({ success: true, data: { token: null, shareCoinsEarned: 0 } });
      }
    }
    return res.status(500).json({ success: false, message: "Failed to create share link", error: error.message });
  }
};

export const getSharedEngagementVideo = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) return res.status(400).json({ success: false, message: "token is required" });

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (_) {
      return res.status(400).json({ success: false, message: "Invalid or expired share token" });
    }

    if (!payload?.videoId || payload?.mode !== "view_only") {
      return res.status(400).json({ success: false, message: "Invalid share token" });
    }

    const video = await EngagementVideo.findById(payload.videoId);
    if (!video || !video.isActive) {
      return res.status(404).json({ success: false, message: "Video not found or inactive" });
    }

    return res.json({
      success: true,
      data: {
        _id: video._id,
        title: video.title,
        description: video.description,
        videoUrl: video.videoUrl,
        createdAt: video.createdAt,
        isSharedViewOnly: true,
        sharedByUserId: payload.issuedBy || "",
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load shared video", error: error.message });
  }
};

const ENGAGEMENT_VIDEO_FOLDER = "engagement-videos";

/** Signed params for browser → Cloudinary upload (bypasses Vercel ~4.5MB body limit). */
export const getEngagementVideoUploadSignature = async (req, res) => {
  try {
    const adminId = req.user?.userId;
    if (!adminId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const timestamp = Math.round(Date.now() / 1000);
    const paramsToSign = { timestamp, folder: ENGAGEMENT_VIDEO_FOLDER };
    const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET);

    return res.json({
      success: true,
      data: {
        signature,
        timestamp,
        apiKey: process.env.CLOUDINARY_API_KEY,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        folder: ENGAGEMENT_VIDEO_FOLDER,
      },
    });
  } catch (error) {
    console.error("getEngagementVideoUploadSignature error:", error);
    return res.status(500).json({ success: false, message: "Failed to create upload signature", error: error.message });
  }
};

/** After direct Cloudinary upload, register DB row (validates asset on Cloudinary). */
export const completeEngagementVideoUpload = async (req, res) => {
  try {
    const adminId = req.user?.userId;
    const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
    const description = typeof req.body?.description === "string" ? req.body.description.trim() : "";
    const publicId = typeof req.body?.publicId === "string" ? req.body.publicId.trim() : "";

    if (!adminId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (!title) {
      return res.status(400).json({ success: false, message: "title is required" });
    }
    if (!publicId || !publicId.startsWith(`${ENGAGEMENT_VIDEO_FOLDER}/`)) {
      return res.status(400).json({ success: false, message: "Invalid or missing publicId" });
    }

    let resource;
    try {
      resource = await cloudinary.api.resource(publicId, { resource_type: "video" });
    } catch (err) {
      const code = err?.http_code || err?.error?.http_code;
      if (code === 404) {
        return res.status(400).json({ success: false, message: "Video not found on Cloudinary. Finish uploading first." });
      }
      throw err;
    }

    const video = await EngagementVideo.create({
      title,
      description,
      videoUrl: resource.secure_url,
      publicId: resource.public_id,
      durationSeconds: typeof resource.duration === "number" ? Math.round(resource.duration) : null,
      createdByAdminId: adminId,
    });

    return res.status(201).json({ success: true, data: video });
  } catch (error) {
    console.error("completeEngagementVideoUpload error:", error);
    return res.status(500).json({ success: false, message: "Failed to register video", error: error.message });
  }
};

/** Legacy: upload file through API (fine for local/large Node hosts; blocked by Vercel body limit for big files). */
export const uploadEngagementVideo = async (req, res) => {
  try {
    const { title, description = "" } = req.body;
    const adminId = req.user?.userId;
    const file = req.file;

    if (!adminId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (!title) {
      return res.status(400).json({ success: false, message: "title is required" });
    }
    if (!file) {
      return res.status(400).json({ success: false, message: "video file is required (field: video)" });
    }

    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: ENGAGEMENT_VIDEO_FOLDER,
          resource_type: "video",
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      uploadStream.end(file.buffer);
    });

    const video = await EngagementVideo.create({
      title,
      description,
      videoUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      durationSeconds: typeof uploadResult.duration === "number" ? Math.round(uploadResult.duration) : null,
      createdByAdminId: adminId,
    });

    return res.status(201).json({ success: true, data: video });
  } catch (error) {
    console.error("uploadEngagementVideo error:", error);
    return res.status(500).json({ success: false, message: "Failed to upload video", error: error.message });
  }
};

export const listEngagementVideos = async (req, res) => {
  try {
    const videos = await EngagementVideo.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, data: videos });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to load videos", error: error.message });
  }
};

export const getEngagementVideoById = async (req, res) => {
  try {
    const { videoId } = req.params;
    const video = await EngagementVideo.findById(videoId);
    if (!video || !video.isActive) {
      return res.status(404).json({ success: false, message: "Video not found or inactive" });
    }
    return res.json({ success: true, data: video });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load video", error: error.message });
  }
};

export const getMyVideoEngagements = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { videoId } = req.params;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const engagements = await VideoEngagement.find({ userId, videoId }).select("action -_id").lean();
    const actions = engagements.map((e) => e.action);
    return res.json({ success: true, data: { videoId, actions } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load engagements", error: error.message });
  }
};

export const adminListEngagementVideos = async (req, res) => {
  try {
    const videos = await EngagementVideo.find({}).sort({ createdAt: -1 });
    res.json({ success: true, data: videos });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to load videos", error: error.message });
  }
};

export const adminToggleEngagementVideo = async (req, res) => {
  try {
    const { videoId } = req.params;
    const video = await EngagementVideo.findById(videoId);
    if (!video) return res.status(404).json({ success: false, message: "Video not found" });
    video.isActive = !video.isActive;
    await video.save();
    res.json({ success: true, data: video });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to toggle video", error: error.message });
  }
};

export const adminDeleteEngagementVideo = async (req, res) => {
  try {
    const { videoId } = req.params;
    const video = await EngagementVideo.findById(videoId);
    if (!video) return res.status(404).json({ success: false, message: "Video not found" });

    // Best-effort delete from Cloudinary if present
    if (video.publicId) {
      try {
        await cloudinary.uploader.destroy(video.publicId, { resource_type: "video" });
      } catch (_) { }
    }

    await EngagementVideo.deleteOne({ _id: videoId });
    await VideoEngagement.deleteMany({ videoId });

    res.json({ success: true, message: "Video deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete video", error: error.message });
  }
};

export const claimVideoAction = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { videoId } = req.params;
    const { action, watchTimeSeconds, commentText, shareToken } = req.body || {};

    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!["view", "like", "comment", "share"].includes(action)) {
      return res.status(400).json({ success: false, message: "Invalid action" });
    }

    // If a share token is provided, enforce view-only mode (no other tasks)
    if (shareToken) {
      let payload;
      try {
        payload = jwt.verify(String(shareToken), process.env.JWT_SECRET);
      } catch (_) {
        return res.status(400).json({ success: false, message: "Invalid or expired share token" });
      }
      if (payload?.mode !== "view_only" || String(payload?.videoId) !== String(videoId)) {
        return res.status(400).json({ success: false, message: "Invalid share token" });
      }
      if (action !== "view") {
        return res.status(403).json({ success: false, message: "Only view is allowed from a shared link" });
      }
    }

    const video = await EngagementVideo.findById(videoId);
    if (!video || !video.isActive) {
      return res.status(404).json({ success: false, message: "Video not found or inactive" });
    }

    if (action === "view") {
      const t = parseInt(watchTimeSeconds, 10) || 0;
      if (t < 30) {
        return res.status(400).json({
          success: false,
          message: "Watch at least 30 seconds before claiming view reward",
          requiredSeconds: 30,
          currentSeconds: t,
        });
      }
    }

    // Ensure one action per user per video
    const exists = await VideoEngagement.findOne({ userId, videoId, action });
    if (exists) {
      return res.status(400).json({ success: false, message: "You have already claimed this action for this video" });
    }

    await VideoEngagement.create({
      userId,
      videoId,
      action,
      metadata: {
        watchTimeSeconds: action === "view" ? (parseInt(watchTimeSeconds, 10) || 0) : undefined,
        commentText: action === "comment" ? String(commentText || "").slice(0, 500) : undefined,
      },
    });

    const wallet = await CoinWallet.getOrCreateWallet(userId);
    const coins = COIN_REWARDS[action] || 0;
    await wallet.addCoins(
      action,
      coins,
      { videoId: video._id, videoTitle: video.title, action },
      `VIDEO_${action.toUpperCase()}_${video._id}_${userId}`
    );

    res.json({ success: true, message: `Claimed ${action}`, coinsEarned: coins, newBalance: wallet.balance });
  } catch (error) {
    // Handle duplicate index race
    if (error && error.code === 11000) {
      return res.status(400).json({ success: false, message: "You have already claimed this action for this video" });
    }
    console.error("claimVideoAction error:", error);
    res.status(500).json({ success: false, message: "Failed to claim action", error: error.message });
  }
};

