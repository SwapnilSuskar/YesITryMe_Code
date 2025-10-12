import mongoose from 'mongoose';
import CoinWallet from '../models/Coin.js';
import dotenv from 'dotenv';

dotenv.config();

const updateActiveIncomeField = async () => {
  try {
    console.log('💰 Starting Active Income Field Migration...\n');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI_PROD || process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get all coin wallets
    const wallets = await CoinWallet.find({});
    console.log(`📊 Found ${wallets.length} coin wallets to update\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const wallet of wallets) {
      // Check if activeIncome field already exists
      if (wallet.activeIncome !== undefined) {
        console.log(`⏭️  Skipping wallet for user ${wallet.userId} - activeIncome field already exists`);
        skippedCount++;
        continue;
      }

      // Calculate active income from existing transactions
      let activeIncome = 0;
      if (wallet.transactions && wallet.transactions.length > 0) {
        wallet.transactions.forEach(transaction => {
          if (['view', 'like', 'comment', 'subscribe'].includes(transaction.type)) {
            activeIncome += transaction.amount;
          }
        });
      }

      // Update wallet with activeIncome field
      wallet.activeIncome = activeIncome;
      await wallet.save();
      
      updatedCount++;
      console.log(`✅ Updated wallet for user ${wallet.userId} - Active Income: ${activeIncome} coins`);

      if (updatedCount % 100 === 0) {
        console.log(`📈 Processed ${updatedCount} wallets...`);
      }
    }

    console.log('\n🎉 Migration completed!');
    console.log(`📈 Summary:`);
    console.log(`   ✅ Updated: ${updatedCount} wallets`);
    console.log(`   ⏭️  Skipped: ${skippedCount} wallets`);
    console.log(`   📊 Total processed: ${wallets.length} wallets`);
    
    console.log('\n💰 Active Income Tracking:');
    console.log(`   📝 Tracks earnings from: view, like, comment, subscribe tasks`);
    console.log(`   💸 Auto-payout: ₹10 (1000 coins) when active income reaches threshold`);
    console.log(`   📊 Withdrawal limit: ₹200 (20000 coins)`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  updateActiveIncomeField();
}

export default updateActiveIncomeField;
