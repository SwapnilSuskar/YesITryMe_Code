import User from "../models/User.js";
import Package from "../models/Package.js";
import Wallet from "../models/Wallet.js";
import Purchase from "../models/Purchase.js";
import SuperPackagePurchase from "../models/SuperPackagePurchase.js"; // Added import for SuperPackagePurchase
import { generatePurchaseId } from "../utils/purchaseIdGenerator.js";
import notificationService from "./notificationService.js";

class ReferralService {
  /**
   * Validate referral chain to prevent circular references
   * @param {string} newUserId - The new user's ID
   * @param {string} sponsorId - The sponsor's ID
   * @returns {boolean} True if valid, false if circular reference detected
   */
  async validateReferralChain(newUserId, sponsorId) {
    try {
      // Prevent self-referral
      if (newUserId === sponsorId) {
        return false;
      }

      // Check if sponsor exists
      const sponsor = await User.findOne({ userId: sponsorId });
      if (!sponsor) {
        return false;
      }

      // TEMPORARILY DISABLED: Circular reference check
      // TODO: Re-enable after fixing existing database issues
      return true;

      /*
      // Check for circular references by traversing up the chain
      const visitedUsers = new Set(); // Don't include newUserId since it doesn't exist yet
      let currentUserId = sponsorId;
      let level = 1;

      while (currentUserId && level <= 120) {
        // If we encounter the new user ID in the chain, it's a circular reference
        if (visitedUsers.has(currentUserId)) {
          return false;
        }

        visitedUsers.add(currentUserId);
        
        // Get the current user's sponsor
        const currentUser = await User.findOne({ userId: currentUserId });
        if (!currentUser) {
          break;
        }

        currentUserId = currentUser.sponsorId;
        level++;
      }

      return true;
      */
    } catch (error) {
      console.error("Error validating referral chain:", error);
      return false;
    }
  }

  /**
   * Get user's genealogy tree (sponsors - who referred them)
   * @param {string} userId - The user ID to get genealogy for
   * @returns {Array} Array of sponsor objects with level information
   */
  async getGenealogyTree(userId) {
    try {
      const genealogy = [];
      let currentUserId = userId;
      let level = 1;

      while (currentUserId && level <= 120) {
        const user = await User.findOne({ userId: currentUserId });

        if (!user) {
          break;
        }

        genealogy.push({
          level,
          userId: user.userId,
          firstName: user.firstName,
          lastName: user.lastName,
          mobile: user.mobile,
          email: user.email,
          sponsorId: user.sponsorId,
        });

        // Move to the next level (parent)
        currentUserId = user.sponsorId;
        level++;
      }

      return genealogy;
    } catch (error) {
      console.error("Error getting genealogy tree:", error);
      throw new Error("Failed to get genealogy tree");
    }
  }

  /**
   * Get user's referrals (people they have referred)
   * @param {string} userId - The user ID to get referrals for
   * @returns {Array} Array of referral objects with level information
   */
  async getUserReferrals(userId) {
    try {
      const referrals = [];
      const visitedUsers = new Set(); // Track visited users to prevent circular references

      // Get all users who have this user as their sponsor
      const directReferrals = await User.find({ sponsorId: userId });

      for (const directReferral of directReferrals) {
        // Add direct referral (Level 1)
        referrals.push({
          level: 1,
          userId: directReferral.userId,
          firstName: directReferral.firstName,
          lastName: directReferral.lastName,
          mobile: directReferral.mobile,
          email: directReferral.email,
          referralCode: directReferral.referralCode,
          isDirect: true,
        });

        // Add to visited users to prevent circular references
        visitedUsers.add(directReferral.userId);

        // Get indirect referrals (Level 2 and beyond)
        const indirectReferrals = await this.getIndirectReferrals(
          directReferral.userId,
          2,
          visitedUsers
        );
        referrals.push(...indirectReferrals);
      }

      // Sort by level and then by name
      referrals.sort((a, b) => {
        if (a.level !== b.level) return a.level - b.level;
        return `${a.firstName} ${a.lastName}`.localeCompare(
          `${b.firstName} ${b.lastName}`
        );
      });

      return referrals;
    } catch (error) {
      console.error("Error getting user referrals:", error);
      throw new Error("Failed to get user referrals");
    }
  }

  /**
   * Get indirect referrals recursively
   * @param {string} userId - The user ID to get indirect referrals for
   * @param {number} level - Current level
   * @param {Set} visitedUsers - Set of already visited user IDs to prevent circular references
   * @returns {Array} Array of indirect referral objects
   */
  async getIndirectReferrals(userId, level, visitedUsers = new Set()) {
    try {
      const indirectReferrals = [];

      if (level > 120) return indirectReferrals; // Max 120 levels

      const directReferrals = await User.find({ sponsorId: userId });

      for (const directReferral of directReferrals) {
        // Check if this user has already been visited to prevent circular references
        if (visitedUsers.has(directReferral.userId)) {
          console.warn(
            `Circular reference detected: User ${directReferral.userId} already visited at level ${level}`
          );
          continue; // Skip this user to prevent infinite loop
        }

        indirectReferrals.push({
          level,
          userId: directReferral.userId,
          firstName: directReferral.firstName,
          lastName: directReferral.lastName,
          status: directReferral.status,
          imageUrl: directReferral.imageUrl,
          mobile: directReferral.mobile,
          email: directReferral.email,
          referralCode: directReferral.referralCode,
          isDirect: false,
        });

        // Add to visited users
        visitedUsers.add(directReferral.userId);

        // Recursively get next level referrals
        const nextLevelReferrals = await this.getIndirectReferrals(
          directReferral.userId,
          level + 1,
          visitedUsers
        );
        indirectReferrals.push(...nextLevelReferrals);
      }

      return indirectReferrals;
    } catch (error) {
      console.error("Error getting indirect referrals:", error);
      return [];
    }
  }

  /**
   * Get user's referrals in a tree structure
   * @param {string} userId - The user ID to get referrals for
   * @returns {Object} Tree structure with direct referrals and their sub-referrals
   */
  // Replace getUserReferralTree with this version
  async getUserReferralTree(userId) {
    try {
      const tree = {
        userId,
        directReferrals: [],
        totalReferrals: 0,
      };

      // 1) Load ALL direct referrals in one query (same as before)
      const directReferrals = await User.find(
        { sponsorId: userId },
        "userId firstName lastName mobile status imageUrl email referralCode activationDate createdAt"
      );

      // Build base nodes map for fast attachment later
      const nodeByUserId = new Map();
      const queue = [];

      for (const direct of directReferrals) {
        const node = {
          userId: direct.userId,
          firstName: direct.firstName,
          lastName: direct.lastName,
          mobile: direct.mobile,
          status: direct.status,
          imageUrl: direct.imageUrl,
          email: direct.email,
          referralCode: direct.referralCode,
          activationDate: direct.activationDate,
          createdAt: direct.createdAt,
          level: 1,
          isDirect: true,
          subReferrals: [],
        };
        tree.directReferrals.push(node);
        nodeByUserId.set(direct.userId, node);
        queue.push({ userId: direct.userId, level: 2 });
      }

      // Optional: simple totalReferrals = count of all users that have a sponsor
      tree.totalReferrals = await User.countDocuments({
        sponsorId: { $exists: true, $ne: null, $ne: "" },
      });

      // 2) BFS: load sub-referrals LEVEL BY LEVEL (maxDepth + safety maxNodes)
      const maxDepth = 10;
      const maxNodes = 5000; // hard safety limit; tune as needed
      const visited = new Set();
      let totalNodes = nodeByUserId.size;

      while (queue.length > 0) {
        // Group current level
        const currentLevel = [];
        const nextQueue = [];

        while (queue.length > 0) {
          currentLevel.push(queue.shift());
        }

        const sponsorIds = currentLevel.map((i) => i.userId);
        const level = currentLevel.length ? currentLevel[0].level : 2;
        if (level > maxDepth) break;

        // Single query for all users whose sponsorId is in this level
        const children = await User.find(
          { sponsorId: { $in: sponsorIds } },
          "userId firstName lastName mobile status email referralCode sponsorId activationDate createdAt"
        );

        for (const child of children) {
          if (visited.has(child.userId)) continue;
          visited.add(child.userId);

          // Safety: don’t allow unbounded growth
          if (totalNodes >= maxNodes) {
            // Stop attaching more children; you can log a warning here
            continue;
          }

          const parentNode = nodeByUserId.get(child.sponsorId);
          if (!parentNode) continue;

          const node = {
            userId: child.userId,
            firstName: child.firstName,
            lastName: child.lastName,
            mobile: child.mobile,
            status: child.status,
            email: child.email,
            referralCode: child.referralCode,
            activationDate: child.activationDate,
            createdAt: child.createdAt,
            level,
            isDirect: false,
            subReferrals: [],
          };

          parentNode.subReferrals.push(node);
          nodeByUserId.set(child.userId, node);
          totalNodes += 1;

          if (level < maxDepth) {
            nextQueue.push({ userId: child.userId, level: level + 1 });
          }
        }

        queue.push(...nextQueue);
      }

      return tree;
    } catch (error) {
      console.error("Error getting user referral tree (BFS):", error);
      throw new Error("Failed to get user referral tree");
    }
  }

  /**
   * Get sub-referrals for a specific user (optimized version)
   * @param {string} userId - The user ID to get sub-referrals for
   * @param {number} level - Current level
   * @param {number} maxDepth - Maximum depth to traverse
   * @returns {Array} Array of sub-referral objects
   */
  async getSubReferralsOptimized(userId, level, maxDepth = 10) {
    try {
      const subReferrals = [];

      if (level > maxDepth) return subReferrals; // Limit depth

      // Get ALL direct referrals - no limits
      const directReferrals = await User.find(
        { sponsorId: userId },
        "userId firstName lastName mobile status email referralCode"
      ); // No limit - show all referrals

      // Process ALL referrals
      for (const directReferral of directReferrals) {
        const subReferral = {
          userId: directReferral.userId,
          firstName: directReferral.firstName,
          lastName: directReferral.lastName,
          mobile: directReferral.mobile,
          status: directReferral.status,
          email: directReferral.email,
          referralCode: directReferral.referralCode,
          level,
          isDirect: false,
          subReferrals: [],
        };

        // Get next level if we haven't reached max depth
        if (level < maxDepth) {
          subReferral.subReferrals = await this.getSubReferralsOptimized(
            directReferral.userId,
            level + 1,
            maxDepth
          );
        }

        subReferrals.push(subReferral);
      }

      return subReferrals;
    } catch (error) {
      console.error("Error getting sub-referrals:", error);
      return [];
    }
  }

  /**
   * Get sub-referrals for a specific user (original version - kept for backward compatibility)
   * @param {string} userId - The user ID to get sub-referrals for
   * @param {number} level - Current level
   * @param {Set} visitedUsers - Set of already visited user IDs to prevent circular references
   * @returns {Array} Array of sub-referral objects
   */
  async getSubReferrals(userId, level, visitedUsers = new Set()) {
    try {
      const subReferrals = [];

      if (level > 120) return subReferrals; // Max 120 levels

      // Prevent circular/self-referral
      if (visitedUsers.has(userId)) return subReferrals;
      visitedUsers.add(userId);

      const directReferrals = await User.find({ sponsorId: userId });

      for (const directReferral of directReferrals) {
        // Skip if already visited (prevents self-referral/circular)
        if (visitedUsers.has(directReferral.userId)) continue;
        const subReferral = {
          userId: directReferral.userId,
          firstName: directReferral.firstName,
          lastName: directReferral.lastName,
          mobile: directReferral.mobile,
          status: directReferral.status,
          email: directReferral.email,
          referralCode: directReferral.referralCode,
          level,
          isDirect: false,
          subReferrals: [],
        };

        // Recursively get next level referrals, pass a copy of visitedUsers
        subReferral.subReferrals = await this.getSubReferrals(
          directReferral.userId,
          level + 1,
          new Set(visitedUsers)
        );

        subReferrals.push(subReferral);
      }

      return subReferrals;
    } catch (error) {
      console.error("Error getting sub-referrals:", error);
      return [];
    }
  }

  /**
   * Get sponsor genealogy for commission distribution
   * @param {string} userId - The purchaser's user ID
   * @returns {Array} Array of sponsor objects for commission distribution
   */
  async getSponsorGenealogy(userId) {
    try {
      const sponsors = [];
      const visitedUsers = new Set(); // Track visited users to prevent circular references
      let currentUserId = userId;
      let level = 1;

      while (currentUserId && level <= 120) {
        const user = await User.findOne({ userId: currentUserId });

        if (!user) {
          break;
        }

        // Check for circular reference
        if (visitedUsers.has(currentUserId)) {
          break;
        }

        visitedUsers.add(currentUserId);

        // Add sponsor to the list (skip the purchaser)
        if (level > 1) {
          sponsors.push({
            level: level - 1, // Commission level starts from 1
            userId: user.userId,
            firstName: user.firstName,
            lastName: user.lastName,
            mobile: user.mobile,
            email: user.email,
          });
        }

        // Move to the next level (parent)
        currentUserId = user.sponsorId;
        level++;
      }

      return sponsors;
    } catch (error) {
      console.error("Error getting sponsor genealogy:", error);
      throw new Error("Failed to get sponsor genealogy");
    }
  }

  /**
   * Calculate commission distribution for a package purchase
   * @param {string} packageName - Name of the purchased package
   * @param {number} packagePrice - Price of the package
   * @param {Array} sponsors - Array of sponsors from genealogy
   * @returns {Array} Commission distribution array
   */
  async calculateCommissionDistribution(packageName, packagePrice, sponsors) {
    const distributions = [];

    // Get commission structure from database
    const commissionStructure = await this.getCommissionStructure(packageName);

    sponsors.forEach((sponsor) => {
      const level = sponsor.level;
      const commissionLevel = commissionStructure.find(
        (c) => c.level === level
      );

      if (commissionLevel) {
        // Use fixed amount from commission structure instead of calculating from percentage
        const commissionAmount = commissionLevel.amount || 0;

        distributions.push({
          level,
          sponsorId: sponsor.userId,
          sponsorName: `${sponsor.firstName} ${sponsor.lastName}`,
          percentage: commissionLevel.percentage,
          amount: Math.round(commissionAmount * 100) / 100, // Round to 2 decimal places
          status: "pending",
        });
      }
    });

    return distributions;
  }

  /**
   * Calculate total possible commission for a package
   * @param {string} packageName - Name of the package
   * @returns {number} Total possible commission amount
   */
  async calculateTotalPossibleCommission(packageName) {
    try {
      const commissionStructure = await this.getCommissionStructure(
        packageName
      );
      return commissionStructure.reduce((sum, level) => sum + level.amount, 0);
    } catch (error) {
      console.error("Error calculating total possible commission:", error);
      return 0;
    }
  }

  /**
   * Distribute unassigned commission to admin
   * @param {number} unassignedCommission - Amount of unassigned commission
   * @param {string} purchaseId - Purchase ID
   * @param {string} packageName - Package name
   * @param {string} purchaserId - Purchaser ID
   * @param {string} purchaserName - Purchaser name
   */
  async distributeUnassignedCommission(
    unassignedCommission,
    purchaseId,
    packageName,
    purchaserId,
    purchaserName
  ) {
    try {
      // Find admin user
      const adminUser = await User.findOne({ role: "admin" });

      if (adminUser) {
        // Find or create wallet for admin
        let adminWallet = await Wallet.findOne({ userId: adminUser.userId });
        if (!adminWallet) {
          adminWallet = new Wallet({
            userId: adminUser.userId,
            balance: 0,
            totalEarned: 0,
          });
        }

        // Record unassigned commission as passive income only (do not add to wallet balance)
        adminWallet.totalEarned += unassignedCommission;
        adminWallet.passiveIncome += unassignedCommission; // Add to passive income

        // Add transaction record for admin
        adminWallet.transactions.push({
          type: "commission",
          amount: unassignedCommission,
          description: `Unassigned commission from ${purchaserName}'s ${packageName} purchase (missing levels)`,
          packageName: packageName,
          purchaserId: purchaserId,
          purchaserName: purchaserName,
          level: 120, // Use level 120 to indicate admin commission
          status: "completed",
        });

        await adminWallet.save();

        console.log(
          `👑 Admin: ₹${unassignedCommission} (unassigned commission from ${packageName})`
        );

        // Create commission notification for admin
        try {
          const notification =
            await notificationService.createCommissionNotification(
              adminUser.userId,
              unassignedCommission,
              120, // Use max level (120) to indicate admin commission
              purchaserName,
              packageName
            );
          console.log(
            `✅ Admin commission notification created: ${notification._id}`
          );
        } catch (error) {
          console.error(
            `❌ Error creating admin commission notification:`,
            error
          );
        }
      } else {
        console.log("❌ No admin user found to receive unassigned commission");
      }
    } catch (error) {
      console.error("Error distributing unassigned commission:", error);
    }
  }

  /**
   * Get commission structure for a specific package
   * @param {string} packageName - Name of the package
   * @returns {Array} Commission structure array
   */
  async getCommissionStructure(packageName) {
    try {
      // Fetch commission structure from database
      const packageData = await Package.findOne({ name: packageName });
      if (packageData && packageData.commissionStructure) {
        return packageData.commissionStructure;
      }

      // Fallback to hardcoded structure if not found in database
      const structures = {
        "Elite Package": [
          { level: 1, percentage: 50, amount: 1000 },
          { level: 2, percentage: 20, amount: 400 },
          { level: 3, percentage: 10, amount: 200 },
          { level: 4, percentage: 2, amount: 40 },
          { level: 5, percentage: 2, amount: 40 },
          ...Array.from({ length: 15 }, (_, i) => ({
            level: i + 6,
            percentage: 1,
            amount: 20,
          })),
          ...Array.from({ length: 100 }, (_, i) => ({
            level: i + 21,
            percentage: 0.01,
            amount: 0.2,
          })),
        ],
        "Super Prime Package": [
          { level: 1, percentage: 50, amount: 500 },
          { level: 2, percentage: 20, amount: 200 },
          { level: 3, percentage: 10, amount: 100 },
          { level: 4, percentage: 2, amount: 20 },
          { level: 5, percentage: 2, amount: 20 },
          ...Array.from({ length: 15 }, (_, i) => ({
            level: i + 6,
            percentage: 1,
            amount: 10,
          })),
          ...Array.from({ length: 100 }, (_, i) => ({
            level: i + 21,
            percentage: 0.01,
            amount: 0.1,
          })),
        ],
        "Prime Package": [
          { level: 1, percentage: 50, amount: 250 },
          { level: 2, percentage: 20, amount: 100 },
          { level: 3, percentage: 10, amount: 50 },
          { level: 4, percentage: 2, amount: 10 },
          { level: 5, percentage: 2, amount: 10 },
          ...Array.from({ length: 15 }, (_, i) => ({
            level: i + 6,
            percentage: 1,
            amount: 5,
          })),
          ...Array.from({ length: 100 }, (_, i) => ({
            level: i + 21,
            percentage: 0.01,
            amount: 0.05,
          })),
        ],
      };

      return structures[packageName] || [];
    } catch (error) {
      console.error("Error fetching commission structure:", error);
      return [];
    }
  }

  /**
   * Process package purchase and distribute commissions
   * @param {Object} purchaseData - Purchase data
   * @returns {Object} Purchase result with commission distribution
   */
  async processPackagePurchase(purchaseData) {
    try {
      const {
        purchaserId,
        packageId,
        packageName,
        packagePrice,
        paymentMethod,
      } = purchaseData;

      // Get purchaser details
      const purchaser = await User.findOne({ userId: purchaserId });
      if (!purchaser) {
        throw new Error("Purchaser not found");
      }

      // Get sponsor genealogy
      const sponsors = await this.getSponsorGenealogy(purchaserId);

      // Calculate commission distribution
      const commissionDistributions =
        await this.calculateCommissionDistribution(
          packageName,
          packagePrice,
          sponsors
        );

      // Calculate total commission to be distributed
      const totalCommissionToDistribute = commissionDistributions.reduce(
        (sum, dist) => sum + dist.amount,
        0
      );

      // Calculate unassigned commission (commission for missing levels)
      const totalPossibleCommission =
        await this.calculateTotalPossibleCommission(packageName);
      const unassignedCommission =
        totalPossibleCommission - totalCommissionToDistribute;

      console.log(
        `💰 Regular Package Commission Distribution for ${packageName} (₹${packagePrice})`
      );
      console.log(`📊 Total possible commission: ₹${totalPossibleCommission}`);
      console.log(`📊 Distributed commission: ₹${totalCommissionToDistribute}`);
      console.log(`📊 Unassigned commission: ₹${unassignedCommission}`);

      // Create purchase record
      const purchaseId = generatePurchaseId();
      const purchase = new Purchase({
        purchaseId,
        purchaserId,
        purchaserName: `${purchaser.firstName} ${purchaser.lastName}`,
        packageId,
        packageName,
        packagePrice,
        paymentMethod,
        paymentStatus: "completed",
        commissionDistributions,
        totalCommissionDistributed: totalCommissionToDistribute,
      });

      await purchase.save();

      // Distribute commissions to wallets
      const distributionResults = await this.distributeCommissions(
        commissionDistributions,
        purchaseId,
        packageName,
        purchaserId,
        purchaser.firstName + " " + purchaser.lastName
      );

      // Handle unassigned commission by sending it to admin
      if (unassignedCommission > 0) {
        await this.distributeUnassignedCommission(
          unassignedCommission,
          purchaseId,
          packageName,
          purchaserId,
          purchaser.firstName + " " + purchaser.lastName
        );
      }

      // Update purchase with distribution results
      purchase.commissionDistributions = distributionResults;
      await purchase.save();

      return {
        success: true,
        purchaseId,
        purchaseObjectId: purchase._id,
        totalCommissionDistributed:
          totalCommissionToDistribute + unassignedCommission,
        distributions: distributionResults,
      };
    } catch (error) {
      console.error("Error processing package purchase:", error);
      throw error;
    }
  }

  /**
   * Distribute commissions to sponsor wallets
   * @param {Array} distributions - Commission distributions
   * @param {string} purchaseId - Purchase ID
   * @param {string} packageName - Package name
   * @param {string} purchaserId - Purchaser ID
   * @param {string} purchaserName - Purchaser name
   * @returns {Array} Updated distributions with results
   */
  async distributeCommissions(
    distributions,
    purchaseId,
    packageName,
    purchaserId,
    purchaserName
  ) {
    const results = [];

    for (const distribution of distributions) {
      try {
        // Find or create wallet for sponsor
        let wallet = await Wallet.findOne({ userId: distribution.sponsorId });

        if (!wallet) {
          wallet = new Wallet({
            userId: distribution.sponsorId,
            balance: 0,
            totalEarned: 0,
          });
        }

        // Add commission to wallet
        wallet.balance += distribution.amount;
        wallet.totalEarned += distribution.amount;

        // Update active or passive income based on level
        if (distribution.level === 1) {
          wallet.activeIncome += distribution.amount;
        } else if (distribution.level >= 2 && distribution.level <= 120) {
          wallet.passiveIncome += distribution.amount;
        }

        // Add transaction record
        wallet.transactions.push({
          type: "commission",
          amount: distribution.amount,
          description: `Level ${distribution.level} commission from ${purchaserName}'s ${packageName} purchase`,
          packageName,
          purchaserId,
          purchaserName,
          level: distribution.level,
          status: "completed",
        });

        await wallet.save();

        // Create commission notification
        try {
          const notification =
            await notificationService.createCommissionNotification(
              distribution.sponsorId,
              distribution.amount,
              distribution.level,
              purchaserName,
              packageName
            );
        } catch (error) {
          console.error(
            `❌ Error creating commission notification for ${distribution.sponsorId}:`,
            error
          );
          // Don't fail the commission distribution if notification fails
        }

        // Update distribution status
        distribution.status = "distributed";
        distribution.distributedAt = new Date();
        results.push(distribution);
      } catch (error) {
        console.error(
          `Error distributing commission to ${distribution.sponsorId}:`,
          error
        );
        distribution.status = "failed";
        results.push(distribution);
      }
    }

    return results;
  }

  /**
   * Get user's commission earnings summary
   * @param {string} userId - User ID
   * @returns {Object} Commission summary
   */
  async getCommissionSummary(userId) {
    try {
      const wallet = await Wallet.findOne({ userId });
      if (!wallet) {
        return {
          balance: 0,
          totalEarned: 0,
          totalWithdrawn: 0,
          transactions: [],
        };
      }

      return {
        balance: wallet.balance,
        activeIncome: wallet.activeIncome || 0,
        passiveIncome: wallet.passiveIncome || 0,
        totalEarned: wallet.totalEarned,
        totalWithdrawn: wallet.totalWithdrawn,
        transactions: wallet.transactions.slice(0, 10), // First 10 transactions
      };
    } catch (error) {
      console.error("Error getting commission summary:", error);
      throw new Error("Failed to get commission summary");
    }
  }

  /**
   * Get user's genealogy tree for display
   * @param {string} userId - User ID
   * @returns {Object} Genealogy tree data
   */
  async getUserGenealogy(userId) {
    try {
      const genealogy = await this.getGenealogyTree(userId);

      return {
        user: genealogy[0] || null,
        sponsors: genealogy.slice(1).map((sponsor, index) => ({
          ...sponsor,
          level: index + 1,
        })),
      };
    } catch (error) {
      console.error("Error getting user genealogy:", error);
      throw new Error("Failed to get user genealogy");
    }
  }

  /**
   * Get direct referrals per day for the last 7 days for a user
   * @param {string} userId - The user ID
   * @returns {Array} Array of { date: 'YYYY-MM-DD', count: N }
   */
  async getDirectReferralsLast7Days(userId) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setUTCDate(today.getUTCDate() - (6 - i));
      return d;
    });
    // Get all direct referrals in the last 7 days
    const fromDate = new Date(last7Days[0]);
    const toDate = new Date(today);
    toDate.setUTCDate(today.getUTCDate() + 1); // include today
    const directReferrals = await User.find({
      sponsorId: userId,
      createdAt: { $gte: fromDate, $lt: toDate },
    });
    // Count per day
    const counts = last7Days.map((date) => {
      const dateStr = date.toISOString().slice(0, 10);
      const count = directReferrals.filter(
        (ref) => ref.createdAt.toISOString().slice(0, 10) === dateStr
      ).length;
      return { date: dateStr, count };
    });
    return counts;
  }

  /**
   * Get all downline (direct + indirect) referrals per day for the last 7 days for a user
   * @param {string} userId - The user ID
   * @returns {Array} Array of { date: 'YYYY-MM-DD', count: N }
   */
  async getDownlineReferralsLast7Days(userId) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setUTCDate(today.getUTCDate() - (6 - i));
      return d;
    });
    // Get all downline userIds (direct + indirect)
    const allDownlineUserIds = await this.getAllDownlineUserIds(userId);
    if (allDownlineUserIds.length === 0) {
      return last7Days.map((date) => ({
        date: date.toISOString().slice(0, 10),
        count: 0,
      }));
    }
    // Get all users in downline created in the last 7 days
    const fromDate = new Date(last7Days[0]);
    const toDate = new Date(today);
    toDate.setUTCDate(today.getUTCDate() + 1); // include today
    const downlineUsers = await User.find({
      userId: { $in: allDownlineUserIds },
      createdAt: { $gte: fromDate, $lt: toDate },
    });
    // Count per day
    const counts = last7Days.map((date) => {
      const dateStr = date.toISOString().slice(0, 10);
      const count = downlineUsers.filter(
        (ref) => ref.createdAt.toISOString().slice(0, 10) === dateStr
      ).length;
      return { date: dateStr, count };
    });
    return counts;
  }

  /**
   * Recursively get all downline userIds (direct + indirect)
   * @param {string} userId
   * @returns {Array} userIds
   */
  async getAllDownlineUserIds(userId) {
    try {
      // Use MongoDB aggregation for better performance
      const pipeline = [
        {
          $match: { sponsorId: userId },
        },
        {
          $graphLookup: {
            from: "users",
            startWith: "$userId",
            connectFromField: "userId",
            connectToField: "sponsorId",
            as: "descendants",
            maxDepth: 120,
            depthField: "level",
          },
        },
        {
          $project: {
            _id: 0,
            userId: 1,
            descendants: "$descendants.userId",
          },
        },
      ];

      const results = await User.aggregate(pipeline);

      // Extract all unique userIds from results and descendants
      const allUserIds = new Set();
      results.forEach((result) => {
        allUserIds.add(result.userId);
        result.descendants.forEach((descId) => allUserIds.add(descId));
      });

      return Array.from(allUserIds);
    } catch (error) {
      console.error("Error in getAllDownlineUserIds:", error);
      // Fallback to original method if aggregation fails
      const result = [];
      const stack = [userId];
      const visited = new Set();
      while (stack.length > 0) {
        const currentId = stack.pop();
        if (visited.has(currentId)) continue;
        visited.add(currentId);
        const directRefs = await User.find({ sponsorId: currentId }, "userId");
        for (const ref of directRefs) {
          result.push(ref.userId);
          stack.push(ref.userId);
        }
      }
      return result.filter((id) => id !== userId);
    }
  }

  async getTotalDownlineCount(userId) {
    const allDownlineUserIds = await this.getAllDownlineUserIds(userId);
    return allDownlineUserIds.length;
  }

  /**
   * Get total count of package buyers in downline (direct + indirect) for a user
   * @param {string} userId - The user ID
   * @returns {number} Total count of unique package buyers
   */
  /**
   * Get total unique package buyers count for the logged-in user's downline
   * @param {string} userId - The user ID
   * @returns {number} Total count of unique users who have made package purchases in downline
   */
  async getTotalPackageBuyersCount(userId) {
    // Get all downline userIds (direct + indirect)
    const allDownlineUserIds = await this.getAllDownlineUserIds(userId);

    if (allDownlineUserIds.length === 0) {
      return 0;
    }

    // Get all package purchases by downline users (active status only)
    const packagePurchases = await Purchase.find({
      purchaserId: { $in: allDownlineUserIds },
      status: "active",
    });

    // Count unique users who have made purchases
    const uniqueBuyers = new Set(
      packagePurchases.map((purchase) => purchase.purchaserId)
    );
    return uniqueBuyers.size;
  }

  /**
   * Get package buyers in downline (direct + indirect) for different time periods
   * @param {string} userId - The user ID
   * @param {string} period - '1day', '7days', '15days', 'alltime'
   * @returns {Array} Array of { date: 'YYYY-MM-DD', count: N }
   */
  async getDownlinePackageBuyersByPeriod(userId, period = "7days") {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Calculate date range based on period
    let days = 7;
    let fromDate = new Date(today);

    switch (period) {
      case "1day":
        days = 1;
        break;
      case "7days":
        days = 7;
        break;
      case "15days":
        days = 15;
        break;
      case "month":
        days = 30;
        break;
      case "alltime":
        days = 365; // Use 1 year for "all time" to show historical data
        break;
      default:
        days = 7;
    }

    const lastDays = Array.from({ length: days }, (_, i) => {
      const d = new Date(today);
      d.setUTCDate(today.getUTCDate() - (days - 1 - i));
      return d;
    });

    // Get all downline userIds (direct + indirect)
    const allDownlineUserIds = await this.getAllDownlineUserIds(userId);
    if (allDownlineUserIds.length === 0) {
      return lastDays.map((date) => ({
        date: date.toISOString().slice(0, 10),
        count: 0,
      }));
    }

    // Get all package purchases by downline users in the specified period
    fromDate = new Date(lastDays[0]);
    const toDate = new Date(today);
    toDate.setUTCDate(today.getUTCDate() + 1); // include today

    const packagePurchases = await Purchase.find({
      purchaserId: { $in: allDownlineUserIds },
      status: "active",
      purchaseDate: { $gte: fromDate, $lt: toDate },
    });

    // Count unique users who made purchases per day
    const counts = lastDays.map((date) => {
      const dateStr = date.toISOString().slice(0, 10);
      const purchasesOnDate = packagePurchases.filter(
        (purchase) =>
          purchase.purchaseDate.toISOString().slice(0, 10) === dateStr
      );
      // Count unique users who made purchases on this date
      const uniqueBuyers = new Set(
        purchasesOnDate.map((purchase) => purchase.purchaserId)
      );
      return { date: dateStr, count: uniqueBuyers.size };
    });

    return counts;
  }

  /**
   * Get direct package buyers for different time periods
   * @param {string} userId - The user ID
   * @param {string} period - '1day', '7days', '15days', 'alltime'
   * @returns {Array} Array of { date: 'YYYY-MM-DD', count: N }
   */
  async getDirectPackageBuyersByPeriod(userId, period = "7days") {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Calculate date range based on period
    let days = 7;
    let fromDate = new Date(today);

    switch (period) {
      case "1day":
        days = 1;
        break;
      case "7days":
        days = 7;
        break;
      case "15days":
        days = 15;
        break;
      case "month":
        days = 30;
        break;
      case "alltime":
        days = 365; // Use 1 year for "all time" to show historical data
        break;
      default:
        days = 7;
    }

    const lastDays = Array.from({ length: days }, (_, i) => {
      const d = new Date(today);
      d.setUTCDate(today.getUTCDate() - (days - 1 - i));
      return d;
    });

    // Get direct referrals
    const directReferrals = await User.find({ sponsorId: userId }, "userId");
    const directReferralIds = directReferrals.map((user) => user.userId);

    if (directReferralIds.length === 0) {
      return lastDays.map((date) => ({
        date: date.toISOString().slice(0, 10),
        count: 0,
      }));
    }

    // Get all package purchases by direct referrals in the specified period
    fromDate = new Date(lastDays[0]);
    const toDate = new Date(today);
    toDate.setUTCDate(today.getUTCDate() + 1); // include today

    const packagePurchases = await Purchase.find({
      purchaserId: { $in: directReferralIds },
      status: "active",
      purchaseDate: { $gte: fromDate, $lt: toDate },
    });

    // Count unique users who made purchases per day
    const counts = lastDays.map((date) => {
      const dateStr = date.toISOString().slice(0, 10);
      const purchasesOnDate = packagePurchases.filter(
        (purchase) =>
          purchase.purchaseDate.toISOString().slice(0, 10) === dateStr
      );
      // Count unique users who made purchases on this date
      const uniqueBuyers = new Set(
        purchasesOnDate.map((purchase) => purchase.purchaserId)
      );
      return { date: dateStr, count: uniqueBuyers.size };
    });

    return counts;
  }

  /**
   * Get categorized package buyers (direct vs indirect) for different time periods
   * @param {string} userId - The user ID
   * @param {string} period - '1day', '7days', '15days', 'alltime'
   * @returns {Object} Object with directBuyers and indirectBuyers arrays
   */
  async getCategorizedPackageBuyersByPeriod(userId, period = "7days") {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Calculate date range based on period
    let days = 7;
    let fromDate = new Date(today);

    switch (period) {
      case "1day":
        days = 1;
        break;
      case "7days":
        days = 7;
        break;
      case "15days":
        days = 15;
        break;
      case "month":
        days = 30;
        break;
      case "alltime":
        days = 365; // Use 1 year for "all time" to show historical data
        break;
      default:
        days = 7;
    }

    const lastDays = Array.from({ length: days }, (_, i) => {
      const d = new Date(today);
      d.setUTCDate(today.getUTCDate() - (days - 1 - i));
      return d;
    });

    // Get direct referrals
    const directReferrals = await User.find({ sponsorId: userId }, "userId");
    const directReferralIds = directReferrals.map((user) => user.userId);

    // Get all downline userIds (direct + indirect)
    const allDownlineUserIds = await this.getAllDownlineUserIds(userId);

    // Calculate indirect referral IDs (all downline minus direct)
    const indirectReferralIds = allDownlineUserIds.filter(
      (id) => !directReferralIds.includes(id)
    );

    // Get all package purchases by downline users in the specified period
    fromDate = new Date(lastDays[0]);
    const toDate = new Date(today);
    toDate.setUTCDate(today.getUTCDate() + 1); // include today

    const allPackagePurchases = await Purchase.find({
      purchaserId: { $in: allDownlineUserIds },
      status: "active",
      purchaseDate: { $gte: fromDate, $lt: toDate },
    });

    // Separate purchases by direct and indirect referrals
    const directPurchases = allPackagePurchases.filter((purchase) =>
      directReferralIds.includes(purchase.purchaserId)
    );

    const indirectPurchases = allPackagePurchases.filter((purchase) =>
      indirectReferralIds.includes(purchase.purchaserId)
    );

    // Count unique users per day for direct referrals
    const directCounts = lastDays.map((date) => {
      const dateStr = date.toISOString().slice(0, 10);
      const purchasesOnDate = directPurchases.filter(
        (purchase) =>
          purchase.purchaseDate.toISOString().slice(0, 10) === dateStr
      );
      const uniqueBuyers = new Set(
        purchasesOnDate.map((purchase) => purchase.purchaserId)
      );
      return { date: dateStr, count: uniqueBuyers.size };
    });

    // Count unique users per day for indirect referrals
    const indirectCounts = lastDays.map((date) => {
      const dateStr = date.toISOString().slice(0, 10);
      const purchasesOnDate = indirectPurchases.filter(
        (purchase) =>
          purchase.purchaseDate.toISOString().slice(0, 10) === dateStr
      );
      const uniqueBuyers = new Set(
        purchasesOnDate.map((purchase) => purchase.purchaserId)
      );
      return { date: dateStr, count: uniqueBuyers.size };
    });

    return {
      directBuyers: directCounts,
      indirectBuyers: indirectCounts,
    };
  }

  /**
   * Get total counts of direct and indirect package buyers
   * @param {string} userId - The user ID
   * @returns {Object} Object with directCount and indirectCount
   */
  async getTotalCategorizedPackageBuyers(userId) {
    // Get direct referrals
    const directReferrals = await User.find({ sponsorId: userId }, "userId");
    const directReferralIds = directReferrals.map((user) => user.userId);

    // Get all downline userIds (direct + indirect)
    const allDownlineUserIds = await this.getAllDownlineUserIds(userId);

    // Calculate indirect referral IDs (all downline minus direct)
    const indirectReferralIds = allDownlineUserIds.filter(
      (id) => !directReferralIds.includes(id)
    );

    // Get all package purchases by downline users
    const allPackagePurchases = await Purchase.find({
      purchaserId: { $in: allDownlineUserIds },
      status: "active",
    });

    // Separate purchases by direct and indirect referrals
    const directPurchases = allPackagePurchases.filter((purchase) =>
      directReferralIds.includes(purchase.purchaserId)
    );

    const indirectPurchases = allPackagePurchases.filter((purchase) =>
      indirectReferralIds.includes(purchase.purchaserId)
    );

    // Count unique users for direct referrals
    const directUniqueBuyers = new Set(
      directPurchases.map((purchase) => purchase.purchaserId)
    );

    // Count unique users for indirect referrals
    const indirectUniqueBuyers = new Set(
      indirectPurchases.map((purchase) => purchase.purchaserId)
    );

    return {
      directCount: directUniqueBuyers.size,
      indirectCount: indirectUniqueBuyers.size,
      totalCount: directUniqueBuyers.size + indirectUniqueBuyers.size,
    };
  }

  /**
   * Get total unique super package buyers count for the logged-in user's downline
   * @param {string} userId - The user ID
   * @returns {number} Total count of unique users who have made super package purchases in downline
   */
  async getTotalSuperPackageBuyersCount(userId) {
    // Get all downline userIds (direct + indirect)
    const allDownlineUserIds = await this.getAllDownlineUserIds(userId);

    if (allDownlineUserIds.length === 0) {
      return 0;
    }

    // Get all super package purchases by downline users (active status only)
    const superPackagePurchases = await SuperPackagePurchase.find({
      purchaserId: { $in: allDownlineUserIds },
      status: "active",
    });

    // Count unique users who have made purchases
    const uniqueBuyers = new Set(
      superPackagePurchases.map((purchase) => purchase.purchaserId)
    );
    return uniqueBuyers.size;
  }

  /**
   * Get super package buyers in downline (direct + indirect) for different time periods
   * @param {string} userId - The user ID
   * @param {string} period - '1day', '7days', '15days', 'alltime'
   * @returns {Array} Array of { date: 'YYYY-MM-DD', count: N }
   */
  async getDownlineSuperPackageBuyersByPeriod(userId, period = "7days") {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Calculate date range based on period
    let days = 7;
    let fromDate = new Date(today);

    switch (period) {
      case "1day":
        days = 1;
        break;
      case "7days":
        days = 7;
        break;
      case "15days":
        days = 15;
        break;
      case "month":
        days = 30;
        break;
      case "alltime":
        days = 365; // Use 1 year for "all time" to show historical data
        break;
      default:
        days = 7;
    }

    const lastDays = Array.from({ length: days }, (_, i) => {
      const d = new Date(today);
      d.setUTCDate(today.getUTCDate() - (days - 1 - i));
      return d;
    });

    // Get all downline userIds (direct + indirect)
    const allDownlineUserIds = await this.getAllDownlineUserIds(userId);
    if (allDownlineUserIds.length === 0) {
      return lastDays.map((date) => ({
        date: date.toISOString().slice(0, 10),
        count: 0,
      }));
    }

    // Get all super package purchases by downline users in the specified period
    fromDate = new Date(lastDays[0]);
    const toDate = new Date(today);
    toDate.setUTCDate(today.getUTCDate() + 1); // include today

    const superPackagePurchases = await SuperPackagePurchase.find({
      purchaserId: { $in: allDownlineUserIds },
      status: "active",
      purchaseDate: { $gte: fromDate, $lt: toDate },
    });

    // Count unique users per day
    const counts = lastDays.map((date) => {
      const dateStr = date.toISOString().slice(0, 10);
      const purchasesOnDate = superPackagePurchases.filter(
        (purchase) =>
          purchase.purchaseDate.toISOString().slice(0, 10) === dateStr
      );
      const uniqueBuyers = new Set(
        purchasesOnDate.map((purchase) => purchase.purchaserId)
      );
      return { date: dateStr, count: uniqueBuyers.size };
    });

    return counts;
  }

  /**
   * Get direct super package buyers for different time periods
   * @param {string} userId - The user ID
   * @param {string} period - '1day', '7days', '15days', 'alltime'
   * @returns {Array} Array of { date: 'YYYY-MM-DD', count: N }
   */
  async getDirectSuperPackageBuyersByPeriod(userId, period = "7days") {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Calculate date range based on period
    let days = 7;
    let fromDate = new Date(today);

    switch (period) {
      case "1day":
        days = 1;
        break;
      case "7days":
        days = 7;
        break;
      case "15days":
        days = 15;
        break;
      case "month":
        days = 30;
        break;
      case "alltime":
        days = 365; // Use 1 year for "all time" to show historical data
        break;
      default:
        days = 7;
    }

    const lastDays = Array.from({ length: days }, (_, i) => {
      const d = new Date(today);
      d.setUTCDate(today.getUTCDate() - (days - 1 - i));
      return d;
    });

    // Get direct referrals
    const directReferrals = await User.find({ sponsorId: userId }, "userId");
    const directReferralIds = directReferrals.map((user) => user.userId);

    if (directReferralIds.length === 0) {
      return lastDays.map((date) => ({
        date: date.toISOString().slice(0, 10),
        count: 0,
      }));
    }

    // Get all super package purchases by direct referrals in the specified period
    fromDate = new Date(lastDays[0]);
    const toDate = new Date(today);
    toDate.setUTCDate(today.getUTCDate() + 1); // include today

    const superPackagePurchases = await SuperPackagePurchase.find({
      purchaserId: { $in: directReferralIds },
      status: "active",
      purchaseDate: { $gte: fromDate, $lt: toDate },
    });

    // Count unique users per day
    const counts = lastDays.map((date) => {
      const dateStr = date.toISOString().slice(0, 10);
      const purchasesOnDate = superPackagePurchases.filter(
        (purchase) =>
          purchase.purchaseDate.toISOString().slice(0, 10) === dateStr
      );
      const uniqueBuyers = new Set(
        purchasesOnDate.map((purchase) => purchase.purchaserId)
      );
      return { date: dateStr, count: uniqueBuyers.size };
    });

    return counts;
  }

  /**
   * Get categorized super package buyers (direct vs indirect) for different time periods
   * @param {string} userId - The user ID
   * @param {string} period - '1day', '7days', '15days', 'alltime'
   * @returns {Object} Object with directBuyers and indirectBuyers arrays
   */
  async getCategorizedSuperPackageBuyersByPeriod(userId, period = "7days") {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Calculate date range based on period
    let days = 7;
    let fromDate = new Date(today);

    switch (period) {
      case "1day":
        days = 1;
        break;
      case "7days":
        days = 7;
        break;
      case "15days":
        days = 15;
        break;
      case "month":
        days = 30;
        break;
      case "alltime":
        days = 365; // Use 1 year for "all time" to show historical data
        break;
      default:
        days = 7;
    }

    const lastDays = Array.from({ length: days }, (_, i) => {
      const d = new Date(today);
      d.setUTCDate(today.getUTCDate() - (days - 1 - i));
      return d;
    });

    // Get direct referrals
    const directReferrals = await User.find({ sponsorId: userId }, "userId");
    const directReferralIds = directReferrals.map((user) => user.userId);

    // Get all downline userIds (direct + indirect)
    const allDownlineUserIds = await this.getAllDownlineUserIds(userId);

    // Calculate indirect referral IDs (all downline minus direct)
    const indirectReferralIds = allDownlineUserIds.filter(
      (id) => !directReferralIds.includes(id)
    );

    // Get all super package purchases by downline users in the specified period
    fromDate = new Date(lastDays[0]);
    const toDate = new Date(today);
    toDate.setUTCDate(today.getUTCDate() + 1); // include today

    const allSuperPackagePurchases = await SuperPackagePurchase.find({
      purchaserId: { $in: allDownlineUserIds },
      status: "active",
      purchaseDate: { $gte: fromDate, $lt: toDate },
    });

    // Separate purchases by direct and indirect referrals
    const directPurchases = allSuperPackagePurchases.filter((purchase) =>
      directReferralIds.includes(purchase.purchaserId)
    );

    const indirectPurchases = allSuperPackagePurchases.filter((purchase) =>
      indirectReferralIds.includes(purchase.purchaserId)
    );

    // Count unique users per day for direct referrals
    const directCounts = lastDays.map((date) => {
      const dateStr = date.toISOString().slice(0, 10);
      const purchasesOnDate = directPurchases.filter(
        (purchase) =>
          purchase.purchaseDate.toISOString().slice(0, 10) === dateStr
      );
      const uniqueBuyers = new Set(
        purchasesOnDate.map((purchase) => purchase.purchaserId)
      );
      return { date: dateStr, count: uniqueBuyers.size };
    });

    // Count unique users per day for indirect referrals
    const indirectCounts = lastDays.map((date) => {
      const dateStr = date.toISOString().slice(0, 10);
      const purchasesOnDate = indirectPurchases.filter(
        (purchase) =>
          purchase.purchaseDate.toISOString().slice(0, 10) === dateStr
      );
      const uniqueBuyers = new Set(
        purchasesOnDate.map((purchase) => purchase.purchaserId)
      );
      return { date: dateStr, count: uniqueBuyers.size };
    });

    return {
      directBuyers: directCounts,
      indirectBuyers: indirectCounts,
    };
  }

  /**
   * Get total counts of direct and indirect super package buyers
   * @param {string} userId - The user ID
   * @returns {Object} Object with directCount and indirectCount
   */
  async getTotalCategorizedSuperPackageBuyers(userId) {
    // Get direct referrals
    const directReferrals = await User.find({ sponsorId: userId }, "userId");
    const directReferralIds = directReferrals.map((user) => user.userId);

    // Get all downline userIds (direct + indirect)
    const allDownlineUserIds = await this.getAllDownlineUserIds(userId);

    // Calculate indirect referral IDs (all downline minus direct)
    const indirectReferralIds = allDownlineUserIds.filter(
      (id) => !directReferralIds.includes(id)
    );

    // Get all super package purchases by downline users
    const allSuperPackagePurchases = await SuperPackagePurchase.find({
      purchaserId: { $in: allDownlineUserIds },
      status: "active",
    });

    // Separate purchases by direct and indirect referrals
    const directPurchases = allSuperPackagePurchases.filter((purchase) =>
      directReferralIds.includes(purchase.purchaserId)
    );

    const indirectPurchases = allSuperPackagePurchases.filter((purchase) =>
      indirectReferralIds.includes(purchase.purchaserId)
    );

    // Count unique users for direct referrals
    const directUniqueBuyers = new Set(
      directPurchases.map((purchase) => purchase.purchaserId)
    );

    // Count unique users for indirect referrals
    const indirectUniqueBuyers = new Set(
      indirectPurchases.map((purchase) => purchase.purchaserId)
    );

    return {
      directCount: directUniqueBuyers.size,
      indirectCount: indirectUniqueBuyers.size,
      totalCount: directUniqueBuyers.size + indirectUniqueBuyers.size,
    };
  }
}

export default new ReferralService();
