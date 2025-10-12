import SpecialIncome from "../models/SpecialIncome.js";
import User from "../models/User.js";

// Get special income for a user
export const getSpecialIncome = async (req, res) => {
  try {
    const { userId } = req.params;
    const income = await SpecialIncome.findOne({ userId });
    res.json({ success: true, data: income });
  } catch (error) {
    console.error("Error getting special income:", error);
    res.status(500).json({
      success: false,
      message: "Error getting special income",
      error: error.message,
    });
  }
};

// Admin: Get all users with special income
export const getAllUsersWithSpecialIncome = async (req, res) => {
  try {
    const specialIncomes = await SpecialIncome.find({});

    // Get user details for each special income record
    const usersWithSpecialIncome = await Promise.all(
      specialIncomes.map(async (income) => {
        const user = await User.findOne({ userId: income.userId });
        return {
          ...income.toObject(),
          user: user
            ? {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                mobile: user.mobile,
                userId: user.userId,
              }
            : null,
        };
      })
    );

    res.json({
      success: true,
      data: usersWithSpecialIncome,
    });
  } catch (error) {
    console.error("Error getting all users with special income:", error);
    res.status(500).json({
      success: false,
      message: "Error getting all users with special income",
      error: error.message,
    });
  }
};

// User: Request withdrawal from their special income
export const requestSpecialIncomeWithdrawal = async (req, res) => {
  try {
    const { incomeType, amount, adminNotes } = req.body;
    const userId = req.user.userId; // Get from authenticated user
    
    // Validate input
    if (!incomeType || !amount) {
      return res.status(400).json({ message: 'incomeType and amount are required' });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be positive' });
    }

    if (amount < 200) {
      return res.status(400).json({ message: 'Minimum withdrawal amount is ₹200' });
    }

    const validIncomeTypes = ['leaderShipFund', 'royaltyIncome', 'rewardIncome'];
    if (!validIncomeTypes.includes(incomeType)) {
      return res.status(400).json({ message: 'Invalid income type' });
    }

    // Get user's special income
    let income = await SpecialIncome.findOne({ userId });
    if (!income) {
      return res.status(400).json({ message: 'No special income found for this user' });
    }
    
    // Convert amount to number to ensure proper comparison and subtraction
    const numericAmount = parseFloat(amount);
    
    // Check if user has sufficient funds
    if (income[incomeType] < numericAmount) {
      return res.status(400).json({ 
        message: `Insufficient funds. You have ₹${income[incomeType]} in ${incomeType}, but trying to withdraw ₹${numericAmount}` 
      });
    }

    // Get user details for payout request
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate charges
    const adminCharge = parseFloat(amount) * 0.10; // 10% admin charge
    const tds = parseFloat(amount) * 0.02; // 2% TDS
    const netAmount = parseFloat(amount) - adminCharge - tds; // 88% net amount

    // Create a payout request entry (DO NOT deduct special income yet - wait for admin approval)
    const Payout = (await import('../models/Payout.js')).default;
    const payoutRequest = new Payout({
      userId: userId,
      userName: `${user.firstName} ${user.lastName}`,
      amount: parseFloat(amount),
      netAmount: netAmount,
      adminCharge: adminCharge,
      tds: tds,
      paymentMethod: 'bank_transfer',
      paymentDetails: {
        accountNumber: '',
        ifscCode: '',
        accountHolderName: ''
      },
      status: 'pending',
      requestDate: new Date(),
      adminNotes: `Special income withdrawal request from ${incomeType}: ${adminNotes || 'User requested withdrawal'}`,
      withdrawalType: 'special_income', // Add withdrawal type to distinguish from regular payouts
      incomeType: incomeType, // Store which income type this withdrawal is from
    });
    await payoutRequest.save();

    res.status(200).json({
      success: true,
      message: `Successfully requested withdrawal of ₹${amount} from ${incomeType}. You will receive ₹${netAmount.toFixed(2)} after charges (10% admin + 2% TDS). Your special income will be deducted only after admin approval.`,
      data: income
    });
  } catch (error) {
    console.error('Error requesting special income withdrawal:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Admin: Set special income for a user
export const setSpecialIncome = async (req, res) => {
  try {
    const {
      userId,
      action,
      leaderShipFund,
      royaltyIncome,
      rewardIncome,
      adminNotes,
    } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (!action || !["add", "deduct"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be either 'add' or 'deduct'",
      });
    }

    // Get current special income record
    let income = await SpecialIncome.findOne({ userId });

    if (!income) {
      // Create new record if it doesn't exist
      income = new SpecialIncome({ userId });
    }

    // Calculate new values based on action
    const updateData = {};
    const errors = [];

    if (leaderShipFund && leaderShipFund > 0) {
      const currentValue = income.leaderShipFund || 0;
      const deductAmount = parseFloat(leaderShipFund);

      if (action === "deduct" && deductAmount > currentValue) {
        errors.push(
          `Cannot deduct ₹${deductAmount} from Leadership Fund. Available: ₹${currentValue}`
        );
      } else {
        updateData.leaderShipFund =
          action === "add"
            ? currentValue + deductAmount
            : currentValue - deductAmount;
      }
    }

    if (royaltyIncome && royaltyIncome > 0) {
      const currentValue = income.royaltyIncome || 0;
      const deductAmount = parseFloat(royaltyIncome);

      if (action === "deduct" && deductAmount > currentValue) {
        errors.push(
          `Cannot deduct ₹${deductAmount} from Royalty Income. Available: ₹${currentValue}`
        );
      } else {
        updateData.royaltyIncome =
          action === "add"
            ? currentValue + deductAmount
            : currentValue - deductAmount;
      }
    }

    if (rewardIncome && rewardIncome > 0) {
      const currentValue = income.rewardIncome || 0;
      const deductAmount = parseFloat(rewardIncome);

      if (action === "deduct" && deductAmount > currentValue) {
        errors.push(
          `Cannot deduct ₹${deductAmount} from Reward Income. Available: ₹${currentValue}`
        );
      } else {
        updateData.rewardIncome =
          action === "add"
            ? currentValue + deductAmount
            : currentValue - deductAmount;
      }
    }

    // Check if there are any validation errors
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Deduction validation failed",
        errors: errors,
      });
    }

    // Update the record
    const updatedIncome = await SpecialIncome.findOneAndUpdate(
      { userId },
      updateData,
      { upsert: true, new: true }
    );

    // Create transactions in user's wallet for special income credits (only for add action)
    if (action === "add") {
      const Wallet = (await import("../models/Wallet.js")).default;
      let wallet = await Wallet.findOne({ userId });
      if (!wallet) {
        wallet = new Wallet({ userId });
      }

      // Create transactions for each type of special income that was added
      if (leaderShipFund && leaderShipFund > 0) {
        wallet.transactions.push({
          type: "special_income_credit",
          amount: parseFloat(leaderShipFund),
          description: `Leadership Fund credit added by admin`,
          status: "completed",
          reference: `SPECIAL_INCOME_LEADERSHIP_${Date.now()}`,
          incomeType: "leaderShipFund",
          adminNotes: adminNotes || "Leadership Fund added by admin",
          createdAt: new Date(),
        });
      }

      if (royaltyIncome && royaltyIncome > 0) {
        wallet.transactions.push({
          type: "special_income_credit",
          amount: parseFloat(royaltyIncome),
          description: `Royalty Income credit added by admin`,
          status: "completed",
          reference: `SPECIAL_INCOME_ROYALTY_${Date.now()}`,
          incomeType: "royaltyIncome",
          adminNotes: adminNotes || "Royalty Income added by admin",
          createdAt: new Date(),
        });
      }

      if (rewardIncome && rewardIncome > 0) {
        wallet.transactions.push({
          type: "special_income_credit",
          amount: parseFloat(rewardIncome),
          description: `Reward Income credit added by admin`,
          status: "completed",
          reference: `SPECIAL_INCOME_REWARD_${Date.now()}`,
          incomeType: "rewardIncome",
          adminNotes: adminNotes || "Reward Income added by admin",
          createdAt: new Date(),
        });
      }

      await wallet.save();
    }

    const actionText = action === "add" ? "added to" : "deducted from";
    res.json({
      success: true,
      message: `Special income ${actionText} successfully`,
      data: updatedIncome,
    });
  } catch (error) {
    console.error("Error setting special income:", error);
    res.status(500).json({
      success: false,
      message: "Error setting special income",
      error: error.message,
    });
  }
};
