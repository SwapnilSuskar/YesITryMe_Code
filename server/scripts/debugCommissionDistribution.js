import mongoose from 'mongoose';
import User from '../models/User.js';
import Purchase from '../models/Purchase.js';
import Wallet from '../models/Wallet.js';
import referralService from '../services/referralService.js';
import { config } from 'dotenv';

config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const debugCommissionDistribution = async () => {
  try {
    console.log('🔍 Debugging Commission Distribution...\n');

    // Get all purchases (not just recent ones)
    const recentPurchases = await Purchase.find({}).sort({ createdAt: -1 }).limit(10);

    console.log(`📊 Found ${recentPurchases.length} recent purchases\n`);

    for (const purchase of recentPurchases) {
      console.log(`\n🔍 Analyzing Purchase: ${purchase.purchaseId}`);
      console.log(`📦 Package: ${purchase.packageName} (₹${purchase.packagePrice})`);
      console.log(`👤 Purchaser: ${purchase.purchaserName} (${purchase.purchaserId})`);
      console.log(`📅 Date: ${purchase.createdAt}`);

      // Get sponsor genealogy
      const sponsors = await referralService.getSponsorGenealogy(purchase.purchaserId);
      console.log(`👥 Found ${sponsors.length} sponsors in genealogy:`);

      sponsors.forEach((sponsor, index) => {
        console.log(`   Level ${sponsor.level}: ${sponsor.firstName} ${sponsor.lastName} (${sponsor.userId})`);
      });

      // Check commission distributions
      console.log(`💰 Commission Distributions:`);
      if (purchase.commissionDistributions && purchase.commissionDistributions.length > 0) {
        purchase.commissionDistributions.forEach((dist) => {
          console.log(`   Level ${dist.level}: ₹${dist.amount} to ${dist.sponsorName} (${dist.sponsorId}) - Status: ${dist.status}`);
        });
      } else {
        console.log(`   ❌ No commission distributions found!`);
      }

      // Check if Level 6 exists and received commission
      const level6Sponsor = sponsors.find(s => s.level === 6);
      if (level6Sponsor) {
        console.log(`\n🎯 Level 6 Sponsor Found: ${level6Sponsor.firstName} ${level6Sponsor.lastName} (${level6Sponsor.userId})`);
        
        // Check their wallet
        const wallet = await Wallet.findOne({ userId: level6Sponsor.userId });
        if (wallet) {
          console.log(`   💰 Wallet Balance: ₹${wallet.balance}`);
          console.log(`   💰 Passive Income: ₹${wallet.passiveIncome}`);
          console.log(`   💰 Total Earned: ₹${wallet.totalEarned}`);
          
          // Check recent transactions
          const recentTransactions = wallet.transactions
            .filter(t => t.purchaserId === purchase.purchaserId)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          
          if (recentTransactions.length > 0) {
            console.log(`   📝 Recent transactions for this purchase:`);
            recentTransactions.forEach(t => {
              console.log(`      Level ${t.level}: ₹${t.amount} - ${t.description}`);
            });
          } else {
            console.log(`   ❌ No transactions found for this purchase!`);
          }
        } else {
          console.log(`   ❌ No wallet found for Level 6 sponsor!`);
        }
      } else {
        console.log(`\n❌ No Level 6 sponsor found in genealogy`);
      }

      console.log('\n' + '='.repeat(80));
    }

    // Check all users with Level 6 in their genealogy
    console.log('\n🔍 Checking all users who might be Level 6 sponsors...\n');
    
    const allUsers = await User.find({}).limit(100); // Limit to first 100 users for performance
    
    for (const user of allUsers) {
      // Get all users who have this user as their Level 6 sponsor
      const genealogy = await referralService.getSponsorGenealogy(user.userId);
      const level6Sponsors = genealogy.filter(s => s.level === 6);
      
      if (level6Sponsors.length > 0) {
        console.log(`👤 User ${user.firstName} ${user.lastName} (${user.userId}) has Level 6 sponsors:`);
        level6Sponsors.forEach(sponsor => {
          console.log(`   Level 6: ${sponsor.firstName} ${sponsor.lastName} (${sponsor.userId})`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error debugging commission distribution:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
};

// Run the debug script
debugCommissionDistribution();
