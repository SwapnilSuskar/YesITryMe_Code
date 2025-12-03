import SocialTask from "../models/SocialTask.js";
import YoutubeToken from "../models/YoutubeToken.js";
import SocialAction from "../models/SocialAction.js";
import CoinWallet from "../models/Coin.js";
import User from "../models/User.js";
import axios from "axios";
import PublicActionSession from "../models/PublicActionSession.js";
import crypto from "crypto";

// YouTube OAuth configuration
const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const YOUTUBE_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
const YOUTUBE_REDIRECT_URI = process.env.YOUTUBE_REDIRECT_URI;

// Coin rewards per action
const COIN_REWARDS = {
  view: 10,
  like: 15,
  comment: 20,
  subscribe: 25,
};

// Helpers: extract IDs from YouTube URLs
function extractYouTubeVideoId(url) {
  if (!url) return "";
  try {
    const patterns = [
      /(?:v=)([\w-]{11})/i, // watch?v=
      /youtu\.be\/([\w-]{11})/i, // youtu.be/ID
      /youtube\.com\/embed\/([\w-]{11})/i, // /embed/ID
      /youtube\.com\/shorts\/([\w-]{11})/i, // /shorts/ID
    ];
    for (const regex of patterns) {
      const match = url.match(regex);
      if (match && match[1]) return match[1];
    }
  } catch (_) {}
  return "";
}

function extractYouTubeChannelIdentifier(url) {
  // Returns UC... channelId, @handle, or c/username segment for later resolution
  if (!url) return "";
  try {
    // Channel ID (youtube.com/channel/UC...)
    let m = url.match(/youtube\.com\/channel\/(UC[\w-]+)/i);
    if (m && m[1]) return m[1];
    
    // Handle (youtube.com/@username or youtu.be/@username)
    m = url.match(/(?:youtube\.com|youtu\.be)\/(@[\w\.-]+)/i);
    if (m && m[1]) return m[1];
    
    // Legacy custom URL (/c/username) or /user/username
    m = url.match(/youtube\.com\/(?:c|user)\/([\w\.-]+)/i);
    if (m && m[1]) return m[1];
    
    // Sometimes channel URLs can be in video watch URLs as a parameter
    m = url.match(/[?&]channel_id=(UC[\w-]+)/i);
    if (m && m[1]) return m[1];
  } catch (_) {}
  return "";
}

// Helper: Refresh access token using refresh_token
async function refreshAccessToken(userId) {
  try {
    const tokenDoc = await YoutubeToken.findOne({ userId });
    if (!tokenDoc || !tokenDoc.refreshToken) return null;

    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      {
        client_id: YOUTUBE_CLIENT_ID,
        client_secret: YOUTUBE_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: tokenDoc.refreshToken,
      }
    );

    const { access_token, expires_in, scope, token_type } = tokenResponse.data;
    const expiryDate = new Date(Date.now() + expires_in * 1000);

    tokenDoc.accessToken = access_token;
    tokenDoc.expiryDate = expiryDate;
    if (scope) tokenDoc.scope = scope;
    if (token_type) tokenDoc.tokenType = token_type;
    await tokenDoc.save();

    return tokenDoc;
  } catch (error) {
    console.error(
      "YouTube token refresh error:",
      error.response?.data || error.message
    );
    return null;
  }
}

// Start YouTube OAuth flow
export const startYouTubeOAuth = async (req, res) => {
  try {
    const { userId } = req.user;

    // Request required scopes for verification (readonly + force-ssl)
    const scope = encodeURIComponent(
      "https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.force-ssl"
    );
    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${YOUTUBE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(YOUTUBE_REDIRECT_URI)}&` +
      `response_type=code&` +
      `scope=${scope}&` +
      `access_type=offline&` +
      `include_granted_scopes=true&` +
      `prompt=consent&` +
      `state=${userId}`;

    res.json({
      success: true,
      authUrl,
      message: "Redirect user to this URL to connect YouTube",
    });
  } catch (error) {
    console.error("YouTube OAuth start error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to start YouTube OAuth",
      error: error.message,
    });
  }
};

// Handle YouTube OAuth callback
export const handleYouTubeCallback = async (req, res) => {
  try {
    const { code, state: userId } = req.query;

    if (!code || !userId) {
      return res.status(400).json({
        success: false,
        message: "Missing authorization code or user ID",
      });
    }

    // Exchange code for tokens
    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      {
        client_id: YOUTUBE_CLIENT_ID,
        client_secret: YOUTUBE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: YOUTUBE_REDIRECT_URI,
      }
    );

    const { access_token, refresh_token, expires_in, scope, token_type } =
      tokenResponse.data;

    // Store tokens in database
    const expiryDate = new Date(Date.now() + expires_in * 1000);

    await YoutubeToken.findOneAndUpdate(
      { userId },
      {
        userId,
        accessToken: access_token,
        refreshToken: refresh_token,
        scope:
          scope ||
          "https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.force-ssl",
        tokenType: token_type || "Bearer",
        expiryDate,
      },
      { upsert: true, new: true }
    );

    // Redirect back to frontend Social Earning page with status
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const redirectUrl = `${frontendUrl}/socialearning?youtube=connected`;
    return res.redirect(302, redirectUrl);
  } catch (error) {
    console.error("YouTube OAuth callback error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to connect YouTube account",
      error: error.message,
    });
  }
};

// PUBLIC FLOW: Start OAuth from a shareable link without requiring site login
export const startPublicYouTubeOAuth = async (req, res) => {
  try {
    const { referral_code, task_id, action, url, video_id, channel_id, coins } =
      req.query;

    if (!referral_code) {
      return res
        .status(400)
        .json({ success: false, message: "referral_code is required" });
    }

    let task = null;
    let resolvedAction = action;
    let resolvedUrl = url;
    let resolvedVideoId = video_id;
    let resolvedChannelId = channel_id;
    let resolvedTitle = "";
    let resolvedCoins = parseInt(coins, 10) || 0;

    if (task_id) {
      // Validate task_id format to prevent URL concatenation issues
      if (!/^[0-9a-fA-F]{24}$/.test(task_id)) {
        console.error("Invalid task_id format:", task_id);
        return res
          .status(400)
          .json({ success: false, message: "Invalid task_id format" });
      }

      task = await SocialTask.findById(task_id);
      if (!task || !task.isActive) {
        return res
          .status(404)
          .json({ success: false, message: "Task not found or inactive" });
      }
      resolvedAction = task.action;
      resolvedUrl = task.url;
      resolvedVideoId =
        task.videoId ||
        (task.action !== "subscribe" ? extractYouTubeVideoId(task.url) : "");
      resolvedChannelId =
        task.channelId ||
        (task.action === "subscribe"
          ? extractYouTubeChannelIdentifier(task.url)
          : "");
      resolvedTitle = task.title;
      resolvedCoins = task.coins;
    }

    if (!resolvedAction || !resolvedUrl) {
      return res.status(400).json({
        success: false,
        message: "Provide task_id or both action and url",
      });
    }
    if (!["view", "like", "comment", "subscribe"].includes(resolvedAction)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid action" });
    }

    // Ensure IDs
    if (!resolvedVideoId && resolvedAction !== "subscribe") {
      resolvedVideoId = extractYouTubeVideoId(resolvedUrl);
    }
    if (!resolvedChannelId && resolvedAction === "subscribe") {
      resolvedChannelId = extractYouTubeChannelIdentifier(resolvedUrl);
    }

    if (!resolvedCoins) {
      resolvedCoins = COIN_REWARDS[resolvedAction] || 1;
    }

    // Resolve referrer by code for attribution
    const referrer = await User.findOne({ referralCode: referral_code });
    if (!referrer) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid referral_code" });
    }

    // Create a new public session
    const sessionId = crypto.randomBytes(16).toString("hex");
    const actingUserId = `PUBLIC_${sessionId}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await PublicActionSession.create({
      sessionId,
      taskId: task ? task._id : undefined,
      action: resolvedAction,
      videoId: resolvedVideoId,
      channelId: resolvedChannelId,
      url: resolvedUrl,
      title: resolvedTitle,
      coins: resolvedCoins,
      referralCode: referral_code,
      referrerUserId: referrer.userId,
      actingUserId,
      status: resolvedAction === "view" ? "oauth_connected" : "oauth_pending",
      youtubeConnected: resolvedAction === "view" ? true : false, // View tasks don't need OAuth
      expiresAt,
    });

    // For view tasks, redirect directly to the public task page (no OAuth needed)
    if (resolvedAction === "view") {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const redirectUrl = `${frontendUrl}/public-task?session=${sessionId}`;

      if ((req.query.format || "").toLowerCase() === "json") {
        return res.json({ success: true, redirectUrl, sessionId });
      }
      return res.redirect(302, redirectUrl);
    }

    const state = `public:${sessionId}`;
    // Public flow: request required scopes and offline access to allow refresh
    const scope = encodeURIComponent(
      "https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.force-ssl"
    );
    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${YOUTUBE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(YOUTUBE_REDIRECT_URI)}&` +
      `response_type=code&` +
      `scope=${scope}&` +
      `access_type=offline&` +
      `include_granted_scopes=true&` +
      `prompt=consent&` +
      `state=${encodeURIComponent(state)}`;

    // If the caller requests JSON explicitly, return JSON; otherwise redirect for a better share-link UX
    if ((req.query.format || "").toLowerCase() === "json") {
      return res.json({ success: true, authUrl, sessionId });
    }
    return res.redirect(302, authUrl);
  } catch (error) {
    console.error("Public OAuth start error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to start public YouTube OAuth",
      error: error.message,
    });
  }
};

// PUBLIC FLOW: OAuth callback that continues verification and awards referrer
export const handlePublicYouTubeCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code || !state) {
      return res
        .status(400)
        .json({ success: false, message: "Missing code or state" });
    }

    const isPublicState = String(state).startsWith("public:");
    let session = null;
    if (isPublicState) {
      const sessionId = String(state).split(":")[1];
      session = await PublicActionSession.findOne({ sessionId });
      if (!session) {
        return res
          .status(404)
          .json({ success: false, message: "Session not found" });
      }
    }
    if (session && session.expiresAt && session.expiresAt <= new Date()) {
      session.status = "expired";
      await session.save();
      return res
        .status(410)
        .json({ success: false, message: "Session expired" });
    }

    // Exchange code for tokens
    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      {
        client_id: YOUTUBE_CLIENT_ID,
        client_secret: YOUTUBE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: YOUTUBE_REDIRECT_URI,
      }
    );

    const { access_token, refresh_token, expires_in, scope, token_type } =
      tokenResponse.data;
    const expiryDate = new Date(Date.now() + (expires_in || 0) * 1000);

    // Persist token for acting public user
    const tokenUserId = isPublicState ? session.actingUserId : String(state);
    await YoutubeToken.findOneAndUpdate(
      { userId: tokenUserId },
      {
        userId: tokenUserId,
        accessToken: access_token,
        refreshToken: refresh_token,
        scope:
          scope ||
          "https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.force-ssl",
        tokenType: token_type || "Bearer",
        expiryDate,
      },
      { upsert: true, new: true }
    );

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    if (!isPublicState) {
      // Private flow token stored but hit public callback: send to in-app page
      return res.redirect(
        302,
        `${frontendUrl}/socialearning?youtube=connected`
      );
    }

    // Public flow: mark session as connected and redirect user to public task page
    session.youtubeConnected = true;
    session.status = "oauth_connected";
    session.expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await session.save();
    return res.redirect(
      302,
      `${frontendUrl}/public-task?session=${encodeURIComponent(
        session.sessionId
      )}`
    );
  } catch (error) {
    console.error(
      "Public OAuth callback error:",
      error.response?.data || error.message
    );
    try {
      const { state } = req.query || {};
      if (state && String(state).startsWith("public:")) {
        const sessionId = String(state).split(":")[1];
        await PublicActionSession.updateOne(
          { sessionId },
          { status: "failed", error: error.message }
        );
      }
    } catch (_) {}
    res.status(500).json({
      success: false,
      message: "Failed to complete public verification",
      error: error.message,
    });
  }
};

// PUBLIC FLOW: Get session data
export const getPublicSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      return res
        .status(400)
        .json({ success: false, message: "sessionId is required" });
    }

    const session = await PublicActionSession.findOne({ sessionId });
    if (!session) {
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });
    }

    if (session.expiresAt && session.expiresAt <= new Date()) {
      session.status = "expired";
      await session.save();
      return res
        .status(410)
        .json({ success: false, message: "Session expired" });
    }

    res.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        title: session.title,
        action: session.action,
        url: session.url,
        videoId: session.videoId,
        channelId: session.channelId,
        coins: session.coins,
        referralCode: session.referralCode,
        status: session.status,
        youtubeConnected: session.youtubeConnected,
        expiresAt: session.expiresAt,
      },
    });
  } catch (error) {
    console.error("getPublicSession error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch session",
      error: error.message,
    });
  }
};

// PUBLIC FLOW: Verify a public session later (idempotent)
export const verifyPublicAction = async (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id) {
      return res
        .status(400)
        .json({ success: false, message: "session_id is required" });
    }
    const session = await PublicActionSession.findOne({
      sessionId: session_id,
    });
    if (!session) {
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });
    }
    if (session.expiresAt && session.expiresAt <= new Date()) {
      session.status = "expired";
      await session.save();
      return res
        .status(410)
        .json({ success: false, message: "Session expired" });
    }
    if (session.status === "verified") {
      return res.json({
        success: true,
        message: "Already verified",
        coins: session.coins,
      });
    }
    // For view tasks, we don't need YouTube OAuth - just check if user has watched for required time
    if (session.action === "view") {
      // Check if user has watched for at least 33 seconds (this will be tracked on frontend)
      const { watchTime } = req.query;
      const requiredWatchTime = 33; // 33 seconds

      if (!watchTime || parseInt(watchTime) < requiredWatchTime) {
        return res.status(400).json({
          success: false,
          message: `Please watch the video for at least 30 seconds before claiming coins.`,
          requiredWatchTime: 33,
          currentWatchTime: parseInt(watchTime) || 0,
        });
      }
    } else {
      // For other actions (like, comment, subscribe), require YouTube OAuth
      if (!session.youtubeConnected) {
        return res.status(400).json({
          success: false,
          message: "YouTube not connected for this session",
        });
      }

      // Load token
      let tokenDoc = await YoutubeToken.findOne({
        userId: session.actingUserId,
      });
      if (!tokenDoc) {
        return res.status(400).json({
          success: false,
          message: "Missing YouTube token for session",
        });
      }
      if (
        tokenDoc.expiryDate &&
        tokenDoc.expiryDate <= new Date() &&
        tokenDoc.refreshToken
      ) {
        const refreshed = await refreshAccessToken(session.actingUserId);
        if (refreshed) tokenDoc = refreshed;
      }

      const taskLike = {
        videoId: session.videoId,
        channelId: session.channelId,
        url: session.url,
        action: session.action,
        title: session.title || "",
        coins: session.coins,
      };

      let isVerified = false;
      try {
        isVerified = await verifyYouTubeAction(
          tokenDoc.accessToken,
          taskLike,
          session.action
        );
      } catch (e) {
        if (e && e.code === "INSUFFICIENT_SCOPE") {
          return res.status(403).json({
            success: false,
            message:
              "Your YouTube permission is missing required scopes. Please reconnect and try again.",
            requiresReconnect: true,
            reconnectUrl: `${
              process.env.API_BASE_URL || ""
            }/api/social/public/start?referral_code=${encodeURIComponent(
              session.referralCode
            )}&task_id=${encodeURIComponent(session.taskId || "")}`,
          });
        }
        throw e;
      }
      if (!isVerified) {
        return res.status(400).json({
          success: false,
          message:
            "Action not yet verified. Complete the action, then try again.",
        });
      }
    }

    if (session.referrerUserId) {
      const sponsorWallet = await CoinWallet.getOrCreateWallet(
        session.referrerUserId
      );
      await sponsorWallet.addCoins(
        "referral_bonus",
        20,
        {
          referredUserId: session.actingUserId,
          action: session.action,
          videoId: session.videoId,
          channelId: session.channelId,
          sessionId: session.sessionId,
        },
        `PUBLIC_REFERRAL_${session.action.toUpperCase()}_${session.sessionId}`
      );
    }

    session.status = "verified";
    await session.save();
    res.json({
      success: true,
      message: "Verified and rewarded",
      coins: session.coins,
    });
  } catch (error) {
    console.error(
      "verifyPublicAction error:",
      error.response?.data || error.message
    );
    res.status(500).json({
      success: false,
      message: "Verification failed",
      error: error.message,
    });
  }
};

// ADMIN: Generate a shareable link for a social task and referral code
export const getShareableLink = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Admin access required" });
    }
    const { taskId, referralCode } = req.query;
    if (!taskId || !referralCode) {
      return res.status(400).json({
        success: false,
        message: "taskId and referralCode are required",
      });
    }
    const task = await SocialTask.findById(taskId);
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }
    const apiBase = process.env.API_BASE_URL || process.env.BACKEND_URL || "";
    const shareUrl = `${apiBase}/api/social/public/start?referral_code=${encodeURIComponent(
      referralCode
    )}&task_id=${task._id}`;
    res.json({ success: true, shareUrl });
  } catch (error) {
    console.error("Get shareable link error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate share link",
      error: error.message,
    });
  }
};

// Get user's YouTube connection status
export const getYouTubeStatus = async (req, res) => {
  try {
    const { userId } = req.user;

    let token = await YoutubeToken.findOne({ userId });
    // Attempt refresh if expired
    if (token && token.expiryDate && token.expiryDate <= new Date()) {
      const refreshed = await refreshAccessToken(userId);
      if (refreshed) token = refreshed;
    }

    res.json({
      success: true,
      connected: !!token,
      hasValidToken: !!(
        token &&
        token.expiryDate &&
        token.expiryDate > new Date()
      ),
    });
  } catch (error) {
    console.error("Get YouTube status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get YouTube status",
      error: error.message,
    });
  }
};

// Get user's YouTube channel information
export const getYouTubeChannelInfo = async (req, res) => {
  try {
    const { userId } = req.user;

    let token = await YoutubeToken.findOne({ userId });
    if (!token) {
      return res.status(400).json({
        success: false,
        message: "YouTube account not connected or token expired",
      });
    }

    // Refresh if expired
    if (token.expiryDate && token.expiryDate <= new Date()) {
      const refreshed = await refreshAccessToken(userId);
      if (refreshed) token = refreshed;
      else {
        return res.status(400).json({
          success: false,
          message: "YouTube token expired. Please reconnect.",
        });
      }
    }

    // Get channel information using YouTube API
    const headers = {
      Authorization: `Bearer ${token.accessToken}`,
      Accept: "application/json",
    };

    const response = await axios.get(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
      { headers }
    );

    if (response.data.items && response.data.items.length > 0) {
      const channel = response.data.items[0];
      res.json({
        success: true,
        data: {
          channelId: channel.id,
          channelTitle: channel.snippet.title,
          channelUrl: `https://www.youtube.com/channel/${channel.id}`,
        },
      });
    } else {
      res.status(404).json({
        success: false,
        message: "No YouTube channel found",
      });
    }
  } catch (error) {
    console.error("Get YouTube channel info error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get YouTube channel information",
      error: error.message,
    });
  }
};

// Disconnect YouTube (delete stored tokens and optionally revoke)
export const disconnectYouTube = async (req, res) => {
  try {
    const { userId } = req.user;

    const tokenDoc = await YoutubeToken.findOne({ userId });
    if (tokenDoc && tokenDoc.accessToken) {
      // Best-effort revoke; ignore errors
      try {
        await axios.post("https://oauth2.googleapis.com/revoke", null, {
          params: { token: tokenDoc.accessToken },
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
      } catch (e) {
        // ignore
      }
    }

    await YoutubeToken.deleteOne({ userId });

    res.json({ success: true, message: "YouTube account disconnected." });
  } catch (error) {
    console.error("Disconnect YouTube error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to disconnect YouTube",
      error: error.message,
    });
  }
};

// Get active social tasks
export const getSocialTasks = async (req, res) => {
  try {
    const now = new Date();

    const tasks = await SocialTask.find({
      isActive: true,
      $or: [{ startAt: { $exists: false } }, { startAt: { $lte: now } }],
      $or: [{ endAt: { $exists: false } }, { endAt: { $gte: now } }],
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    console.error("Get social tasks error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get social tasks",
      error: error.message,
    });
  }
};

// Verify and claim social action
export const verifySocialAction = async (req, res) => {
  try {
    const { userId } = req.user;
    const { taskId, action, watchTime } = req.body;

    // Get task
    const task = await SocialTask.findById(taskId);
    if (!task || !task.isActive) {
      return res.status(404).json({
        success: false,
        message: "Task not found or inactive",
      });
    }

    // Check if user already claimed this task
    const existingAction = await SocialAction.findOne({ userId, taskId });
    if (existingAction) {
      return res.status(400).json({
        success: false,
        message: "You have already claimed this task",
      });
    }

    // For non-view actions, require a valid YouTube token. Views do not require OAuth.
    let youtubeToken = null;
    if (action !== "view") {
      youtubeToken = await YoutubeToken.findOne({ userId });
      if (!youtubeToken) {
        return res.status(400).json({
          success: false,
          message: "YouTube account not connected or token expired",
        });
      }
      // Refresh if expired
      if (youtubeToken.expiryDate && youtubeToken.expiryDate <= new Date()) {
        const refreshed = await refreshAccessToken(userId);
        if (refreshed) youtubeToken = refreshed;
        else {
          return res.status(400).json({
            success: false,
            message: "YouTube token expired. Please reconnect.",
          });
        }
      }
    }

    // Ensure videoId/channelId derived from URL if missing
    if (!task.videoId && task.url) {
      task.videoId = extractYouTubeVideoId(task.url);
    }
    if (!task.channelId && task.url) {
      task.channelId = extractYouTubeChannelIdentifier(task.url);
    }
    // For view tasks, validate watch time instead of YouTube API verification
    let isVerified = false;
    if (action === "view") {
      const requiredWatchTime = 33; // 33 seconds internally
      if (!watchTime || parseInt(watchTime) < requiredWatchTime) {
        return res.status(400).json({
          success: false,
          message: `Please watch the video for at least 30 seconds before claiming coins.`,
          requiredWatchTime: 33,
          currentWatchTime: parseInt(watchTime) || 0,
        });
      }
      isVerified = true; // If watch time is sufficient, consider it verified
    } else {
      try {
        isVerified = await verifyYouTubeAction(
          youtubeToken.accessToken,
          task,
          action
        );
      } catch (e) {
        if (e && e.code === "INSUFFICIENT_SCOPE") {
          return res.status(403).json({
            success: false,
            message:
              "Your YouTube permission is missing required scopes. Please disconnect and reconnect YouTube, then try again.",
            requiresReconnect: true,
          });
        }
        throw e;
      }
    }

    if (!isVerified) {
      let errorMessage =
        "Action not verified. Please complete the required action first.";

      // Provide more specific error messages based on the action
      if (action === "subscribe") {
        errorMessage =
          "Subscription not verified. Please make sure you are subscribed to the channel and try again.";
      } else if (action === "comment") {
        errorMessage =
          "Comment not verified. Please make sure you have commented on the video and try again.";
      } else if (action === "like") {
        errorMessage =
          "Like not verified. Please make sure you have liked the video and try again.";
      } else if (action === "view") {
        errorMessage =
          "View not verified. Please make sure you have watched the video for at least 30 seconds and try again.";
      }

      return res.status(400).json({
        success: false,
        message: errorMessage,
      });
    }

    // Create social action record (idempotent). If already exists, respond gracefully.
    try {
      const socialAction = new SocialAction({
        userId,
        taskId,
        action,
        videoId: task.videoId,
        channelId: task.channelId,
        coinsEarned: task.coins,
        status: "verified",
        verifiedAt: new Date(),
      });
      await socialAction.save();
    } catch (e) {
      if (e && e.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "You have already claimed this task",
        });
      }
      throw e;
    }

    // Award coins to user
    const wallet = await CoinWallet.getOrCreateWallet(userId);
    await wallet.addCoins(
      action,
      task.coins,
      { taskId: task._id, taskTitle: task.title },
      `SOCIAL_${action.toUpperCase()}_${task._id}`
    );

    // Award referral bonus if user has a sponsor
    const user = await User.findOne({ userId });
    if (user && user.sponsorId) {
      const sponsorWallet = await CoinWallet.getOrCreateWallet(user.sponsorId);
      await sponsorWallet.addCoins(
        "referral_bonus",
        20,
        {
          referredUserId: userId,
          referredUserName: `${user.firstName} ${user.lastName}`,
          action,
          taskId: task._id,
          taskTitle: task.title,
        },
        `REFERRAL_${action.toUpperCase()}_${userId}_${task._id}`
      );
    }

    res.json({
      success: true,
      message: `Action verified! You earned ${task.coins} coins.`,
      coinsEarned: task.coins,
      newBalance: wallet.balance,
    });
  } catch (error) {
    console.error("Verify social action error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify action",
      error: error.message,
    });
  }
};

// Verify YouTube action using API
async function verifyYouTubeAction(accessToken, task, action) {
  try {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    };

    switch (action) {
      case "view":
        // For views, we can't directly verify, so we'll trust the user
        // In a real implementation, you might use YouTube Analytics API
        return true;

      case "like":
        if (task.videoId) {
          try {
            // Use YouTube Data API to fetch the authenticated user's rating for the video
            const response = await axios.get(
              `https://www.googleapis.com/youtube/v3/videos/getRating?id=${task.videoId}`,
              { headers }
            );
            if (response.data.items && response.data.items.length > 0) {
              const rating = response.data.items[0]?.rating;
              // Only verified if the user's rating is explicitly 'like'
              return rating === "like";
            }
            return false;
          } catch (error) {
            const errPayload = error.response?.data || {};
            console.error(
              "Like verification error:",
              errPayload || error.message
            );
            // Surface insufficient scope so caller can instruct reconnect
            if (
              errPayload?.error?.status === "PERMISSION_DENIED" ||
              errPayload?.error?.code === 403
            ) {
              const msg = errPayload?.error?.message || "";
              if (msg.includes("insufficient authentication scopes")) {
                const insufficient = new Error("INSUFFICIENT_SCOPE");
                insufficient.code = "INSUFFICIENT_SCOPE";
                throw insufficient;
              }
            }
            return false;
          }
        }
        // If no videoId, cannot verify
        return false;

      case "comment":
        if (task.videoId) {
          try {
            // Get user's channel ID first
            const userChannelResponse = await axios.get(
              "https://www.googleapis.com/youtube/v3/channels?part=id&mine=true",
              { headers }
            );

            if (
              !userChannelResponse.data.items ||
              userChannelResponse.data.items.length === 0
            ) {
              return false;
            }
            const userChannelId = userChannelResponse.data.items[0].id;
            // Check if user has commented on the video
            const commentsResponse = await axios.get(
              `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${task.videoId}&maxResults=100`,
              { headers }
            );
            if (commentsResponse.data.items) {
              // Check if any comment is from the user's channel
              const userComment = commentsResponse.data.items.find(
                (comment) =>
                  comment.snippet.topLevelComment.snippet.authorChannelId
                    ?.value === userChannelId
              );

              if (userComment) {
                return true;
              } else {
                return false;
              }
            } else {
              return false;
            }
          } catch (error) {
            const errPayload = error.response?.data || {};
            console.error(
              "Comment verification error:",
              errPayload || error.message
            );
            // Surface insufficient scope so caller can instruct reconnect
            if (
              errPayload?.error?.status === "PERMISSION_DENIED" ||
              errPayload?.error?.code === 403
            ) {
              const msg = errPayload?.error?.message || "";
              if (msg.includes("insufficient authentication scopes")) {
                const insufficient = new Error("INSUFFICIENT_SCOPE");
                insufficient.code = "INSUFFICIENT_SCOPE";
                throw insufficient;
              }
            }
            return false;
          }
        }
        // If no videoId, cannot verify
        return false;

      case "subscribe":
        if (task.channelId) {
          try {
            // First, try to get the proper channel ID if we have a username or handle
            let channelId = task.channelId;
            console.log(`[Subscribe Verification] Original channelId: ${channelId}`);

            // If channelId doesn't start with UC, we need to resolve it to a proper channel ID
            if (!channelId.startsWith("UC")) {
              try {
                // If it's a handle starting with @, remove the @ for the search query
                const searchQuery = channelId.startsWith("@") 
                  ? channelId.substring(1) 
                  : channelId;
                
                console.log(`[Subscribe Verification] Resolving channel with query: ${searchQuery}`);

                // Try resolving as username first (for legacy /user/ URLs)
                if (!channelId.startsWith("@")) {
                const channelResponse = await axios.get(
                    `https://www.googleapis.com/youtube/v3/channels?part=id&forUsername=${searchQuery}`,
                  { headers }
                );

                if (
                  channelResponse.data.items &&
                  channelResponse.data.items.length > 0
                ) {
                  channelId = channelResponse.data.items[0].id;
                    console.log(`[Subscribe Verification] Resolved via username to: ${channelId}`);
                  }
                }

                // If username resolution didn't work, try searching by handle/channel name
                if (!channelId.startsWith("UC")) {
                  console.log(`[Subscribe Verification] Trying search API for: ${searchQuery}`);
                  const searchResponse = await axios.get(
                    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(
                      searchQuery
                    )}&maxResults=1`,
                    { headers }
                  );

                  if (
                    searchResponse.data.items &&
                    searchResponse.data.items.length > 0
                  ) {
                    channelId = searchResponse.data.items[0].id.channelId || searchResponse.data.items[0].snippet.channelId;
                    console.log(`[Subscribe Verification] Resolved via search to: ${channelId}`);
                  } else {
                    console.error("[Subscribe Verification] Could not resolve channel ID from:", task.channelId);
                    return false;
                  }
                }
              } catch (resolveError) {
                console.error(
                  "[Subscribe Verification] Error resolving channel ID:",
                  resolveError.response?.data || resolveError.message
                );
                return false;
              }
            }

            console.log(`[Subscribe Verification] Checking subscription for resolved channelId: ${channelId}`);
            // Now check if user is subscribed to the channel using the resolved UC... channel ID
            const response = await axios.get(
              `https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true&forChannelId=${channelId}`,
              { headers }
            );

            const isSubscribed = response.data.items && response.data.items.length > 0;
            console.log(`[Subscribe Verification] Subscription status: ${isSubscribed}`);

            // Only return true if we actually find a subscription
            return isSubscribed;
          } catch (error) {
            console.error(
              "[Subscribe Verification] Subscription verification error:",
              error.response?.data || error.message
            );
            return false;
          }
        }
        console.error("[Subscribe Verification] No channelId provided in task");
        // If no channelId, cannot verify
        return false;

      default:
        return false;
    }
  } catch (error) {
    console.error("YouTube API verification error:", error);
    return false;
  }
}

// Admin: Create social task
export const createSocialTask = async (req, res) => {
  try {
    const { userId } = req.user;

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const {
      action,
      title,
      url,
      videoId,
      channelId,
      maxClaimsPerUser = 1,
      startAt,
      endAt,
    } = req.body;

    // Validate required fields
    if (!action || !title || !url) {
      return res.status(400).json({
        success: false,
        message: "Action, title, and URL are required",
      });
    }

    // Validate action type
    if (!["view", "like", "comment", "subscribe"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action type",
      });
    }

    const parsedVideoId =
      videoId || (action !== "subscribe" ? extractYouTubeVideoId(url) : "");
    const parsedChannel =
      channelId ||
      (action === "subscribe" ? extractYouTubeChannelIdentifier(url) : "");

    const task = new SocialTask({
      createdByAdminId: userId,
      action,
      title,
      url,
      videoId: parsedVideoId,
      channelId: parsedChannel,
      coins: COIN_REWARDS[action] ?? 1,
      maxClaimsPerUser,
      startAt: startAt ? new Date(startAt) : undefined,
      endAt: endAt ? new Date(endAt) : undefined,
    });

    await task.save();

    res.status(201).json({
      success: true,
      message: "Social task created successfully",
      data: task,
    });
  } catch (error) {
    console.error("Create social task error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create social task",
      error: error.message,
    });
  }
};

// Admin: Get all social tasks
export const getAllSocialTasks = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const tasks = await SocialTask.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    console.error("Get all social tasks error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get social tasks",
      error: error.message,
    });
  }
};

// Admin: Toggle task status
export const toggleTaskStatus = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const { taskId } = req.params;
    const task = await SocialTask.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    task.isActive = !task.isActive;
    await task.save();

    res.json({
      success: true,
      message: `Task ${
        task.isActive ? "activated" : "deactivated"
      } successfully`,
      data: task,
    });
  } catch (error) {
    console.error("Toggle task status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle task status",
      error: error.message,
    });
  }
};

// Admin: Update a social task
export const updateSocialTask = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Admin access required" });
    }

    const { taskId } = req.params;
    const {
      action,
      title,
      url,
      videoId,
      channelId,
      maxClaimsPerUser,
      startAt,
      endAt,
      isActive,
    } = req.body;

    const task = await SocialTask.findById(taskId);
    if (!task)
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });

    if (action && !["view", "like", "comment", "subscribe"].includes(action)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid action type" });
    }

    if (action) task.action = action;
    if (typeof title === "string") task.title = title;
    if (typeof url === "string") task.url = url;
    if (typeof videoId === "string") task.videoId = videoId;
    if (typeof channelId === "string") task.channelId = channelId;

    // Auto-parse IDs from URL if not provided or URL changed
    if (typeof url === "string") {
      if (!task.videoId && task.action !== "subscribe") {
        task.videoId = extractYouTubeVideoId(task.url);
      }
      if (!task.channelId && task.action === "subscribe") {
        task.channelId = extractYouTubeChannelIdentifier(task.url);
      }
    }
    if (typeof maxClaimsPerUser === "number")
      task.maxClaimsPerUser = maxClaimsPerUser;
    if (typeof isActive === "boolean") task.isActive = isActive;
    if (startAt !== undefined)
      task.startAt = startAt ? new Date(startAt) : undefined;
    if (endAt !== undefined) task.endAt = endAt ? new Date(endAt) : undefined;

    await task.save();
    res.json({ success: true, message: "Task updated", data: task });
  } catch (error) {
    console.error("Update social task error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update task",
      error: error.message,
    });
  }
};

// Admin: Delete a social task
export const deleteSocialTask = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Admin access required" });
    }

    const { taskId } = req.params;
    const task = await SocialTask.findByIdAndDelete(taskId);
    if (!task)
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });

    res.json({ success: true, message: "Task deleted" });
  } catch (error) {
    console.error("Delete social task error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete task",
      error: error.message,
    });
  }
};
