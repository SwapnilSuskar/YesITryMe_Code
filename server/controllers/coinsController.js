import CoinWallet from "../models/Coin.js";
import User from "../models/User.js";
import WithdrawalRequest from "../models/WithdrawalRequest.js";

export const getCoinBalance = async (req, res) => {
  try {
    const { userId } = req.user;
    const wallet = await CoinWallet.getOrCreateWallet(userId);
    res.json({
      success: true,
      data: {
        balance: wallet.balance,
        totalEarned: wallet.totalEarned,
        totalWithdrawn: wallet.totalWithdrawn,
        activeIncome: wallet.activeIncome || 0,
        activationBonusGranted: wallet.activationBonusGranted,
        transactions: wallet.transactions.slice(-20),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get coin balance",
      error: error.message,
    });
  }
};

export const grantActivationBonus = async (req, res) => {
  try {
    const { userId } = req.user;
    const wallet = await CoinWallet.getOrCreateWallet(userId);
    if (wallet.activationBonusGranted) {
      return res
        .status(400)
        .json({ success: false, message: "Activation bonus already granted" });
    }
    await wallet.addCoins(
      "activation_bonus",
      1000,
      { bonusType: "account_activation" },
      `ACTIVATION_BONUS_${userId}`
    );
    wallet.activationBonusGranted = true;
    await wallet.save();
    res.json({
      success: true,
      message: "Activation bonus of 1000 coins granted!",
      newBalance: wallet.balance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to grant activation bonus",
      error: error.message,
    });
  }
};

export const requestCoinWithdrawal = async (req, res) => {
  try {
    const { userId } = req.user;
    const { amount } = req.body;
    
    // Input validation
    if (!amount || isNaN(amount)) {
      return res.status(400).json({ 
        success: false, 
        message: "Valid withdrawal amount is required",
      });
    }
    
    const withdrawalAmount = parseInt(amount, 10);
    
    // Safety validations
    if (withdrawalAmount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Withdrawal amount must be positive",
      });
    }
    
    // Minimum withdrawal: ₹200 = 20000 coins
    const minimumCoins = 200 * 100;
    if (withdrawalAmount < minimumCoins) {
      return res.status(400).json({ 
        success: false, 
        message: `Minimum withdrawal amount is ₹200 (${minimumCoins} coins)`,
      });
    }
    
    // Maximum withdrawal: ₹1000 = 100000 coins per day
    const maximumCoins = 1000 * 100;
    if (withdrawalAmount > maximumCoins) {
      return res.status(400).json({ 
        success: false, 
        message: `Maximum withdrawal amount is ₹1000 (${maximumCoins} coins) per day`,
      });
    }
    
    // Get user and wallet
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found",
      });
    }
    
    // Check if user account is active
    if (user.status !== "active") {
      return res.status(403).json({ 
        success: false, 
        message: "Account must be active to request withdrawals",
      });
    }
    
    const wallet = await CoinWallet.getOrCreateWallet(userId);
    
    // Check sufficient balance
    if (wallet.balance < withdrawalAmount) {
      return res.status(400).json({ 
        success: false, 
        message: "Insufficient coin balance",
      });
    }

    // Check for existing pending withdrawal requests
    const existingPendingRequest = await WithdrawalRequest.findOne({
      userId,
      status: "pending",
    });

    if (existingPendingRequest) {
      return res.status(400).json({ 
        success: false, 
        message:
          "You already have a pending withdrawal request. Please wait for it to be processed.",
      });
    }
    
    // Check if user has completed minimum tasks (safety measure)
    const completedTasks = wallet.transactions.filter(
      (t) =>
        ["view", "like", "comment", "subscribe"].includes(t.type) &&
        t.status === "completed"
    );

    // if (completedTasks.length < 5) {
    //   return res.status(403).json({
    //     success: false,
    //     message: "Complete at least 5 tasks before requesting withdrawal"
    //   });
    // }

    // Create withdrawal request (DO NOT deduct coins yet)
    const withdrawalRequest = new WithdrawalRequest({
      userId,
      amount: withdrawalAmount / 100, // Store in rupees
      coins: withdrawalAmount,
      status: "pending",
      requestType: "wallet",
      metadata: {
      userEmail: user.email,
      userMobile: user.mobile,
      userFirstName: user.firstName,
      userLastName: user.lastName,
      ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get("User-Agent"),
        requestedAt: new Date(),
      },
    });

    await withdrawalRequest.save();

    // Add withdrawal request to wallet transactions (for tracking)
    const withdrawalId = `WITHDRAWAL_REQUEST_${withdrawalRequest._id}`;
    await wallet.addTransaction(
      "withdrawal",
      -withdrawalAmount, // Negative amount to show as pending withdrawal
      {
        requestId: withdrawalRequest._id,
        status: "pending",
        amountInRupees: (withdrawalAmount / 100).toFixed(2),
      },
      withdrawalId,
      "pending"
    );
    res.json({ 
      success: true, 
      message: `Withdrawal request for ₹${(withdrawalAmount / 100).toFixed(
        2
      )} (${withdrawalAmount} coins) submitted successfully. It will be processed within 24-48 hours.`,
      newBalance: wallet.balance,
      requestId: withdrawalRequest._id,
      estimatedProcessingTime: "24-48 hours",
    });
  } catch (error) {
    console.error("Withdrawal request error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to process withdrawal request", 
      error: error.message,
    });
  }
};

export const getCoinTransactions = async (req, res) => {
  try {
    const { userId } = req.user;
    const { limit = 50, page = 1, type, status } = req.query;
    const wallet = await CoinWallet.getOrCreateWallet(userId);

    // Filter transactions by type and status if provided
    let filteredTransactions = wallet.transactions;

    if (type) {
      filteredTransactions = filteredTransactions.filter(
        (t) => t.type === type
      );
    }

    // Normalize withdrawal statuses from metadata when available
    filteredTransactions = filteredTransactions.map((t) => {
      if (t.type === 'withdrawal' && t.metadata && typeof t.metadata.status === 'string') {
        return { ...t.toObject?.() || t, status: t.metadata.status };
      }
      return t;
    });

    if (status) {
      filteredTransactions = filteredTransactions.filter(
        (t) => t.status === status
      );
    }

    // Sort by date (newest first)
    filteredTransactions = filteredTransactions.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    const skip = (page - 1) * limit;
    const transactions = filteredTransactions.slice(
      skip,
      skip + parseInt(limit)
    );

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(filteredTransactions.length / limit),
          totalTransactions: filteredTransactions.length,
          hasNextPage: skip + parseInt(limit) < filteredTransactions.length,
        },
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to get coin transactions",
        error: error.message,
      });
  }
};

export const getAllUsersCoins = async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res
        .status(403)
        .json({ success: false, message: "Admin access required" });
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;
    const [wallets, totalUsers] = await Promise.all([
      CoinWallet.find().sort({ balance: -1 }).skip(skip).limit(parseInt(limit)),
      CoinWallet.countDocuments(),
    ]);
    const userIds = wallets.map((w) => w.userId);
    const users = await User.find({ userId: { $in: userIds } });
    const userMap = new Map(users.map((u) => [u.userId, u]));
    const usersWithCoins = wallets.map((wallet) => ({
      userId: wallet.userId,
      firstName: userMap.get(wallet.userId)?.firstName || "Unknown",
      lastName: userMap.get(wallet.userId)?.lastName || "User",
      email: userMap.get(wallet.userId)?.email || "",
      mobile: userMap.get(wallet.userId)?.mobile || "",
      balance: wallet.balance,
      totalEarned: wallet.totalEarned,
      totalWithdrawn: wallet.totalWithdrawn,
      activationBonusGranted: wallet.activationBonusGranted,
    }));
    res.json({
      success: true,
      data: usersWithCoins,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get users coin data",
      error: error.message,
    });
  }
};

export const adjustUserCoins = async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res
        .status(403)
        .json({ success: false, message: "Admin access required" });
    const { targetUserId, amount, reason } = req.body;
    if (!targetUserId || !amount || !reason)
      return res.status(400).json({
        success: false,
        message: "Target user ID, amount, and reason are required",
      });
    const wallet = await CoinWallet.getOrCreateWallet(targetUserId);
    const numericAmount = parseInt(amount, 10);
    if (numericAmount > 0) {
      await wallet.addCoins(
        "admin_adjust",
        numericAmount,
        { reason, adjustedBy: req.user.userId, adjustmentType: "credit" },
        `ADMIN_ADJUST_${Date.now()}`
      );
    } else if (numericAmount < 0) {
      await wallet.deductCoins(
        "admin_adjust",
        Math.abs(numericAmount),
        { reason, adjustedBy: req.user.userId, adjustmentType: "debit" },
        `ADMIN_ADJUST_${Date.now()}`
      );
    }
    res.json({
      success: true,
      message: `Adjusted ${numericAmount} coins for user ${targetUserId}`,
      newBalance: wallet.balance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to adjust user coins",
      error: error.message,
    });
  }
};

// Get all pending withdrawal requests for admin review
export const getPendingWithdrawals = async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res
        .status(403)
        .json({ success: false, message: "Admin access required" });
    
    const { page = 1, limit = 50, status = "pending" } = req.query;
    const skip = (page - 1) * limit;
    
    // Find all wallets with pending withdrawals
    const wallets = await CoinWallet.find({});
    const pendingWithdrawals = [];
    
    for (const wallet of wallets) {
      const withdrawals = wallet.transactions.filter(
        (t) =>
          t.type === "withdrawal" &&
        t.status === status &&
        t.metadata && 
        t.metadata.status === status
      );
      
      for (const withdrawal of withdrawals) {
        const user = await User.findOne({ userId: wallet.userId });
        pendingWithdrawals.push({
          withdrawalId: withdrawal.reference,
          userId: wallet.userId,
          userEmail: user?.email || "N/A",
          userMobile: user?.mobile || "N/A",
          userName:
            `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
            "Unknown User",
          amount: Math.abs(withdrawal.amount),
          amountInRupees:
            withdrawal.metadata?.amountInRupees ||
            (Math.abs(withdrawal.amount) / 100).toFixed(2),
          requestedAt: withdrawal.createdAt,
          status: withdrawal.metadata?.status || "pending",
          ipAddress: withdrawal.metadata?.ipAddress,
          userAgent: withdrawal.metadata?.userAgent,
          dailyTotal: withdrawal.metadata?.dailyTotal,
        });
      }
    }
    
    // Sort by request date (newest first)
    pendingWithdrawals.sort(
      (a, b) => new Date(b.requestedAt) - new Date(a.requestedAt)
    );
    
    const paginatedWithdrawals = pendingWithdrawals.slice(
      skip,
      skip + parseInt(limit)
    );
    
    res.json({
      success: true,
      data: paginatedWithdrawals,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(pendingWithdrawals.length / limit),
        totalWithdrawals: pendingWithdrawals.length,
        hasNextPage: skip + parseInt(limit) < pendingWithdrawals.length,
      },
    });
  } catch (error) {
    console.error("Error fetching pending withdrawals:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending withdrawals",
      error: error.message,
    });
  }
};

// Approve or reject withdrawal request
export const processWithdrawal = async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res
        .status(403)
        .json({ success: false, message: "Admin access required" });
    
    const { withdrawalId, action, adminNotes } = req.body; // action: 'approve' or 'reject'
    
    if (!withdrawalId || !action) {
      return res.status(400).json({
        success: false,
        message: "Withdrawal ID and action are required",
      });
    }

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be 'approve' or 'reject'",
      });
    }
    
    // Find the wallet with this withdrawal
    const wallets = await CoinWallet.find({});
    let targetWallet = null;
    let targetWithdrawal = null;
    
    for (const wallet of wallets) {
      const withdrawal = wallet.transactions.find(
        (t) => t.reference === withdrawalId
      );
      if (withdrawal) {
        targetWallet = wallet;
        targetWithdrawal = withdrawal;
        break;
      }
    }
    
    if (!targetWallet || !targetWithdrawal) {
      return res
        .status(404)
        .json({ success: false, message: "Withdrawal request not found" });
    }

    if (targetWithdrawal.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Withdrawal request has already been processed",
      });
    }
    
    const user = await User.findOne({ userId: targetWallet.userId });
    
    if (action === "approve") {
      // Update withdrawal status to completed
      targetWithdrawal.status = "completed";
      targetWithdrawal.metadata = {
        ...targetWithdrawal.metadata,
        status: "completed",
        approvedAt: new Date(),
        approvedBy: req.user.userId,
        adminNotes: adminNotes || "Withdrawal approved",
      };
      
      await targetWallet.save();
      res.json({
        success: true,
        message: `Withdrawal of ₹${targetWithdrawal.metadata?.amountInRupees} approved successfully`,
        withdrawalId,
        status: "approved",
      });
    } else if (action === "reject") {
      // Refund the coins back to user's balance
      const refundAmount = Math.abs(targetWithdrawal.amount);
      targetWallet.balance += refundAmount;
      targetWallet.totalWithdrawn -= refundAmount;
      
      // Update withdrawal status to rejected
      targetWithdrawal.status = "failed";
      targetWithdrawal.metadata = {
        ...targetWithdrawal.metadata,
        status: "rejected",
        rejectedAt: new Date(),
        rejectedBy: req.user.userId,
        adminNotes: adminNotes || "Withdrawal rejected",
      };
      
      // Add refund transaction
      targetWallet.transactions.push({
        type: "admin_adjust",
        amount: refundAmount,
        reference: `REFUND_${withdrawalId}`,
        metadata: {
          reason: "Withdrawal rejection refund",
          originalWithdrawalId: withdrawalId,
          refundedBy: req.user.userId,
        },
        status: "completed",
        createdAt: new Date(),
      });
      
      await targetWallet.save();
      res.json({
        success: true,
        message: `Withdrawal of ₹${targetWithdrawal.metadata?.amountInRupees} rejected and coins refunded`,
        withdrawalId,
        status: "rejected",
        refundedAmount: refundAmount,
      });
    }
  } catch (error) {
    console.error("Error processing withdrawal:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process withdrawal",
      error: error.message,
    });
  }
};

// Admin endpoints for withdrawal requests
export const getWithdrawalRequests = async (req, res) => {
  try {
    const { status = "pending", page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (status !== "all") {
      filter.status = status;
    }

    const requests = await WithdrawalRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Manually populate user data since userId is a string, not ObjectId
    const userIds = requests.map((req) => req.userId);
    const users = await User.find({ userId: { $in: userIds } });
    const userMap = new Map(users.map((user) => [user.userId, user]));

    // Attach user data to requests
    const requestsWithUsers = requests.map((request) => ({
      ...request.toObject(),
      userId: userMap.get(request.userId) || { userId: request.userId },
    }));

    const total = await WithdrawalRequest.countDocuments(filter);

    res.json({
      success: true,
      data: {
        requests: requestsWithUsers,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: requestsWithUsers.length,
          totalCount: total,
        },
      },
    });
  } catch (error) {
    console.error("Get withdrawal requests error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get withdrawal requests",
      error: error.message,
    });
  }
};

export const approveWithdrawalRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { adminNotes } = req.body;
    const { userId: adminId } = req.user;

    const withdrawalRequest = await WithdrawalRequest.findById(requestId);
    if (!withdrawalRequest) {
      return res.status(404).json({
        success: false,
        message: "Withdrawal request not found",
      });
    }

    if (withdrawalRequest.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Withdrawal request is not pending",
      });
    }

    // Update withdrawal request status
    withdrawalRequest.status = "approved";
    withdrawalRequest.approvedBy = adminId;
    withdrawalRequest.approvedAt = new Date();
    withdrawalRequest.adminNotes = adminNotes || "";
    await withdrawalRequest.save();

    // Update user's wallet: deduct coins and mark original transaction approved (do not create a new transaction)
    const wallet = await CoinWallet.getOrCreateWallet(withdrawalRequest.userId);
    const originalTransaction = wallet.transactions.find(
      (t) => t.reference === `WITHDRAWAL_REQUEST_${withdrawalRequest._id}`
    );

    if (!originalTransaction) {
      return res.status(404).json({ success: false, message: "Original withdrawal transaction not found in wallet" });
    }

    const amountToDeduct = Math.abs(originalTransaction.amount);
    if (wallet.balance < amountToDeduct) {
      return res.status(400).json({ success: false, message: "Insufficient wallet balance to approve withdrawal" });
    }

    // Deduct from balance and move totals
    wallet.balance -= amountToDeduct;
    wallet.totalWithdrawn += amountToDeduct;

    // Mark original transaction approved (persist as completed to satisfy enum)
    originalTransaction.status = "completed";
    originalTransaction.metadata = {
      ...originalTransaction.metadata,
      status: "approved",
      approvedBy: adminId,
      approvedAt: new Date(),
      amountInRupees: withdrawalRequest.amount,
    };

    await wallet.save();
    res.json({
      success: true,
      message: `Withdrawal request approved successfully. ₹${withdrawalRequest.amount} (${withdrawalRequest.coins} coins) deducted from user's wallet.`,
      data: withdrawalRequest,
    });
  } catch (error) {
    console.error("Approve withdrawal request error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve withdrawal request",
      error: error.message,
    });
  }
};

export const rejectWithdrawalRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { rejectionReason } = req.body;
    const { userId: adminId } = req.user;

    const withdrawalRequest = await WithdrawalRequest.findById(requestId);
    if (!withdrawalRequest) {
      return res.status(404).json({
        success: false,
        message: "Withdrawal request not found",
      });
    }

    if (withdrawalRequest.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Withdrawal request is not pending",
      });
    }

    // Update withdrawal request status
    withdrawalRequest.status = "rejected";
    withdrawalRequest.approvedBy = adminId;
    withdrawalRequest.approvedAt = new Date();
    withdrawalRequest.rejectionReason = rejectionReason || "No reason provided";
    await withdrawalRequest.save();

    // Remove the pending withdrawal transaction (refund the coins)
    const wallet = await CoinWallet.getOrCreateWallet(withdrawalRequest.userId);
    const originalTransaction = wallet.transactions.find(
      (t) => t.reference === `WITHDRAWAL_REQUEST_${withdrawalRequest._id}`
    );

    if (originalTransaction) {
      // Remove the negative transaction (which effectively refunds the coins)
      wallet.transactions = wallet.transactions.filter(
        (t) => t.reference !== `WITHDRAWAL_REQUEST_${withdrawalRequest._id}`
      );
      await wallet.save();
    }
    res.json({
      success: true,
      message: `Withdrawal request rejected successfully. Coins have been refunded to user's wallet.`,
      data: withdrawalRequest,
    });
  } catch (error) {
    console.error("Reject withdrawal request error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject withdrawal request",
      error: error.message,
    });
  }
};

export const completeWithdrawalRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { paymentDetails } = req.body;
    const { userId: adminId } = req.user;

    const withdrawalRequest = await WithdrawalRequest.findById(requestId);
    if (!withdrawalRequest) {
      return res.status(404).json({
        success: false,
        message: "Withdrawal request not found",
      });
    }

    if (withdrawalRequest.status !== "approved") {
      return res.status(400).json({
        success: false,
        message: "Withdrawal request must be approved first",
      });
    }

    // Update withdrawal request status
    withdrawalRequest.status = "completed";
    withdrawalRequest.completedAt = new Date();
    withdrawalRequest.paymentDetails = paymentDetails || {};
    await withdrawalRequest.save();

    // Also mark wallet original transaction as completed
    const wallet = await CoinWallet.getOrCreateWallet(withdrawalRequest.userId);
    const originalTransaction = wallet.transactions.find(
      (t) => t.reference === `WITHDRAWAL_REQUEST_${withdrawalRequest._id}`
    );

    if (originalTransaction) {
      originalTransaction.status = "completed";
      originalTransaction.metadata = {
        ...originalTransaction.metadata,
        status: "completed",
        completedAt: new Date(),
        paymentDetails: paymentDetails || {},
      };
      await wallet.save();
    }
    res.json({
      success: true,
      message: `Withdrawal request marked as completed successfully.`,
      data: withdrawalRequest,
    });
  } catch (error) {
    console.error("Complete withdrawal request error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to complete withdrawal request",
      error: error.message,
    });
  }
};
