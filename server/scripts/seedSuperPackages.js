import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SuperPackage from '../models/SuperPackage.js';

dotenv.config();

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

const superPackages = [
  {
    name: "Booster Package",
    price: 299,
    description: "Entry-level package with no commission distribution. Perfect for getting started with basic benefits.",
    isActive: true,
    commissionStructure: [] // No distribution for Booster Package
  },
  {
    name: "Bronze",
    price: 999,
    description: "Bronze level package with comprehensive 120-level commission structure. Start earning from your network.",
    isActive: true,
    commissionStructure: generateCommissionStructure()
  },
  {
    name: "Silver",
    price: 1199,
    description: "Silver level package with enhanced benefits and 120-level deep commission structure for maximum earnings.",
    isActive: true,
    commissionStructure: generateCommissionStructure()
  },
  {
    name: "Gold",
    price: 1499,
    description: "Gold level package with premium features and extensive 120-level commission distribution network.",
    isActive: true,
    commissionStructure: generateCommissionStructure()
  },
  {
    name: "Diamond",
    price: 1999,
    description: "Diamond level package with exclusive benefits and complete 120-level commission structure for top earners.",
    isActive: true,
    commissionStructure: generateCommissionStructure()
  }
];

const seedSuperPackages = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing super packages
    await SuperPackage.deleteMany({});
    console.log('🗑️  Cleared existing super packages');

    // Insert new super packages
    const createdPackages = await SuperPackage.insertMany(superPackages);
    console.log('✅ Created super packages:');
    
    createdPackages.forEach(pkg => {
      console.log(`   - ${pkg.name}: ₹${pkg.price} (${pkg.commissionStructure.length} commission levels)`);
    });

    console.log('\n🎉 Super Packages seeding completed successfully!');
    console.log(`📊 Total packages created: ${createdPackages.length}`);
    
    // Display commission structure for verification
    console.log('\n💰 Commission Structure (for non-Booster packages):');
    console.log('   Level 1 (Direct): ₹250 (50%)');
    console.log('   Level 2: ₹100 (20%)');
    console.log('   Level 3: ₹50 (10%)');
    console.log('   Level 4: ₹10 (2%)');
    console.log('   Level 5: ₹10 (2%)');
    console.log('   Levels 6-20: ₹5 each (1%)');
    console.log('   Levels 21-120: ₹0.05 each (0.01%)');
    console.log('   Total Distribution: ₹500');

  } catch (error) {
    console.error('❌ Error seeding super packages:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the seeding function
seedSuperPackages(); 
 