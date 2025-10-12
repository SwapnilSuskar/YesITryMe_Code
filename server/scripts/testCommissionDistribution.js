import mongoose from 'mongoose';
import User from '../models/User.js';
import Wallet from '../models/Wallet.js';
import referralService from '../services/referralService.js';
import { config } from 'dotenv';

config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const testCommissionDistribution = async () => {
  try {
    console.log('🧪 Testing Commission Distribution...\n');

    // Test commission structure for different packages
    const testPackages = [
      { name: "Elite Package", price: 2000 },
      { name: "Super Prime Package", price: 1000 },
      { name: "Prime Package", price: 500 }
    ];

    for (const testPackage of testPackages) {
      console.log(`\n📦 Testing ${testPackage.name} (₹${testPackage.price})`);
      
      // Get commission structure
      const commissionStructure = await referralService.getCommissionStructure(testPackage.name);
      console.log(`💰 Commission Structure:`);
      
      // Show first 10 levels
      commissionStructure.slice(0, 10).forEach(level => {
        console.log(`   Level ${level.level}: ${level.percentage}% = ₹${level.amount}`);
      });
      
      if (commissionStructure.length > 10) {
        console.log(`   ... and ${commissionStructure.length - 10} more levels`);
      }
    }

    // Test sponsor genealogy for a specific user
    console.log('\n🔍 Testing Sponsor Genealogy...');
    
    // Get a random user to test with
    const testUser = await User.findOne({});
    if (testUser) {
      console.log(`👤 Testing with user: ${testUser.firstName} ${testUser.lastName} (${testUser.userId})`);
      
      const sponsors = await referralService.getSponsorGenealogy(testUser.userId);
      console.log(`👥 Found ${sponsors.length} sponsors in genealogy:`);
      
      sponsors.forEach((sponsor, index) => {
        console.log(`   Level ${sponsor.level}: ${sponsor.firstName} ${sponsor.lastName} (${sponsor.userId})`);
      });

      // Test commission distribution calculation
      if (sponsors.length > 0) {
        console.log('\n💰 Testing Commission Distribution Calculation...');
        
        const testPackageName = "Elite Package";
        const distributions = await referralService.calculateCommissionDistribution(
          testPackageName,
          2000,
          sponsors
        );
        
        console.log(`📊 Commission distributions for ${testPackageName}:`);
        distributions.forEach(dist => {
          console.log(`   Level ${dist.level}: ₹${dist.amount} to ${dist.sponsorName} (${dist.sponsorId})`);
        });
        
        const totalCommission = distributions.reduce((sum, dist) => sum + dist.amount, 0);
        console.log(`\n💵 Total Commission to Distribute: ₹${totalCommission}`);
      }
    }

    // Test wallet creation and commission addition
    console.log('\n💳 Testing Wallet Operations...');
    
    const testUserId = 'TEST_USER_123';
    
    // Create or find wallet
    let wallet = await Wallet.findOne({ userId: testUserId });
    if (!wallet) {
      wallet = new Wallet({
        userId: testUserId,
        balance: 0,
        totalEarned: 0,
        activeIncome: 0,
        passiveIncome: 0
      });
    }
    
    // Add test commission
    const testCommission = 100;
    wallet.balance += testCommission;
    wallet.totalEarned += testCommission;
    wallet.passiveIncome += testCommission; // Level 6 would be passive income
    
    wallet.transactions.push({
      type: "commission",
      amount: testCommission,
      description: `Test Level 6 commission from test purchase`,
      packageName: "Test Package",
      purchaserId: "TEST_PURCHASER",
      purchaserName: "Test Purchaser",
      level: 6,
      status: "completed",
    });
    
    await wallet.save();
    console.log(`✅ Test wallet updated: Balance: ₹${wallet.balance}, Passive Income: ₹${wallet.passiveIncome}`);
    
    // Clean up test data
    await Wallet.deleteOne({ userId: testUserId });
    console.log(`🧹 Cleaned up test wallet`);

  } catch (error) {
    console.error('❌ Error testing commission distribution:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
};

// Run the test script
testCommissionDistribution();
