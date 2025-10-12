import mongoose from 'mongoose';
import CoinWallet from '../models/Coin.js';
import dotenv from 'dotenv';

dotenv.config();

const updateCoinWalletActiveIncome = async () => {
  try {
    console.log('💰 Starting Coin Wallet Active Income Update...\n');
    
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
        console.log(`⏭️  Skipping wallet for user ${wallet.userId} - activeIncome already exists`);
        skippedCount++;
        continue;
      }

      // Calculate active income from existing transactions
      let activeIncome = 0;
      if (wallet.transactions && wallet.transactions.length > 0) {
        wallet.transactions.forEach(transaction => {
          // Add to active income for social earnings (view, like, comment, subscribe) >= 1000 coins (₹10)
          if (['view', 'like', 'comment', 'subscribe'].includes(transaction.type) && transaction.amount >= 1000) {
            activeIncome += transaction.amount;
          }
        });
      }

      // Update wallet with calculated active income
      wallet.activeIncome = activeIncome;
      await wallet.save();
      
      console.log(`✅ Updated wallet for user ${wallet.userId}: activeIncome = ${activeIncome} coins`);
      updatedCount++;
    }

    console.log('\n🎉 Migration completed!');
    console.log(`📈 Summary:`);
    console.log(`   ✅ Updated: ${updatedCount} wallets`);
    console.log(`   ⏭️  Skipped: ${skippedCount} wallets`);
    console.log(`   📊 Total processed: ${wallets.length} wallets`);
    
    console.log('\n💰 Active Income Tracking:');
    console.log(`   📱 Social earnings (view, like, comment, subscribe) >= ₹10 (1000 coins)`);
    console.log(`   💳 Automatically tracked in wallet transactions`);
    console.log(`   📊 Visible in user dashboard and wallet history`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  updateCoinWalletActiveIncome();
}

export default updateCoinWalletActiveIncome;
