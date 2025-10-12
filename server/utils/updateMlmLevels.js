import mongoose from 'mongoose';
import User from '../models/User.js';
import Purchase from '../models/Purchase.js';
import { calculateAndUpdateMLMLevel } from '../services/mlmService.js';

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

const updateMlmLevels = async () => {
  try {
    console.log('🔍 Starting MLM level update migration...');
    
    // Get all users
    const users = await User.find({});
    console.log(`📊 Found ${users.length} users to process`);
    
    let updatedCount = 0;
    let freeCount = 0;
    
    for (const user of users) {
      try {
        // Check if user has any completed purchases
        const purchases = await Purchase.find({
          purchaserId: user.userId,
          paymentStatus: 'completed'
        });
        
        const hasPurchases = purchases.length > 0;
        const currentLevel = user.mlmLevel;
        
        // If user has no purchases and is not already "free", update to "free"
        if (!hasPurchases && currentLevel !== "free") {
          await User.findByIdAndUpdate(user._id, {
            mlmLevel: "free",
            mlmLevelDate: new Date()
          });
          console.log(`✅ Updated user ${user.userId} (${user.firstName} ${user.lastName}) from "${currentLevel}" to "free"`);
          freeCount++;
        }
        
        // Recalculate MLM level for all users (this will handle the logic properly)
        const newLevel = await calculateAndUpdateMLMLevel(user.userId);
        if (newLevel && newLevel !== currentLevel) {
          console.log(`🔄 Updated user ${user.userId} MLM level: "${currentLevel}" → "${newLevel}"`);
          updatedCount++;
        }
        
      } catch (error) {
        console.error(`❌ Error processing user ${user.userId}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Migration completed!`);
    console.log(`📈 Users set to "free": ${freeCount}`);
    console.log(`🔄 Total level updates: ${updatedCount}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
  }
};

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  updateMlmLevels();
}

export default updateMlmLevels; 