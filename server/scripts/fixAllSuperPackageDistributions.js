const mongoose = require('mongoose');
const SuperPackage = require('../models/SuperPackage.js');

// Helper function to generate commission structure for ₹500 distribution
const generateCommissionStructure = () => {
  const structure = [];

  // Level 1: ₹250 (50%)
  structure.push({ level: 1, percentage: 50, amount: 250 });

  // Level 2: ₹100 (20%)
  structure.push({ level: 2, percentage: 20, amount: 100 });

  // Level 3: ₹50 (10%)
  structure.push({ level: 3, percentage: 10, amount: 50 });

  // Level 4: ₹10 (2%)
  structure.push({ level: 4, percentage: 2, amount: 10 });

  // Level 5: ₹10 (2%)
  structure.push({ level: 5, percentage: 2, amount: 10 });

  // Levels 6-20: ₹5 each (1% each) - 15 levels
  for (let i = 6; i <= 20; i++) {
    structure.push({ level: i, percentage: 1, amount: 5 });
  }

  // Levels 21-120: ₹0.05 each (0.01% each) - 100 levels
  for (let i = 21; i <= 120; i++) {
    structure.push({ level: i, percentage: 0.01, amount: 0.05 });
  }

  return structure;
};

async function fixAllSuperPackageDistributions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get all Super Packages
    const packages = await SuperPackage.find({});
    console.log(`\n📦 Found ${packages.length} Super Packages`);

    const correctStructure = generateCommissionStructure();
    const correctTotal = correctStructure.reduce((sum, level) => sum + level.amount, 0);
    
    console.log(`\n🔧 Correct Commission Structure (₹${correctTotal}):`);
    console.log('   Level 1: ₹250 (50%)');
    console.log('   Level 2: ₹100 (20%)');
    console.log('   Level 3: ₹50 (10%)');
    console.log('   Level 4: ₹10 (2%)');
    console.log('   Level 5: ₹10 (2%)');
    console.log('   Levels 6-20: ₹5 each (1%)');
    console.log('   Levels 21-120: ₹0.05 each (0.01%)');

    let fixedCount = 0;

    for (const pkg of packages) {
      console.log(`\n🏷️  Processing ${pkg.name} (₹${pkg.price})`);
      
      if (pkg.name === 'Booster Package') {
        console.log('   ⏭️  Skipping Booster Package (no commission structure)');
        continue;
      }

      const currentTotal = pkg.commissionStructure.reduce((sum, level) => sum + level.amount, 0);
      console.log(`   Current distribution: ₹${currentTotal}`);

      if (currentTotal !== 500) {
        console.log(`   🔧 Fixing distribution from ₹${currentTotal} to ₹500`);
        
        await SuperPackage.findOneAndUpdate(
          { _id: pkg._id },
          { 
            commissionStructure: correctStructure,
            updatedAt: new Date()
          }
        );
        
        fixedCount++;
        console.log(`   ✅ Fixed ${pkg.name}`);
      } else {
        console.log(`   ✅ ${pkg.name} already has correct distribution`);
      }
    }

    console.log(`\n🎉 Fix completed!`);
    console.log(`   Packages fixed: ${fixedCount}`);
    console.log(`   All packages now have ₹500 distribution`);

    // Verify all packages
    console.log('\n🔍 Verifying all packages...');
    const updatedPackages = await SuperPackage.find({});
    
    for (const pkg of updatedPackages) {
      if (pkg.name !== 'Booster Package') {
        const total = pkg.commissionStructure.reduce((sum, level) => sum + level.amount, 0);
        console.log(`   ${pkg.name}: ₹${total} ${total === 500 ? '✅' : '❌'}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error fixing Super Package distributions:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the fix
fixAllSuperPackageDistributions();
