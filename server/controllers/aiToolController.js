import AiTool from "../models/AiTool.js";

export const createAiTool = async (req, res) => {
  try {
    const { name, link, benefit, category, isActive = true } = req.body;
    if (!name || !link || !benefit || !category) {
      return res
        .status(400)
        .json({
          success: false,
          message: "name, link, benefit, category are required",
        });
    }
    const tool = await AiTool.create({
      name,
      link,
      benefit,
      category,
      isActive,
      createdBy: req.user?._id,
    });
    res.status(201).json({ success: true, data: tool });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to create AI tool",
        error: error.message,
      });
  }
};

export const getAiTools = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "", category, isActive } = req.query;

    const query = {};
    if (search) {
      query.$text = { $search: search };
    }
    if (category) query.category = category;
    // Only apply isActive filter when explicitly set to "true" or "false"
    if (isActive === "true") query.isActive = true;
    if (isActive === "false") query.isActive = false;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [items, total] = await Promise.all([
      AiTool.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      AiTool.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: items,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch AI tools",
        error: error.message,
      });
  }
};

export const getPublicAiTools = async (req, res) => {
  try {
    const items = await AiTool.find({ isActive: true }).sort({
      category: 1,
      name: 1,
    });
    res.status(200).json({ success: true, data: items });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch AI tools",
        error: error.message,
      });
  }
};

export const getAiToolById = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await AiTool.findById(id);
    if (!item)
      return res
        .status(404)
        .json({ success: false, message: "AI tool not found" });
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch AI tool",
        error: error.message,
      });
  }
};

export const updateAiTool = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body, updatedBy: req.user?._id };
    const item = await AiTool.findByIdAndUpdate(id, updates, { new: true });
    if (!item)
      return res
        .status(404)
        .json({ success: false, message: "AI tool not found" });
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to update AI tool",
        error: error.message,
      });
  }
};

export const deleteAiTool = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await AiTool.findByIdAndDelete(id);
    if (!item)
      return res
        .status(404)
        .json({ success: false, message: "AI tool not found" });
    res.status(200).json({ success: true, message: "AI tool deleted" });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to delete AI tool",
        error: error.message,
      });
  }
};
