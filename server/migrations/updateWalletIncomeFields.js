import mongoose from 'mongoose';
import Wallet from '../models/Wallet.js';
import dotenv from 'dotenv';

dotenv.config();

const updateWalletIncomeFields = async () => {
  try {
    console.log('Starting wallet income fields migration...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Get all wallets
    const wallets = await Wallet.find({});
    console.log(`Found ${wallets.length} wallets to update`);

    let updatedCount = 0;

    for (const wallet of wallets) {
      let activeIncome = 0;
      let passiveIncome = 0;

      // Calculate active and passive income from existing transactions
      if (wallet.transactions && wallet.transactions.length > 0) {
        wallet.transactions.forEach(transaction => {
          if (transaction.type === 'commission') {
            if (transaction.level === 1) {
              activeIncome += transaction.amount;
            } else if (transaction.level >= 2 && transaction.level <= 120) {
              passiveIncome += transaction.amount;
            }
          }
        });
      }

      // Update wallet with calculated values
      wallet.activeIncome = activeIncome;
      wallet.passiveIncome = passiveIncome;

      await wallet.save();
      updatedCount++;

      if (updatedCount % 100 === 0) {
        console.log(`Updated ${updatedCount} wallets...`);
      }
    }

    console.log(`Migration completed! Updated ${updatedCount} wallets`);
    console.log('Active and passive income fields have been populated based on transaction history');

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  updateWalletIncomeFields();
}

export default updateWalletIncomeFields; 