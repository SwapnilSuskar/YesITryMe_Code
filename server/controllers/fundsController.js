import Funds from "../models/Funds.js";
import User from "../models/User.js";

// Get funds for a specific user
export const getUserFunds = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const funds = await Funds.getOrCreateFunds(userId);

    res.status(200).json({
      success: true,
      data: funds,
    });
  } catch (error) {
    console.error("Error getting user funds:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Admin: Add funds to a specific user
export const addFundsToUser = async (req, res) => {
  try {
    const { userId, fundType, amount, adminNotes } = req.body;

    // Validate admin role
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    // Validate input
    if (!userId || !fundType || !amount) {
      return res
        .status(400)
        .json({ message: "userId, fundType, and amount are required" });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: "Amount must be positive" });
    }

    const validFundTypes = [
      "mobileFund",
      "laptopFund",
      "bikeFund",
      "carFund",
      "houseFund",
      "travelFund",
    ];
    if (!validFundTypes.includes(fundType)) {
      return res.status(400).json({ message: "Invalid fund type" });
    }

    // Check if user exists
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get or create funds for user
    const funds = await Funds.getOrCreateFunds(userId);

    // Convert amount to number to ensure proper addition
    const numericAmount = parseFloat(amount);

    // Add funds
    await funds.addFunds(fundType, numericAmount);

    // Create a transaction in user's wallet to show fund credit
    const Wallet = (await import("../models/Wallet.js")).default;

    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      wallet = new Wallet({ userId });
    }

    wallet.transactions.push({
      type: "fund_credit",
      amount: numericAmount,
      description: `Fund credit added to ${fundType} by admin`,
      status: "completed",
      reference: `FUND_CREDIT_${fundType}_${Date.now()}`,
      fundType: fundType,
      adminNotes: adminNotes || "Fund added by admin",
      createdAt: new Date(),
    });

    await wallet.save();

    res.status(200).json({
      success: true,
      message: `Successfully added ₹${amount} to ${fundType} for user ${userId}`,
      data: funds,
    });
  } catch (error) {
    console.error("Error adding funds:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// User: Request withdrawal from their own funds
export const requestFundWithdrawal = async (req, res) => {
  try {
    const { fundType, amount, adminNotes } = req.body;
    const userId = req.user.userId; // Get from authenticated user

    // Validate input
    if (!fundType || !amount) {
      return res
        .status(400)
        .json({ message: "fundType and amount are required" });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: "Amount must be positive" });
    }

    if (amount < 200) {
      return res
        .status(400)
        .json({ message: "Minimum withdrawal amount is ₹200" });
    }

    const validFundTypes = [
      "mobileFund",
      "laptopFund",
      "bikeFund",
      "carFund",
      "houseFund",
      "travelFund",
    ];
    if (!validFundTypes.includes(fundType)) {
      return res.status(400).json({ message: "Invalid fund type" });
    }

    // Get user's funds
    const funds = await Funds.getOrCreateFunds(userId);

    // Convert amount to number to ensure proper comparison and subtraction
    const numericAmount = parseFloat(amount);

    // Check if user has sufficient funds
    if (funds[fundType] < numericAmount) {
      return res.status(400).json({
        message: `Insufficient funds. You have ₹${funds[fundType]} in ${fundType}, but trying to withdraw ₹${numericAmount}`,
      });
    }

    // Get user details for payout request
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Calculate charges
    const adminCharge = parseFloat(amount) * 0.10; // 10% admin charge
    const tds = parseFloat(amount) * 0.02; // 2% TDS
    const netAmount = parseFloat(amount) - adminCharge - tds; // 88% net amount

    // Create a payout request entry (DO NOT deduct funds yet - wait for admin approval)
    const Payout = (await import("../models/Payout.js")).default;
    const payoutRequest = new Payout({
      userId: userId,
      userName: `${user.firstName} ${user.lastName}`,
      amount: parseFloat(amount),
      netAmount: netAmount,
      adminCharge: adminCharge,
      tds: tds,
      paymentMethod: "bank_transfer",
      paymentDetails: {
        accountNumber: "",
        ifscCode: "",
        accountHolderName: "",
      },
      status: "pending",
      requestDate: new Date(),
      adminNotes: `Fund withdrawal request from ${fundType}: ${
        adminNotes || "User requested withdrawal"
      }`,
      withdrawalType: "fund", // Add withdrawal type to distinguish from regular payouts
      fundType: fundType, // Store which fund type this withdrawal is from
    });
    await payoutRequest.save();

    res.status(200).json({
      success: true,
      message: `Successfully requested withdrawal of ₹${amount} from ${fundType}. You will receive ₹${netAmount.toFixed(2)} after charges (10% admin + 2% TDS). Your funds will be deducted only after admin approval.`,
      data: funds,
    });
  } catch (error) {
    console.error("Error requesting fund withdrawal:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Admin: Deduct funds from a specific user
export const deductFundsFromUser = async (req, res) => {
  try {
    const { userId, fundType, amount, adminNotes } = req.body;

    // Validate admin role
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    // Validate input
    if (!userId || !fundType || !amount) {
      return res
        .status(400)
        .json({ message: "userId, fundType, and amount are required" });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: "Amount must be positive" });
    }

    const validFundTypes = [
      "mobileFund",
      "laptopFund",
      "bikeFund",
      "carFund",
      "houseFund",
      "travelFund",
    ];
    if (!validFundTypes.includes(fundType)) {
      return res.status(400).json({ message: "Invalid fund type" });
    }

    // Check if user exists
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get funds for user
    const funds = await Funds.findOne({ userId });
    if (!funds) {
      return res
        .status(404)
        .json({ message: "No funds record found for this user" });
    }

    // Convert amount to number to ensure proper subtraction
    const numericAmount = parseFloat(amount);

    // Deduct funds
    await funds.deductFunds(fundType, numericAmount);
    res.status(200).json({
      success: true,
      message: `Successfully deducted ₹${amount} from ${fundType} for user ${userId}`,
      data: funds,
    });
  } catch (error) {
    console.error("Error deducting funds:", error);
    if (error.message.includes("Insufficient funds")) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// Admin: Get all users with their funds
export const getAllUsersWithFunds = async (req, res) => {
  try {
    // Validate admin role
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50; // Default 50 users per page
    const skip = (page - 1) * limit;

    // Get users with pagination
    const [users, totalUsers] = await Promise.all([
      User.find({ role: "user" })
        .select("userId firstName lastName mobile email")
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments({ role: "user" }),
    ]);

    // Get funds for these specific users
    const userIds = users.map((user) => user.userId);
    const allFunds = await Funds.find({ userId: { $in: userIds } }).lean();

    // Create a map of funds by userId for quick lookup
    const fundsMap = new Map();
    allFunds.forEach((fund) => {
      fundsMap.set(fund.userId, fund);
    });

    // Combine users with their funds
    const usersWithFunds = users.map((user) => {
      const funds = fundsMap.get(user.userId) || {
        userId: user.userId,
        mobileFund: 0,
        laptopFund: 0,
        bikeFund: 0,
        carFund: 0,
        houseFund: 0,
        travelFund: 0,
        totalFunds: 0,
        lastUpdated: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return {
        ...user,
        funds: funds,
      };
    });

    res.status(200).json({
      success: true,
      data: usersWithFunds,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        limit,
        hasNextPage: page < Math.ceil(totalUsers / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error getting all users with funds:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Admin: Get funds summary for all users
export const getFundsSummary = async (req, res) => {
  try {
    // Validate admin role
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    // Use MongoDB aggregation for better performance and memory efficiency
    const [fundsAggregation, totalUsers] = await Promise.all([
      Funds.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            totalMobileFund: { $sum: "$mobileFund" },
            totalLaptopFund: { $sum: "$laptopFund" },
            totalBikeFund: { $sum: "$bikeFund" },
            totalCarFund: { $sum: "$carFund" },
            totalHouseFund: { $sum: "$houseFund" },
            totalTravelFund: { $sum: "$travelFund" },
            totalGrandTotal: { $sum: "$totalFunds" },
          },
        },
      ]),
      User.countDocuments({ role: "user" }),
    ]);

    const aggregationResult = fundsAggregation[0] || {
      totalUsers: 0,
      totalMobileFund: 0,
      totalLaptopFund: 0,
      totalBikeFund: 0,
      totalCarFund: 0,
      totalHouseFund: 0,
      totalTravelFund: 0,
      totalGrandTotal: 0,
    };

    const summary = {
      totalUsers: totalUsers,
      totalFunds: {
        mobileFund: aggregationResult.totalMobileFund || 0,
        laptopFund: aggregationResult.totalLaptopFund || 0,
        bikeFund: aggregationResult.totalBikeFund || 0,
        carFund: aggregationResult.totalCarFund || 0,
        houseFund: aggregationResult.totalHouseFund || 0,
        travelFund: aggregationResult.totalTravelFund || 0,
        grandTotal: aggregationResult.totalGrandTotal || 0,
      },
      averageFunds: {
        mobileFund:
          totalUsers > 0
            ? Math.round((aggregationResult.totalMobileFund || 0) / totalUsers)
            : 0,
        laptopFund:
          totalUsers > 0
            ? Math.round((aggregationResult.totalLaptopFund || 0) / totalUsers)
            : 0,
        bikeFund:
          totalUsers > 0
            ? Math.round((aggregationResult.totalBikeFund || 0) / totalUsers)
            : 0,
        carFund:
          totalUsers > 0
            ? Math.round((aggregationResult.totalCarFund || 0) / totalUsers)
            : 0,
        houseFund:
          totalUsers > 0
            ? Math.round((aggregationResult.totalHouseFund || 0) / totalUsers)
            : 0,
        travelFund:
          totalUsers > 0
            ? Math.round((aggregationResult.totalTravelFund || 0) / totalUsers)
            : 0,
        grandTotal:
          totalUsers > 0
            ? Math.round((aggregationResult.totalGrandTotal || 0) / totalUsers)
            : 0,
      },
    };

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("Error getting funds summary:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
