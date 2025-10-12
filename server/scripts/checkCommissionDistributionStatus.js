import mongoose from 'mongoose';
import PaymentVerification from '../models/PaymentVerification.js';
import Purchase from '../models/Purchase.js';
import Wallet from '../models/Wallet.js';
import { config } from 'dotenv';

config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const checkCommissionDistributionStatus = async () => {
  try {
    console.log('🔍 Checking Commission Distribution Status...\n');

    // Get all verified payment verifications
    const verifiedVerifications = await PaymentVerification.find({
      status: 'verified'
    }).sort({ verifiedAt: -1 });

    console.log(`📊 Found ${verifiedVerifications.length} verified payment verifications\n`);

    let totalCommissionDistributed = 0;
    let missingCommissions = 0;
    let issues = [];

    for (const verification of verifiedVerifications) {
      console.log(`\n🔍 Checking verification for user: ${verification.userId}`);
      console.log(`📦 Package: ${verification.packageName} (₹${verification.packagePrice})`);
      console.log(`📅 Verified: ${verification.verifiedAt}`);
      console.log(`🆔 Purchase ID: ${verification.purchaseId || 'MISSING'}`);

      if (!verification.purchaseId) {
        console.log(`❌ NO PURCHASE ID - Commission distribution failed!`);
        missingCommissions++;
        issues.push({
          userId: verification.userId,
          issue: 'No Purchase ID',
          package: verification.packageName,
          amount: verification.packagePrice
        });
        continue;
      }

      // Check if purchase record exists
      const purchase = await Purchase.findOne({ purchaseId: verification.purchaseId });
      if (!purchase) {
        console.log(`❌ PURCHASE RECORD NOT FOUND - Commission distribution failed!`);
        missingCommissions++;
        issues.push({
          userId: verification.userId,
          issue: 'Purchase Record Not Found',
          package: verification.packageName,
          amount: verification.packagePrice,
          purchaseId: verification.purchaseId
        });
        continue;
      }

      console.log(`✅ Purchase record found`);
      console.log(`💰 Commission distributions: ${purchase.commissionDistributions?.length || 0}`);
      console.log(`💵 Total distributed: ₹${purchase.totalCommissionDistributed || 0}`);

      // Check if commissions were actually distributed to wallets
      const distributedCommissions = purchase.commissionDistributions?.filter(d => d.status === 'distributed') || [];
      const pendingCommissions = purchase.commissionDistributions?.filter(d => d.status === 'pending') || [];
      const failedCommissions = purchase.commissionDistributions?.filter(d => d.status === 'failed') || [];

      console.log(`✅ Distributed: ${distributedCommissions.length}`);
      console.log(`⏳ Pending: ${pendingCommissions.length}`);
      console.log(`❌ Failed: ${failedCommissions.length}`);

      if (pendingCommissions.length > 0 || failedCommissions.length > 0) {
        console.log(`⚠️ COMMISSION DISTRIBUTION ISSUES DETECTED!`);
        missingCommissions++;
        issues.push({
          userId: verification.userId,
          issue: 'Commission Distribution Issues',
          package: verification.packageName,
          amount: verification.packagePrice,
          purchaseId: verification.purchaseId,
          pending: pendingCommissions.length,
          failed: failedCommissions.length
        });
      } else {
        totalCommissionDistributed += purchase.totalCommissionDistributed || 0;
      }

      // Check if wallet transactions exist for this purchase
      const walletTransactions = await Wallet.aggregate([
        { $unwind: '$transactions' },
        { $match: { 'transactions.packageName': verification.packageName } },
        { $match: { 'transactions.purchaserId': verification.userId } }
      ]);

      console.log(`💳 Wallet transactions found: ${walletTransactions.length}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 COMMISSION DISTRIBUTION STATUS SUMMARY');
    console.log('='.repeat(80));
    console.log(`📦 Total verified payments: ${verifiedVerifications.length}`);
    console.log(`✅ Properly distributed: ${verifiedVerifications.length - missingCommissions}`);
    console.log(`❌ Issues found: ${missingCommissions}`);
    console.log(`💰 Total commission distributed: ₹${totalCommissionDistributed.toLocaleString()}`);
    console.log('='.repeat(80));

    if (issues.length > 0) {
      console.log('\n🚨 ISSUES FOUND:');
      console.log('='.repeat(80));
      issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.userId} - ${issue.package} (₹${issue.amount})`);
        console.log(`   Issue: ${issue.issue}`);
        if (issue.purchaseId) console.log(`   Purchase ID: ${issue.purchaseId}`);
        if (issue.pending) console.log(`   Pending: ${issue.pending}`);
        if (issue.failed) console.log(`   Failed: ${issue.failed}`);
        console.log('');
      });

      console.log('💡 RECOMMENDATIONS:');
      console.log('1. Run the fix script for missing purchase IDs');
      console.log('2. Check the commission distribution logic');
      console.log('3. Verify wallet transactions for affected users');
      console.log('='.repeat(80));
    } else {
      console.log('\n✅ All commission distributions are working correctly!');
    }

  } catch (error) {
    console.error('❌ Error checking commission distribution status:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
};

// Run the script
checkCommissionDistributionStatus();
