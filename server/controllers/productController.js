import Product from "../models/Product.js";
import Category from "../models/Category.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload image to Cloudinary
const uploadToCloudinary = async (file) => {
  try {
    let result;
    // Check if file is in memory (buffer) or on disk (tempFilePath)
    if (file.data) {
      // File is in memory (useTempFiles: false)
      result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "products",
            use_filename: true,
            unique_filename: true,
            overwrite: true,
            resource_type: "auto",
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );
        uploadStream.end(file.data);
      });
    } else if (file.tempFilePath) {
      // File is on disk (useTempFiles: true)
      result = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: "products",
        use_filename: true,
        unique_filename: true,
        overwrite: true,
        resource_type: "auto",
      });
      // Clean up the temporary file
      try {
        fs.unlinkSync(file.tempFilePath);
      } catch (cleanupError) {
        console.error("Error cleaning up temporary file:", cleanupError);
      }
    } else {
      throw new Error("File data or tempFilePath is missing");
    }
    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);

    // Clean up the temporary file even if upload fails (only if it exists)
    if (file.tempFilePath) {
      try {
        if (fs.existsSync(file.tempFilePath)) {
          fs.unlinkSync(file.tempFilePath);
        }
      } catch (cleanupError) {
        console.error(
          "Error cleaning up temporary file after error:",
          cleanupError
        );
      }
    }

    throw new Error(
      "Image upload failed: " + (error.message || "Unknown error")
    );
  }
};

// Create a new product
export const createProduct = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      pricing,
      tags,
      specifications,
      status = "draft",
      featured = false,
    } = req.body;

    // Validate required fields
    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: "Title, description, and category are required",
      });
    }

    // Handle category - can be ObjectId or name
    let categoryId = category;
    if (!category.match(/^[0-9a-fA-F]{24}$/)) {
      // It's a category name, find the category
      const categoryDoc = await Category.findOne({ name: category.trim(), status: 'active' });
      if (!categoryDoc) {
        return res.status(400).json({
          success: false,
          message: "Category not found. Please select a valid category.",
        });
      }
      categoryId = categoryDoc._id;
    }

    // Parse pricing if it's a string
    let parsedPricing = pricing;
    if (typeof pricing === "string") {
      try {
        parsedPricing = JSON.parse(pricing);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid pricing format",
        });
      }
    }

    // Filter out invalid pricing options (empty packageName or price)
    if (Array.isArray(parsedPricing)) {
      parsedPricing = parsedPricing.filter(
        (option) =>
          option &&
          option.packageName &&
          option.packageName.trim() !== "" &&
          option.price !== null &&
          option.price !== undefined &&
          option.price !== ""
      );
    }

    // Parse specifications if it's a string
    let parsedSpecifications = specifications;
    if (typeof specifications === "string") {
      try {
        parsedSpecifications = JSON.parse(specifications);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid specifications format",
        });
      }
    }

    // Parse tags if it's a string
    let parsedTags = tags;
    if (typeof tags === "string") {
      try {
        parsedTags = JSON.parse(tags);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid tags format",
        });
      }
    }

    // Handle image uploads
    const images = [];
    if (req.files && req.files.images) {
      const imageFiles = Array.isArray(req.files.images)
        ? req.files.images
        : [req.files.images];
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const uploadResult = await uploadToCloudinary(file);
        images.push({
          ...uploadResult,
          isPrimary: i === 0, // First image is primary
        });
      }
    } else {
    }

    const product = new Product({
      title,
      description,
      category: categoryId,
      pricing: parsedPricing || [],
      images,
      status,
      featured,
      tags: parsedTags || [],
      specifications: parsedSpecifications || {},
      createdBy: req.user.id,
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create product",
      error: error.message,
    });
  }
};

// Get all products (with filtering and pagination)
export const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      status,
      featured,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const query = {};

    // Apply filters
    if (category) {
      // Check if category is ObjectId or name
      if (category.match(/^[0-9a-fA-F]{24}$/)) {
        query.category = category;
      } else {
        // Find category by name
        const categoryDoc = await Category.findOne({ name: category, status: 'active' });
        if (categoryDoc) {
          query.category = categoryDoc._id;
        } else {
          // Return empty if category not found
          return res.status(200).json({
            success: true,
            data: [],
            pagination: {
              currentPage: parseInt(page),
              totalPages: 0,
              totalItems: 0,
              itemsPerPage: parseInt(limit),
            },
          });
        }
      }
    }
    if (status) query.status = status;
    if (featured !== undefined) query.featured = featured === "true";
    if (search) {
      query.$text = { $search: search };
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(query)
      .populate("category", "name")
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message,
    });
  }
};

// Get products for public display (only active products)
export const getPublicProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      featured,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const query = { status: "active" };

    // Apply filters
    if (category) {
      // Check if category is ObjectId or name
      if (category.match(/^[0-9a-fA-F]{24}$/)) {
        query.category = category;
      } else {
        // Find category by name
        const categoryDoc = await Category.findOne({ name: category, status: 'active' });
        if (categoryDoc) {
          query.category = categoryDoc._id;
        } else {
          // Return empty if category not found
          return res.status(200).json({
            success: true,
            data: [],
            pagination: {
              currentPage: parseInt(page),
              totalPages: 0,
              totalItems: 0,
              itemsPerPage: parseInt(limit),
            },
          });
        }
      }
    }
    if (featured !== undefined) query.featured = featured === "true";
    if (search) {
      query.$text = { $search: search };
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(query)
      .populate("category", "name")
      .populate("createdBy", "name")
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Get public products error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message,
    });
  }
};

// Get a single product by ID
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id)
      .populate("category", "name")
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Get product by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: error.message,
    });
  }
};

// Update a product
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updatedBy: req.user.id };

    // Parse complex fields if they're strings
    if (typeof updateData.pricing === "string") {
      try {
        updateData.pricing = JSON.parse(updateData.pricing);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid pricing format",
        });
      }
    }

    // Filter out invalid pricing options (empty packageName or price)
    if (Array.isArray(updateData.pricing)) {
      updateData.pricing = updateData.pricing.filter(
        (option) =>
          option &&
          option.packageName &&
          option.packageName.trim() !== "" &&
          option.price !== null &&
          option.price !== undefined &&
          option.price !== ""
      );
    }

    if (typeof updateData.specifications === "string") {
      try {
        updateData.specifications = JSON.parse(updateData.specifications);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid specifications format",
        });
      }
    }

    if (typeof updateData.tags === "string") {
      try {
        updateData.tags = JSON.parse(updateData.tags);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid tags format",
        });
      }
    }

    // Handle category update - can be ObjectId or name
    if (updateData.category) {
      if (!updateData.category.match(/^[0-9a-fA-F]{24}$/)) {
        // It's a category name, find the category
        const categoryDoc = await Category.findOne({ name: updateData.category.trim(), status: 'active' });
        if (!categoryDoc) {
          return res.status(400).json({
            success: false,
            message: "Category not found. Please select a valid category.",
          });
        }
        updateData.category = categoryDoc._id;
      }
    }

    // Handle new image uploads
    if (req.files && req.files.images) {
      const imageFiles = Array.isArray(req.files.images)
        ? req.files.images
        : [req.files.images];
      const newImages = [];
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const uploadResult = await uploadToCloudinary(file);
        newImages.push({
          ...uploadResult,
          isPrimary: i === 0,
        });
      }

      // Get existing product to merge images
      const existingProduct = await Product.findById(id);
      if (existingProduct) {
        updateData.images = [...existingProduct.images, ...newImages];
      }
    }

    const product = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: error.message,
    });
  }
};

// Delete a product
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Delete images from Cloudinary
    if (product.images && product.images.length > 0) {
      for (const image of product.images) {
        try {
          await cloudinary.uploader.destroy(image.publicId);
        } catch (error) {
          console.error("Error deleting image from Cloudinary:", error);
        }
      }
    }

    await Product.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: error.message,
    });
  }
};

// Delete a specific image from a product
export const deleteProductImage = async (req, res) => {
  try {
    const { productId, imageId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const image = product.images.id(imageId);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    // Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(image.publicId);
    } catch (error) {
      console.error("Error deleting image from Cloudinary:", error);
    }

    // Remove from product
    product.images.pull(imageId);
    await product.save();

    res.status(200).json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error) {
    console.error("Delete product image error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete image",
      error: error.message,
    });
  }
};

// Set primary image
export const setPrimaryImage = async (req, res) => {
  try {
    const { productId, imageId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Reset all images to not primary
    product.images.forEach((img) => {
      img.isPrimary = false;
    });

    // Set the specified image as primary
    const image = product.images.id(imageId);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    image.isPrimary = true;
    await product.save();

    res.status(200).json({
      success: true,
      message: "Primary image updated successfully",
      data: product,
    });
  } catch (error) {
    console.error("Set primary image error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update primary image",
      error: error.message,
    });
  }
};

// Get product categories
export const getProductCategories = async (req, res) => {
  try {
    const categories = await Category.find({ status: 'active' })
      .select('name')
      .sort({ displayOrder: 1, name: 1 });

    // Return category names for backward compatibility
    const categoryNames = categories.map(cat => cat.name);

    res.status(200).json({
      success: true,
      data: categoryNames,
    });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      error: error.message,
    });
  }
};

// Get product statistics
export const getProductStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ status: "active" });
    const draftProducts = await Product.countDocuments({ status: "draft" });
    const featuredProducts = await Product.countDocuments({ featured: true });

    const categoryStats = await Product.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        total: totalProducts,
        active: activeProducts,
        draft: draftProducts,
        featured: featuredProducts,
        categories: categoryStats,
      },
    });
  } catch (error) {
    console.error("Get product stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product statistics",
      error: error.message,
    });
  }
};
