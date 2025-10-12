import mongoose from 'mongoose';
import PaymentVerification from '../models/PaymentVerification.js';
import { config } from 'dotenv';

config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const debugPaymentVerifications = async () => {
  try {
    console.log('🔍 Debugging Payment Verifications...\n');
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    console.log(`🔗 Database: ${process.env.MONGO_URI.includes('localhost') ? 'Local' : 'Production'}\n`);

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

    // Get all verifications
    const allVerifications = await PaymentVerification.find({}).sort({ createdAt: -1 }).limit(10);
    console.log(`\n📋 Recent verifications (last 10):`);
    
    if (allVerifications.length === 0) {
      console.log('❌ No payment verifications found in database');
    } else {
      allVerifications.forEach((verification, index) => {
        console.log(`${index + 1}. ${verification.userId} - ${verification.packageName} (₹${verification.packagePrice})`);
        console.log(`   Status: ${verification.status}`);
        console.log(`   Purchase ID: ${verification.purchaseId || 'MISSING'}`);
        console.log(`   Created: ${verification.createdAt}`);
        console.log(`   Verified: ${verification.verifiedAt || 'Not verified'}`);
        console.log('');
      });
    }

    // Check for specific users mentioned in the issue
    const specificUsers = ['PK', 'SD', 'BD'];
    console.log('🔍 Checking for specific users mentioned in the issue:');
    
    for (const userId of specificUsers) {
      const userVerifications = await PaymentVerification.find({
        $or: [
          { userId: userId },
          { 'user.firstName': { $regex: userId, $options: 'i' } },
          { 'user.lastName': { $regex: userId, $options: 'i' } }
        ]
      });
      
      console.log(`${userId}: ${userVerifications.length} verifications found`);
      userVerifications.forEach(verification => {
        console.log(`   - ${verification.userId} - ${verification.packageName} - ${verification.status}`);
      });
    }

    // Check database collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📚 Available collections:');
    collections.forEach(collection => {
      console.log(`   - ${collection.name}`);
    });

  } catch (error) {
    console.error('❌ Error debugging payment verifications:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
};

// Run the script
debugPaymentVerifications();
