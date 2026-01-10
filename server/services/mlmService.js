import User from "../models/User.js";
import Purchase from "../models/Purchase.js";
import SuperPackagePurchase from "../models/SuperPackagePurchase.js";

// Check if user qualifies as Active Member (has package above ₹500)
export const checkActiveMemberStatus = async (userId) => {
  try {
    // Regular package purchases (completed)
    const purchases = await Purchase.find({
      purchaserId: userId,
      paymentStatus: "completed",
    });

    // Super package purchases (completed)
    const superPurchases = await SuperPackagePurchase.find({
      purchaserId: userId,
      paymentStatus: "completed",
    });

    // Active if either: any regular package > ₹500 OR any completed Super Package
    const hasActiveRegular = purchases.some(
      (purchase) => purchase.packagePrice > 500
    );
    const hasActiveSuper = superPurchases.length > 0;
    return hasActiveRegular || hasActiveSuper;
  } catch (error) {
    console.error("Error checking active member status:", error);
    return false;
  }
};

// Get direct active members count
// Uses the same unified logic as successful downline count: checks for active purchases (both regular and super packages) with deduplication
export const getDirectActiveMembers = async (userId) => {
  try {
    // Get direct referrals
    const directReferrals = await User.find({ sponsorId: userId }, "userId");
    const directReferralIds = directReferrals.map((user) => user.userId);

    if (directReferralIds.length === 0) {
      return 0;
    }

    // Get all regular package purchases by direct referrals (active status)
    // This matches the logic used in getUniqueSuccessfulDownlineBuyers
    const regularPackagePurchases = await Purchase.find({
      purchaserId: { $in: directReferralIds },
      status: "active",
    });

    // Get all super package purchases by direct referrals (active status)
    const superPackagePurchases = await SuperPackagePurchase.find({
      purchaserId: { $in: directReferralIds },
      status: "active",
    });

    // Combine and deduplicate: get unique userIds who have either regular OR super package
    // This ensures we count each user only once, matching the Dashboard and SuccessfulDownline display
    const uniqueBuyers = new Set();
    
    // Add regular package buyers
    regularPackagePurchases.forEach((purchase) => {
      uniqueBuyers.add(purchase.purchaserId);
    });
    
    // Add super package buyers (Set automatically handles duplicates)
    superPackagePurchases.forEach((purchase) => {
      uniqueBuyers.add(purchase.purchaserId);
    });

    return uniqueBuyers.size;
  } catch (error) {
    console.error("Error getting direct active members:", error);
    return 0;
  }
};

// Get team leaders count (within 1st, 2nd, or 3rd level)
export const getTeamLeadersCount = async (userId, maxLevel = 3) => {
  try {
    const teamLeaders = await getUsersByLevelAndRank(
      userId,
      maxLevel,
      "Team Leader"
    );
    return teamLeaders.length;
  } catch (error) {
    console.error("Error getting team leaders count:", error);
    return 0;
  }
};

// Get assistant managers count (within 1st, 2nd, or 3rd level)
export const getAssistantManagersCount = async (userId, maxLevel = 3) => {
  try {
    const assistantManagers = await getUsersByLevelAndRank(
      userId,
      maxLevel,
      "Assistant Manager"
    );
    return assistantManagers.length;
  } catch (error) {
    console.error("Error getting assistant managers count:", error);
    return 0;
  }
};

// Get managers count (within 1st, 2nd, or 3rd level)
export const getManagersCount = async (userId, maxLevel = 3) => {
  try {
    const managers = await getUsersByLevelAndRank(userId, maxLevel, "Manager");
    return managers.length;
  } catch (error) {
    console.error("Error getting managers count:", error);
    return 0;
  }
};

// Get zonal heads count (direct)
export const getZonalHeadsCount = async (userId) => {
  try {
    const directReferrals = await User.find({ sponsorId: userId });
    const zonalHeads = directReferrals.filter(
      (user) => user.mlmLevel === "Zonal Head"
    );
    return zonalHeads.length;
  } catch (error) {
    console.error("Error getting zonal heads count:", error);
    return 0;
  }
};

// Helper function to get users by level and rank
const getUsersByLevelAndRank = async (userId, maxLevel, rank) => {
  try {
    const users = [];
    const queue = [{ userId, level: 0 }];
    const visited = new Set();

    while (queue.length > 0) {
      const { userId: currentUserId, level } = queue.shift();

      if (visited.has(currentUserId) || level > maxLevel) continue;
      visited.add(currentUserId);

      const user = await User.findOne({ userId: currentUserId });
      if (user && user.mlmLevel === rank) {
        users.push(user);
      }

      if (level < maxLevel) {
        const directReferrals = await User.find({ sponsorId: currentUserId });
        for (const referral of directReferrals) {
          queue.push({ userId: referral.userId, level: level + 1 });
        }
      }
    }

    return users;
  } catch (error) {
    console.error("Error getting users by level and rank:", error);
    return [];
  }
};

// Calculate and update user's MLM level
export const calculateAndUpdateMLMLevel = async (userId) => {
  try {
    const user = await User.findOne({ userId });
    if (!user) return null;

    const currentLevel = user.mlmLevel;
    let newLevel = "Free";

    // Check if user is active member first
    const isActiveMember = await checkActiveMemberStatus(userId);
    if (!isActiveMember) {
      newLevel = "Free";
    } else {
      newLevel = "Active Member";

      // Check Team Leader requirements
      const directActiveMembers = await getDirectActiveMembers(userId);
      if (directActiveMembers >= 10) {
        newLevel = "Team Leader";

        // Check Assistant Manager requirements
        const teamLeaders = await getTeamLeadersCount(userId);
        if (teamLeaders >= 7) {
          newLevel = "Assistant Manager";

          // Check Manager requirements
          const assistantManagers = await getAssistantManagersCount(userId);
          if (assistantManagers >= 5) {
            newLevel = "Manager";

            // Check Zonal Head requirements
            const managers = await getManagersCount(userId);
            if (managers >= 3) {
              newLevel = "Zonal Head";

              // Check National Head Promoter requirements
              const zonalHeads = await getZonalHeadsCount(userId);
              if (zonalHeads >= 2) {
                newLevel = "National Head Promoter";
              }
            }
          }
        }
      }
    }

    // Update user's level if it changed
    if (newLevel !== currentLevel) {
      await User.findByIdAndUpdate(user._id, {
        mlmLevel: newLevel,
        mlmLevelDate: new Date(),
        directActiveMembers: await getDirectActiveMembers(userId),
        teamLeaders: await getTeamLeadersCount(userId),
        assistantManagers: await getAssistantManagersCount(userId),
        managers: await getManagersCount(userId),
        zonalHeads: await getZonalHeadsCount(userId),
      });

      // Trigger level updates for upline
      await updateUplineLevels(user.sponsorId);
    }

    return newLevel;
  } catch (error) {
    console.error("Error calculating MLM level:", error);
    return null;
  }
};

// Update upline levels recursively
const updateUplineLevels = async (sponsorId) => {
  try {
    if (!sponsorId) return;

    const sponsor = await User.findOne({ userId: sponsorId });
    if (sponsor) {
      await calculateAndUpdateMLMLevel(sponsorId);
    }
  } catch (error) {
    console.error("Error updating upline levels:", error);
  }
};

// Get user's team structure
export const getUserTeamStructure = async (userId) => {
  try {
    const user = await User.findOne({ userId });
    if (!user) return null;

    return {
      mlmLevel: user.mlmLevel,
      mlmLevelDate: user.mlmLevelDate,
      directActiveMembers: user.directActiveMembers,
      teamLeaders: user.teamLeaders,
      assistantManagers: user.assistantManagers,
      managers: user.managers,
      zonalHeads: user.zonalHeads,
      isActiveMember: await checkActiveMemberStatus(userId),
    };
  } catch (error) {
    console.error("Error getting user team structure:", error);
    return null;
  }
};

// Calculate commission based on level and package price
// NO MLM LEVEL RESTRICTIONS - All users receive commissions regardless of their MLM level
export const calculateCommission = (packagePrice, level, userMLMLevel) => {
  // ₹799 joining membership gives ₹250 referral income
  if (packagePrice === 799) {
    return 250;
  }

  // REMOVED MLM LEVEL RESTRICTIONS
  // All users in the upline receive commissions regardless of their MLM level
  // This ensures that when a Level 6 referral user buys a course, all users in Levels 1-6 receive their payouts

  // Commission calculation based on level (no MLM restrictions)
  const commissionRates = {
    1: 0.1, // 10% for level 1
    2: 0.05, // 5% for level 2
    3: 0.03, // 3% for level 3
    4: 0.02, // 2% for level 4
    5: 0.01, // 1% for level 5+
  };

  const rate = commissionRates[level] || 0.01;
  return Math.round(packagePrice * rate);
};

// Calculate withdrawal charges
export const calculateWithdrawalCharges = (amount) => {
  const adminCharge = amount * 0.1; // 10% admin charge
  const tds = amount * 0.02; // 2% TDS
  const netAmount = amount - adminCharge - tds;

  return {
    grossAmount: amount,
    adminCharge: Math.round(adminCharge),
    tds: Math.round(tds),
    netAmount: Math.round(netAmount),
  };
};
