const mongoose = require('mongoose');
const SuperPackage = require('../models/SuperPackage.js');

async function checkAllSuperPackages() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    const packages = await SuperPackage.find({}).lean();
    console.log('\n📦 Current Super Packages:');
    
    let hasIssues = false;
    
    packages.forEach(pkg => {
      console.log(`\n🏷️  ${pkg.name} (₹${pkg.price})`);
      console.log(`   Commission Structure Length: ${pkg.commissionStructure.length}`);
      
      if (pkg.commissionStructure.length > 0) {
        const totalDistribution = pkg.commissionStructure.reduce((sum, level) => sum + level.amount, 0);
        console.log(`   Total Distribution: ₹${totalDistribution}`);
        
        if (totalDistribution !== 500) {
          console.log(`   ⚠️  ISSUE: Should be ₹500, but is ₹${totalDistribution}`);
          hasIssues = true;
        } else {
          console.log(`   ✅ Correct distribution: ₹${totalDistribution}`);
        }
        
        // Show first few levels
        console.log('   First 5 levels:');
        pkg.commissionStructure.slice(0, 5).forEach(level => {
          console.log(`     Level ${level.level}: ₹${level.amount} (${level.percentage}%)`);
        });
      } else {
        console.log('   No commission structure (Booster Package)');
      }
    });
    
    if (hasIssues) {
      console.log('\n⚠️  Some packages have incorrect distributions!');
      console.log('   Run the fix script to correct them.');
    } else {
      console.log('\n✅ All packages have correct distributions!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkAllSuperPackages();
