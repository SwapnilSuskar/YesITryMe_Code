import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Educational Courses',
      'Electronic Products',
      'Financial Products',
      'Subscription-Based Digital Products',
      'Utility Services',
      'Shopping Products',
      'Daily Usable Products'
    ]
  },
  pricing: [{
    packageName: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    },
    features: [{
      type: String,
      trim: true
    }],
    isPopular: {
      type: Boolean,
      default: false
    }
  }],
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'draft'],
    default: 'draft'
  },
  featured: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  specifications: {
    type: Map,
    of: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for better search performance
productSchema.index({ title: 'text', description: 'text', category: 1, status: 1 });

// Virtual for primary image
productSchema.virtual('primaryImage').get(function() {
  const primaryImage = this.images.find(img => img.isPrimary);
  return primaryImage ? primaryImage.url : (this.images.length > 0 ? this.images[0].url : null);
});

// Ensure virtual fields are serialized
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

const Product = mongoose.model('Product', productSchema);

export default Product; 