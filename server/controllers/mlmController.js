import User from "../models/User.js";
import { 
  calculateAndUpdateMLMLevel, 
  getUserTeamStructure, 
  checkActiveMemberStatus,
  getDirectActiveMembers,
  getTeamLeadersCount,
  getAssistantManagersCount,
  getManagersCount,
  getZonalHeadsCount
} from "../services/mlmService.js";

// Get user's MLM level and team structure
// Only recalculates if the successful downline count has changed to avoid unnecessary refreshes
export const getUserMLMLevel = async (req, res) => {
  try {
    const { userId } = req.user;
    
    // Get current user to check stored directActiveMembers count
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get current successful downline count using unified logic
    const currentCount = await getDirectActiveMembers(userId);
    const storedCount = user.directActiveMembers || 0;
    
    // Only recalculate if the count has changed (to avoid unnecessary refreshes)
    if (currentCount !== storedCount) {
      await calculateAndUpdateMLMLevel(userId);
    }
    
    const teamStructure = await getUserTeamStructure(userId);
    
    if (!teamStructure) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: teamStructure
    });
  } catch (error) {
    console.error('Error getting MLM level:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting MLM level',
      error: error.message
    });
  }
};

// Calculate and update user's MLM level
export const updateMLMLevel = async (req, res) => {
  try {
    const { userId } = req.user;
    
    const newLevel = await calculateAndUpdateMLMLevel(userId);
    
    if (!newLevel) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const teamStructure = await getUserTeamStructure(userId);

    res.json({
      success: true,
      message: 'MLM level updated successfully',
      data: {
        newLevel,
        teamStructure
      }
    });
  } catch (error) {
    console.error('Error updating MLM level:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating MLM level',
      error: error.message
    });
  }
};

// Get user's team structure details
export const getTeamStructure = async (req, res) => {
  try {
    const { userId } = req.user;
    
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get detailed team counts
    const directActiveMembers = await getDirectActiveMembers(userId);
    const teamLeaders = await getTeamLeadersCount(userId);
    const assistantManagers = await getAssistantManagersCount(userId);
    const managers = await getManagersCount(userId);
    const zonalHeads = await getZonalHeadsCount(userId);
    const isActiveMember = await checkActiveMemberStatus(userId);

    const teamStructure = {
      mlmLevel: user.mlmLevel,
      mlmLevelDate: user.mlmLevelDate,
      directActiveMembers,
      teamLeaders,
      assistantManagers,
      managers,
      zonalHeads,
      isActiveMember,
      // Level requirements for next promotion
      requirements: {
        teamLeader: {
          required: 10,
          current: directActiveMembers,
          achieved: directActiveMembers >= 10
        },
        assistantManager: {
          required: 7,
          current: teamLeaders,
          achieved: teamLeaders >= 7
        },
        manager: {
          required: 5,
          current: assistantManagers,
          achieved: assistantManagers >= 5
        },
        zonalHead: {
          required: 3,
          current: managers,
          achieved: managers >= 3
        },
        nationalHead: {
          required: 2,
          current: zonalHeads,
          achieved: zonalHeads >= 2
        }
      }
    };

    res.json({
      success: true,
      data: teamStructure
    });
  } catch (error) {
    console.error('Error getting team structure:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting team structure',
      error: error.message
    });
  }
};

// Get all users by MLM level (admin only)
export const getUsersByMLMLevel = async (req, res) => {
  try {
    const { level } = req.params;
    
    const validLevels = ["Active Member", "Team Leader", "Assistant Manager", "Manager", "Zonal Head", "National Head Promoter"];
    
    if (!validLevels.includes(level)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid MLM level'
      });
    }

    const users = await User.find({ mlmLevel: level })
      .select('userId firstName lastName mobile email mlmLevel mlmLevelDate directActiveMembers teamLeaders assistantManagers managers zonalHeads')
      .sort({ mlmLevelDate: -1 });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error getting users by MLM level:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting users by MLM level',
      error: error.message
    });
  }
};

// Get MLM statistics (admin only)
export const getMLMStats = async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$mlmLevel',
          count: { $sum: 1 },
          totalDirectActiveMembers: { $sum: '$directActiveMembers' },
          totalTeamLeaders: { $sum: '$teamLeaders' },
          totalAssistantManagers: { $sum: '$assistantManagers' },
          totalManagers: { $sum: '$managers' },
          totalZonalHeads: { $sum: '$zonalHeads' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const totalUsers = await User.countDocuments();
    const activeMembers = await User.countDocuments({ mlmLevel: { $ne: "Active Member" } });

    res.json({
      success: true,
      data: {
        levelStats: stats,
        totalUsers,
        activeMembers,
        summary: {
          totalTeamLeaders: stats.find(s => s._id === "Team Leader")?.count || 0,
          totalAssistantManagers: stats.find(s => s._id === "Assistant Manager")?.count || 0,
          totalManagers: stats.find(s => s._id === "Manager")?.count || 0,
          totalZonalHeads: stats.find(s => s._id === "Zonal Head")?.count || 0,
          totalNationalHeads: stats.find(s => s._id === "National Head Promoter")?.count || 0
        }
      }
    });
  } catch (error) {
    console.error('Error getting MLM stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting MLM stats',
      error: error.message
    });
  }
};