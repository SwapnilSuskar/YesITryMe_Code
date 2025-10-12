import mongoose from "mongoose";

const fundsSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      ref: 'User',
      index: true
    },
    mobileFund: {
      type: Number,
      default: 0,
      min: 0
    },
    laptopFund: {
      type: Number,
      default: 0,
      min: 0
    },
    bikeFund: {
      type: Number,
      default: 0,
      min: 0
    },
    carFund: {
      type: Number,
      default: 0,
      min: 0
    },
    houseFund: {
      type: Number,
      default: 0,
      min: 0
    },
    travelFund: {
      type: Number,
      default: 0,
      min: 0
    },
    totalFunds: {
      type: Number,
      default: 0,
      min: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Pre-save middleware to calculate total funds
fundsSchema.pre('save', function(next) {
  this.totalFunds = this.mobileFund + this.laptopFund + this.bikeFund + 
                   this.carFund + this.houseFund + this.travelFund;
  this.lastUpdated = new Date();
  next();
});

// Static method to get or create funds for a user
fundsSchema.statics.getOrCreateFunds = async function(userId) {
  let funds = await this.findOne({ userId });
  if (!funds) {
    funds = new this({ userId });
    await funds.save();
  }
  return funds;
};

// Method to add funds to a specific category
fundsSchema.methods.addFunds = async function(fundType, amount) {
  // Ensure amount is a number
  const numericAmount = parseFloat(amount);
  
  if (isNaN(numericAmount) || numericAmount <= 0) {
    throw new Error('Amount must be a positive number');
  }
  
  const validFundTypes = ['mobileFund', 'laptopFund', 'bikeFund', 'carFund', 'houseFund', 'travelFund'];
  if (!validFundTypes.includes(fundType)) {
    throw new Error('Invalid fund type');
  }
  
  this[fundType] += numericAmount;
  await this.save();
  return this;
};

// Method to deduct funds from a specific category
fundsSchema.methods.deductFunds = async function(fundType, amount) {
  // Ensure amount is a number
  const numericAmount = parseFloat(amount);
  
  if (isNaN(numericAmount) || numericAmount <= 0) {
    throw new Error('Amount must be a positive number');
  }
  
  const validFundTypes = ['mobileFund', 'laptopFund', 'bikeFund', 'carFund', 'houseFund', 'travelFund'];
  if (!validFundTypes.includes(fundType)) {
    throw new Error('Invalid fund type');
  }
  
  if (this[fundType] < numericAmount) {
    throw new Error(`Insufficient funds in ${fundType}`);
  }
  
  this[fundType] -= numericAmount;
  await this.save();
  return this;
};

// Indexes for better query performance
fundsSchema.index({ userId: 1 });
fundsSchema.index({ totalFunds: -1 });
fundsSchema.index({ lastUpdated: -1 });
fundsSchema.index({ createdAt: -1 });
fundsSchema.index({ updatedAt: -1 });
fundsSchema.index({ userId: 1, lastUpdated: -1 }); // Compound index for user funds history

const Funds = mongoose.model("Funds", fundsSchema);

export default Funds; 