import mongoose from "mongoose";
import Package from "../models/Package.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables from server/.env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Level 1 direct income raised: Daimond 2000 -> 2500, Super Daimond 4000 -> 4500
const updates = [
  {
    name: "Daimond",
    description: "Daimond package with direct Level 1 income \u20B92500",
    commissionStructure: [{ level: 1, percentage: 83, amount: 2500 }]
  },
  {
    name: "Super Daimond",
    description: "Super Daimond package with direct Level 1 income \u20B94500",
    commissionStructure: [{ level: 1, percentage: 90, amount: 4500 }]
  }
];

const summarise = (pkg) => {
  const l1 = (pkg.commissionStructure || []).find((c) => c.level === 1);
  const total = (pkg.commissionStructure || []).reduce((s, c) => s + c.amount, 0);
  return `price=₹${pkg.price}  L1=₹${l1 ? l1.amount : 0} (${l1 ? l1.percentage : 0}%)  totalPool=₹${total}`;
};

async function updateDaimondCommission() {
  const MONGO_URI =
    process.env.MONGO_URI_PROD || process.env.MONGO_URI || process.env.MONGODB_URI || "";

  if (!MONGO_URI) {
    console.error("Missing MongoDB connection string. Set MONGO_URI_PROD or MONGO_URI in server/.env");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log(`Connected to ${mongoose.connection.name}\n`);

    for (const update of updates) {
      const before = await Package.findOne({ name: update.name });
      if (!before) {
        console.error(`SKIPPED: no package named "${update.name}"`);
        continue;
      }

      console.log(`${update.name}`);
      console.log(`  before: ${summarise(before)}`);

      const after = await Package.findOneAndUpdate(
        { name: update.name },
        {
          $set: {
            description: update.description,
            commissionStructure: update.commissionStructure
          }
        },
        { new: true }
      );

      console.log(`  after:  ${summarise(after)}\n`);
    }

    console.log("Done. Price and isActive were left untouched.");
    process.exit(0);
  } catch (err) {
    console.error("Error updating Daimond commission structure:", err);
    process.exit(1);
  }
}

updateDaimondCommission();
