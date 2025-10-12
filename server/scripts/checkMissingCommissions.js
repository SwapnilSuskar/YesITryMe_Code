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

const checkMissingCommissions = async () => {
  try {
    console.log('🔍 Checking for Missing Commissions...\n');

    // Get all purchases
    const allPurchases = await Purchase.find({}).sort({ createdAt: -1 });
    console.log(`📊 Found ${allPurchases.length} total purchases\n`);

    let purchasesWithCommissions = 0;
    let purchasesWithoutCommissions = 0;
    let missingCommissions = [];

    for (const purchase of allPurchases) {
      console.log(`\n🔍 Checking Purchase: ${purchase.purchaseId}`);
      console.log(`📦 Package: ${purchase.packageName} (₹${purchase.packagePrice})`);
      console.log(`👤 Purchaser: ${purchase.purchaserName} (${purchase.purchaserId})`);

      // Check if purchase has commission distributions
      if (purchase.commissionDistributions && purchase.commissionDistributions.length > 0) {
        purchasesWithCommissions++;
        console.log(`✅ Has commission distributions: ${purchase.commissionDistributions.length}`);
        
        // Check if all distributions are completed
        const completedDistributions = purchase.commissionDistributions.filter(d => d.status === 'distributed');
        const pendingDistributions = purchase.commissionDistributions.filter(d => d.status !== 'distributed');
        
        console.log(`   - Completed: ${completedDistributions.length}`);
        console.log(`   - Pending: ${pendingDistributions.length}`);
        
        if (pendingDistributions.length > 0) {
          missingCommissions.push({
            purchaseId: purchase.purchaseId,
            type: 'pending',
            pendingCount: pendingDistributions.length,
            purchase: purchase
          });
        }
      } else {
        purchasesWithoutCommissions++;
        console.log(`❌ No commission distributions found`);
        
        // Check if this purchase should have commissions
        const purchaser = await User.findOne({ userId: purchase.purchaserId });
        if (purchaser && purchaser.sponsorId) {
          console.log(`⚠️ Purchase has sponsor but no commission distributions`);
          missingCommissions.push({
            purchaseId: purchase.purchaseId,
            type: 'missing',
            purchase: purchase
          });
        } else {
          console.log(`ℹ️ Purchase has no sponsor (root user)`);
        }
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 MISSING COMMISSIONS ANALYSIS');
    console.log('='.repeat(80));
    console.log(`📦 Total purchases: ${allPurchases.length}`);
    console.log(`✅ Purchases with commissions: ${purchasesWithCommissions}`);
    console.log(`❌ Purchases without commissions: ${purchasesWithoutCommissions}`);
    console.log(`⚠️ Purchases with missing commissions: ${missingCommissions.length}`);
    console.log('='.repeat(80));

    if (missingCommissions.length > 0) {
      console.log('\n🔍 DETAILED ANALYSIS OF MISSING COMMISSIONS:');
      console.log('='.repeat(80));
      
      for (const missing of missingCommissions) {
        console.log(`\n📦 Purchase: ${missing.purchaseId}`);
        console.log(`📦 Package: ${missing.purchase.packageName} (₹${missing.purchase.packagePrice})`);
        console.log(`👤 Purchaser: ${missing.purchase.purchaserName} (${missing.purchase.purchaserId})`);
        console.log(`📅 Date: ${missing.purchase.createdAt}`);
        
        if (missing.type === 'pending') {
          console.log(`⚠️ Type: Pending distributions (${missing.pendingCount} pending)`);
        } else {
          console.log(`❌ Type: Missing commission distributions entirely`);
        }

        // Get sponsor genealogy
        const sponsors = await referralService.getSponsorGenealogy(missing.purchase.purchaserId);
        console.log(`👥 Sponsors in genealogy: ${sponsors.length}`);
        
        if (sponsors.length > 0) {
          sponsors.forEach((sponsor, index) => {
            console.log(`   Level ${sponsor.level}: ${sponsor.firstName} ${sponsor.lastName} (${sponsor.userId})`);
          });

          // Calculate expected commissions
          const expectedDistributions = await referralService.calculateCommissionDistribution(
            missing.purchase.packageName,
            missing.purchase.packagePrice,
            sponsors
          );

          console.log(`💰 Expected commissions: ${expectedDistributions.length}`);
          const totalExpected = expectedDistributions.reduce((sum, dist) => sum + dist.amount, 0);
          console.log(`💰 Total expected amount: ₹${totalExpected.toLocaleString()}`);
          
          expectedDistributions.forEach(dist => {
            console.log(`   Level ${dist.level}: ₹${dist.amount} to ${dist.sponsorName}`);
          });
        } else {
          console.log(`ℹ️ No sponsors found (root user)`);
        }
      }

      console.log('\n' + '='.repeat(80));
      console.log('💡 RECOMMENDATIONS:');
      console.log('='.repeat(80));
      console.log('1. Run the retroactive commission distribution script');
      console.log('2. Check if any purchases were made before the commission system was implemented');
      console.log('3. Verify that all users have proper sponsor relationships');
      console.log('4. Ensure the commission structure is correctly configured');
      console.log('='.repeat(80));
    } else {
      console.log('\n✅ No missing commissions found! All purchases have proper commission distributions.');
    }

  } catch (error) {
    console.error('❌ Error checking missing commissions:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
};

// Run the script
checkMissingCommissions();
