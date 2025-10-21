import mongoose from 'mongoose';
import SuperPackage from '../models/SuperPackage.js';

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

async function fixGoldPackageDistribution() {
  try {
    // Connect to MongoDB
    await mongoose.connect("mongodb+srv://yesitrymeofficial:ye4N4M4WAK1jSS7Q@yesitryme.pj5wr7t.mongodb.net/YesITryMe?retryWrites=true&w=majority&appName=YesITryMe");
    console.log('✅ Connected to MongoDB');

    // Find the Gold package
    const goldPackage = await SuperPackage.findOne({ name: 'Gold' });
    
    if (!goldPackage) {
      console.log('❌ Gold package not found');
      return;
    }

    console.log(`\n🏷️  Current Gold Package (₹${goldPackage.price}):`);
    console.log(`   Commission Structure Length: ${goldPackage.commissionStructure.length}`);
    
    if (goldPackage.commissionStructure.length > 0) {
      const currentTotal = goldPackage.commissionStructure.reduce((sum, level) => sum + level.amount, 0);
      console.log(`   Current Total Distribution: ₹${currentTotal}`);
      
      // Show first few levels
      console.log('   Current first 5 levels:');
      goldPackage.commissionStructure.slice(0, 5).forEach(level => {
        console.log(`     Level ${level.level}: ₹${level.amount} (${level.percentage}%)`);
      });
    }

    // Generate correct commission structure (₹500)
    const correctStructure = generateCommissionStructure();
    const correctTotal = correctStructure.reduce((sum, level) => sum + level.amount, 0);
    
    console.log(`\n🔧 Correct Commission Structure (₹${correctTotal}):`);
    console.log('   First 5 levels:');
    correctStructure.slice(0, 5).forEach(level => {
      console.log(`     Level ${level.level}: ₹${level.amount} (${level.percentage}%)`);
    });

    // Update the Gold package with correct structure
    await SuperPackage.findOneAndUpdate(
      { name: 'Gold' },
      { 
        commissionStructure: correctStructure,
        updatedAt: new Date()
      }
    );

    console.log('\n✅ Gold package commission structure updated successfully!');
    console.log(`   New total distribution: ₹${correctTotal}`);

    // Verify the update
    const updatedGoldPackage = await SuperPackage.findOne({ name: 'Gold' });
    const newTotal = updatedGoldPackage.commissionStructure.reduce((sum, level) => sum + level.amount, 0);
    console.log(`   Verified total: ₹${newTotal}`);

    console.log('\n🎉 Gold package distribution fixed!');
    
  } catch (error) {
    console.error('❌ Error fixing Gold package:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the fix
fixGoldPackageDistribution();
