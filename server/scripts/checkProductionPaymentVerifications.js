import mongoose from 'mongoose';
import PaymentVerification from '../models/PaymentVerification.js';
import Purchase from '../models/Purchase.js';
import { config } from 'dotenv';

config();

// Connect to production database
const connectToProduction = async () => {
  try {
    console.log('🔌 Connecting to Production Database...');
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    
    const productionUri = process.env.MONGO_URI_PROD;
    if (!productionUri) {
      throw new Error('Production MongoDB URI not found');
    }
    
    console.log(`🔗 Using Production Database`);
    
    await mongoose.connect(productionUri, {
      maxPoolSize: 1,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      bufferCommands: true,
      retryWrites: true,
      w: "majority",
    });
    
    console.log('✅ Connected to Production MongoDB');
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to production database:', error.message);
    return false;
  }
};

const checkProductionPaymentVerifications = async () => {
  try {
    const connected = await connectToProduction();
    if (!connected) {
      console.log('❌ Cannot proceed without production database connection');
      return;
    }

    console.log('\n🔍 Checking Production Payment Verifications...\n');

    // Check total count
    const totalCount = await PaymentVerification.countDocuments();
    console.log(`📊 Total payment verifications: ${totalCount}`);

    // Check by status
    const pendingCount = await PaymentVerification.countDocuments({ status: 'pending' });
    const verifiedCount = await PaymentVerification.countDocuments({ status: 'verified' });
    const rejectedCount = await PaymentVerification.countDocuments({ status: 'rejected' });

    console.log(`⏳ Pending: ${pendingCount}`);
    console.log(`✅ Verified: ${verifiedCount}`);
    console.log(`❌ Rejected: ${rejectedCount}`);

    // Get verified verifications without purchase IDs
    const verifiedWithoutPurchaseIds = await PaymentVerification.find({
      status: 'verified',
      $or: [
        { purchaseId: { $exists: false } },
        { purchaseId: null },
        { purchaseId: '' }
      ]
    }).sort({ verifiedAt: -1 });

    console.log(`\n🚨 Verified payments WITHOUT purchase IDs: ${verifiedWithoutPurchaseIds.length}`);

    if (verifiedWithoutPurchaseIds.length > 0) {
      console.log('\n📋 Details of verified payments without purchase IDs:');
      verifiedWithoutPurchaseIds.forEach((verification, index) => {
        console.log(`${index + 1}. ${verification.userId} - ${verification.packageName} (₹${verification.packagePrice})`);
        console.log(`   Transaction ID: ${verification.transactionId}`);
        console.log(`   Verified: ${verification.verifiedAt}`);
        console.log(`   Purchase ID: ${verification.purchaseId || 'MISSING'}`);
        console.log('');
      });
    }

    // Get all verified verifications
    const allVerified = await PaymentVerification.find({
      status: 'verified'
    }).sort({ verifiedAt: -1 }).limit(10);

    console.log(`\n📋 Recent verified payments (last 10):`);
    allVerified.forEach((verification, index) => {
      console.log(`${index + 1}. ${verification.userId} - ${verification.packageName} (₹${verification.packagePrice})`);
      console.log(`   Transaction ID: ${verification.transactionId}`);
      console.log(`   Purchase ID: ${verification.purchaseId || 'MISSING'}`);
      console.log(`   Verified: ${verification.verifiedAt}`);
      console.log('');
    });

    // Check purchase records
    const totalPurchases = await Purchase.countDocuments();
    console.log(`\n📦 Total purchase records: ${totalPurchases}`);

    if (verifiedWithoutPurchaseIds.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      console.log('1. These verified payments need purchase IDs and commission distribution');
      console.log('2. Run the fix script to create missing purchase records');
      console.log('3. Check why commission distribution failed during verification');
      console.log('='.repeat(80));
    } else {
      console.log('\n✅ All verified payments have purchase IDs!');
    }

  } catch (error) {
    console.error('❌ Error checking production payment verifications:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from Production MongoDB');
  }
};

// Run the script
checkProductionPaymentVerifications();
