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

const createTestReferralChain = async () => {
  try {
    console.log('🔧 Creating Test Referral Chain...\n');

    // Create a 6-level referral chain for testing
    const testUsers = [
      { userId: 'TEST_LEVEL1', firstName: 'Test', lastName: 'Level1', mobile: '1111111111', email: 'level1@test.com', sponsorId: null },
      { userId: 'TEST_LEVEL2', firstName: 'Test', lastName: 'Level2', mobile: '2222222222', email: 'level2@test.com', sponsorId: 'TEST_LEVEL1' },
      { userId: 'TEST_LEVEL3', firstName: 'Test', lastName: 'Level3', mobile: '3333333333', email: 'level3@test.com', sponsorId: 'TEST_LEVEL2' },
      { userId: 'TEST_LEVEL4', firstName: 'Test', lastName: 'Level4', mobile: '4444444444', email: 'level4@test.com', sponsorId: 'TEST_LEVEL3' },
      { userId: 'TEST_LEVEL5', firstName: 'Test', lastName: 'Level5', mobile: '5555555555', email: 'level5@test.com', sponsorId: 'TEST_LEVEL4' },
      { userId: 'TEST_LEVEL6', firstName: 'Test', lastName: 'Level6', mobile: '6666666666', email: 'level6@test.com', sponsorId: 'TEST_LEVEL5' },
      { userId: 'TEST_BUYER', firstName: 'Test', lastName: 'Buyer', mobile: '7777777777', email: 'buyer@test.com', sponsorId: 'TEST_LEVEL6' }
    ];

    console.log('👥 Creating test users...');
    
    for (const userData of testUsers) {
      // Check if user already exists
      let user = await User.findOne({ userId: userData.userId });
      
      if (!user) {
        user = new User({
          userId: userData.userId,
          firstName: userData.firstName,
          lastName: userData.lastName,
          mobile: userData.mobile,
          email: userData.email,
          password: 'testpassword123',
          sponsorId: userData.sponsorId || 'ADMIN',
          sponsorName: userData.sponsorId ? `Test Sponsor ${userData.sponsorId}` : 'Admin',
          sponsorMobile: userData.sponsorId ? '9999999999' : '0000000000',
          referralCode: `REF${userData.userId}`,
          referralLink: `https://yesitryme.com/ref/${userData.userId}`,
          city: 'Test City',
          state: 'Test State',
          address: 'Test Address',
          status: 'active',
          mlmLevel: 'Active Member'
        });
        await user.save();
        console.log(`✅ Created user: ${userData.firstName} ${userData.lastName} (${userData.userId})`);
      } else {
        console.log(`ℹ️ User already exists: ${userData.firstName} ${userData.lastName} (${userData.userId})`);
      }
    }

    // Test the referral chain
    console.log('\n🔍 Testing referral chain...');
    const buyer = await User.findOne({ userId: 'TEST_BUYER' });
    if (buyer) {
      const sponsors = await referralService.getSponsorGenealogy(buyer.userId);
      console.log(`👥 Found ${sponsors.length} sponsors in genealogy:`);
      
      sponsors.forEach((sponsor, index) => {
        console.log(`   Level ${sponsor.level}: ${sponsor.firstName} ${sponsor.lastName} (${sponsor.userId})`);
      });

      // Test commission distribution
      console.log('\n💰 Testing commission distribution...');
      const testPackageName = "Pro Package";
      const testPackagePrice = 2000;
      
      const distributions = await referralService.calculateCommissionDistribution(
        testPackageName,
        testPackagePrice,
        sponsors
      );
      
      console.log(`📊 Commission distributions for ${testPackageName} (₹${testPackagePrice}):`);
      distributions.forEach(dist => {
        console.log(`   Level ${dist.level}: ₹${dist.amount} to ${dist.sponsorName} (${dist.sponsorId})`);
      });

      // Check if Level 6 gets commission
      const level6Distribution = distributions.find(d => d.level === 6);
      if (level6Distribution) {
        console.log(`\n🎯 Level 6 Commission Found: ₹${level6Distribution.amount} to ${level6Distribution.sponsorName}`);
        
        // Create wallets for all test users
        console.log('\n💳 Creating wallets for test users...');
        for (const userData of testUsers) {
          let wallet = await Wallet.findOne({ userId: userData.userId });
          if (!wallet) {
            wallet = new Wallet({
              userId: userData.userId,
              balance: 0,
              totalEarned: 0,
              activeIncome: 0,
              passiveIncome: 0
            });
            await wallet.save();
            console.log(`✅ Created wallet for ${userData.firstName} ${userData.lastName}`);
          }
        }

        // Simulate the commission distribution
        console.log('\n💰 Simulating commission distribution...');
        for (const distribution of distributions) {
          const wallet = await Wallet.findOne({ userId: distribution.sponsorId });
          if (wallet) {
            wallet.balance += distribution.amount;
            wallet.totalEarned += distribution.amount;
            
            if (distribution.level === 1) {
              wallet.activeIncome += distribution.amount;
            } else {
              wallet.passiveIncome += distribution.amount;
            }
            
            wallet.transactions.push({
              type: "commission",
              amount: distribution.amount,
              description: `Level ${distribution.level} commission from ${buyer.firstName} ${buyer.lastName}'s ${testPackageName} purchase`,
              packageName: testPackageName,
              purchaserId: buyer.userId,
              purchaserName: `${buyer.firstName} ${buyer.lastName}`,
              level: distribution.level,
              status: "completed",
            });
            
            await wallet.save();
            console.log(`✅ Added ₹${distribution.amount} to ${distribution.sponsorName}'s wallet (Level ${distribution.level})`);
          }
        }

        // Check Level 6 user's wallet
        const level6Wallet = await Wallet.findOne({ userId: 'TEST_LEVEL6' });
        if (level6Wallet) {
          console.log(`\n🎯 Level 6 User Wallet Summary:`);
          console.log(`   Balance: ₹${level6Wallet.balance}`);
          console.log(`   Passive Income: ₹${level6Wallet.passiveIncome}`);
          console.log(`   Total Earned: ₹${level6Wallet.totalEarned}`);
          
          const level6Transactions = level6Wallet.transactions.filter(t => t.level === 6);
          if (level6Transactions.length > 0) {
            console.log(`   Level 6 Transactions: ${level6Transactions.length}`);
            level6Transactions.forEach(t => {
              console.log(`     ₹${t.amount} - ${t.description}`);
            });
          }
        }

      } else {
        console.log(`\n❌ No Level 6 commission found in distributions`);
      }
    }

    console.log('\n✅ Test referral chain setup completed!');
    console.log('\n📝 Summary:');
    console.log('   - Created 7 test users in a 6-level referral chain');
    console.log('   - Tested commission distribution for Pro Package');
    console.log('   - Level 6 user should receive ₹20 commission');
    console.log('   - All commissions are distributed without MLM level restrictions');

  } catch (error) {
    console.error('❌ Error creating test referral chain:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
};

// Run the script
createTestReferralChain();
