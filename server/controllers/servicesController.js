import ServiceConfig from "../models/ServiceConfig.js";
import ServiceRequest from "../models/ServiceRequest.js";
import nodemailer from "nodemailer";

const DEFAULT_CONFIGS = [
  { serviceKey: "insurance", title: "Insurance", actionType: "contact_form" },
  { serviceKey: "credit_card", title: "Credit Card", actionType: "contact_form" },
  { serviceKey: "demat_account", title: "Demat Account", actionType: "link", linkLabel: "Open link", linkUrl: "" },
  { serviceKey: "bank_account", title: "Bank Account", actionType: "contact_form" },
];

async function ensureDefaults() {
  const existing = await ServiceConfig.find({}).select("serviceKey").lean();
  const set = new Set(existing.map((e) => e.serviceKey));
  const missing = DEFAULT_CONFIGS.filter((d) => !set.has(d.serviceKey));
  if (missing.length) {
    await ServiceConfig.insertMany(missing, { ordered: false }).catch(() => { });
  }
}

export const listActiveServiceConfigs = async (req, res) => {
  try {
    await ensureDefaults();
    const configs = await ServiceConfig.find({ isActive: true }).sort({ serviceKey: 1 }).lean();
    res.json({ success: true, data: configs });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to load services", error: error.message });
  }
};

export const createServiceRequest = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { serviceKey, name = "", mobile = "", email = "", notes = "" } = req.body || {};
    if (!serviceKey) return res.status(400).json({ success: false, message: "serviceKey is required" });

    const cfg = await ServiceConfig.findOne({ serviceKey, isActive: true }).lean();
    if (!cfg) return res.status(404).json({ success: false, message: "Service not available" });
    if (cfg.actionType !== "contact_form") {
      return res.status(400).json({ success: false, message: "This service does not use contact form" });
    }

    const request = await ServiceRequest.create({
      userId,
      serviceKey,
      name: String(name || `${req.user?.firstName || ""} ${req.user?.lastName || ""}`.trim()).slice(0, 120),
      mobile: String(mobile || req.user?.mobile || "").slice(0, 20),
      email: String(email || req.user?.email || "").slice(0, 120),
      notes: String(notes).slice(0, 1000),
    });

    // Send email to admin (same pattern as contact form)
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      const safe = (v) => String(v || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");

      await transporter.sendMail({
        from: `"YesITryMe Services" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER,
        subject: `New Service Request: ${cfg.title || cfg.serviceKey} (${request.userId})`,
        html: `
          <h3>New Service Request</h3>
          <p><strong>Service:</strong> ${safe(cfg.title || cfg.serviceKey)} (${safe(cfg.serviceKey)})</p>
          <p><strong>User ID:</strong> ${safe(request.userId)}</p>
          <p><strong>Name:</strong> ${safe(request.name)}</p>
          <p><strong>Mobile:</strong> ${safe(request.mobile)}</p>
          <p><strong>Email:</strong> ${safe(request.email)}</p>
          <p><strong>Notes:</strong><br/>${safe(request.notes).replace(/\n/g, "<br/>")}</p>
          <p><strong>Submitted At:</strong> ${new Date(request.createdAt).toLocaleString("en-IN")}</p>
        `,
      });
    } catch (emailErr) {
      console.error("Service request email failed:", emailErr?.message || emailErr);
    }

    res.status(201).json({ success: true, data: request, message: "Request submitted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to submit request", error: error.message });
  }
};

// Admin
export const adminListServiceConfigs = async (req, res) => {
  try {
    await ensureDefaults();
    const configs = await ServiceConfig.find({}).sort({ serviceKey: 1 }).lean();
    res.json({ success: true, data: configs });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to load service configs", error: error.message });
  }
};

export const adminUpsertServiceConfig = async (req, res) => {
  try {
    const adminId = req.user?.userId;
    const { serviceKey } = req.params;
    const { title, actionType, linkUrl = "", linkLabel = "", message = "", isActive } = req.body || {};

    if (!serviceKey) return res.status(400).json({ success: false, message: "serviceKey is required" });
    if (!title) return res.status(400).json({ success: false, message: "title is required" });
    if (!["contact_form", "link"].includes(actionType)) {
      return res.status(400).json({ success: false, message: "Invalid actionType" });
    }

    const patch = {
      serviceKey,
      title: String(title).slice(0, 80),
      actionType,
      linkUrl: actionType === "link" ? String(linkUrl).slice(0, 500) : "",
      linkLabel: actionType === "link" ? String(linkLabel).slice(0, 80) : "",
      message: String(message).slice(0, 500),
      updatedByAdminId: String(adminId || ""),
    };
    if (typeof isActive === "boolean") patch.isActive = isActive;

    const cfg = await ServiceConfig.findOneAndUpdate({ serviceKey }, patch, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    });

    res.json({ success: true, data: cfg });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update config", error: error.message });
  }
};

export const adminCreateServiceConfig = async (req, res) => {
  try {
    const adminId = req.user?.userId;
    const { serviceKey, title, actionType, linkUrl = "", linkLabel = "", message = "", isActive = true } = req.body || {};

    const key = String(serviceKey || "").trim();
    if (!key) return res.status(400).json({ success: false, message: "serviceKey is required" });
    if (!/^[a-z0-9_]+$/.test(key)) {
      return res.status(400).json({ success: false, message: "serviceKey must be lowercase letters/numbers/underscore" });
    }
    if (!title) return res.status(400).json({ success: false, message: "title is required" });
    if (!["contact_form", "link"].includes(actionType)) {
      return res.status(400).json({ success: false, message: "Invalid actionType" });
    }

    const existing = await ServiceConfig.findOne({ serviceKey: key }).lean();
    if (existing) return res.status(400).json({ success: false, message: "serviceKey already exists" });

    const cfg = await ServiceConfig.create({
      serviceKey: key,
      title: String(title).slice(0, 80),
      actionType,
      linkUrl: actionType === "link" ? String(linkUrl).slice(0, 500) : "",
      linkLabel: actionType === "link" ? String(linkLabel).slice(0, 80) : "",
      message: String(message).slice(0, 500),
      isActive: !!isActive,
      updatedByAdminId: String(adminId || ""),
    });

    res.status(201).json({ success: true, data: cfg });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(400).json({ success: false, message: "serviceKey already exists" });
    }
    res.status(500).json({ success: false, message: "Failed to create service", error: error.message });
  }
};

export const adminDeleteServiceConfig = async (req, res) => {
  try {
    const { serviceKey } = req.params;
    const key = String(serviceKey || "").trim();
    if (!key) return res.status(400).json({ success: false, message: "serviceKey is required" });

    const cfg = await ServiceConfig.findOne({ serviceKey: key }).lean();
    if (!cfg) return res.status(404).json({ success: false, message: "Service not found" });

    await ServiceConfig.deleteOne({ serviceKey: key });

    res.json({ success: true, message: "Service deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete service", error: error.message });
  }
};

export const adminListServiceRequests = async (req, res) => {
  try {
    const { serviceKey = "", status = "" } = req.query;
    const q = {};
    if (serviceKey) q.serviceKey = serviceKey;
    if (status) q.status = status;
    const requests = await ServiceRequest.find(q).sort({ createdAt: -1 }).limit(200).lean();
    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to load requests", error: error.message });
  }
};

