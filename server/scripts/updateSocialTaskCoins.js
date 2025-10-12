import mongoose from 'mongoose';
import SocialTask from '../models/SocialTask.js';
import dotenv from 'dotenv';

dotenv.config();

// New coin rewards per action
const NEW_COIN_REWARDS = {
  view: 2,
  like: 3,
  comment: 4,
  subscribe: 5,
};

const updateSocialTaskCoins = async () => {
  try {
    console.log('🪙 Starting Social Task Coin Update Migration...\n');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI_PROD || process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get all active social tasks
    const tasks = await SocialTask.find({ isActive: true });
    console.log(`📊 Found ${tasks.length} active social tasks to update\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const task of tasks) {
      const newCoinAmount = NEW_COIN_REWARDS[task.action];
      
      if (newCoinAmount && task.coins !== newCoinAmount) {
        console.log(`🔄 Updating task: "${task.title}"`);
        console.log(`   Action: ${task.action}`);
        console.log(`   Old coins: ${task.coins} → New coins: ${newCoinAmount}`);
        
        task.coins = newCoinAmount;
        await task.save();
        
        updatedCount++;
        console.log(`   ✅ Updated successfully\n`);
      } else {
        console.log(`⏭️  Skipping task: "${task.title}" (${task.action}) - already has correct coin amount: ${task.coins}\n`);
        skippedCount++;
      }
    }

    console.log('🎉 Migration completed!');
    console.log(`📈 Summary:`);
    console.log(`   ✅ Updated: ${updatedCount} tasks`);
    console.log(`   ⏭️  Skipped: ${skippedCount} tasks`);
    console.log(`   📊 Total processed: ${tasks.length} tasks`);
    
    console.log('\n💰 New Coin Rewards:');
    console.log(`   👀 View: ${NEW_COIN_REWARDS.view} coins`);
    console.log(`   👍 Like: ${NEW_COIN_REWARDS.like} coins`);
    console.log(`   💬 Comment: ${NEW_COIN_REWARDS.comment} coins`);
    console.log(`   🔔 Subscribe: ${NEW_COIN_REWARDS.subscribe} coins`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  updateSocialTaskCoins();
}

export default updateSocialTaskCoins;
