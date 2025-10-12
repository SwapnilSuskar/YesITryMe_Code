import mongoose from "mongoose";
import Package from "../models/Package.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables from server/.env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../.env");
dotenv.config({ path: envPath });

const packages = [
  {
    name: "Prime Package",
    price: 799,
    description: "Buy prime package and get set of 50 ebook with id activation",
    isActive: true,
    commissionStructure: [
      { level: 1, percentage: 50, amount: 250 },
      { level: 2, percentage: 20, amount: 100 },
      { level: 3, percentage: 10, amount: 50 },
      { level: 4, percentage: 2, amount: 10 },
      { level: 5, percentage: 2, amount: 10 },
      ...Array.from({ length: 15 }, (_, i) => ({
        level: i + 6,
        percentage: 1,
        amount: 5
      })),
      ...Array.from({ length: 100 }, (_, i) => ({
        level: i + 21,
        percentage: 0.01,
        amount: 0.05
      }))
    ]
  },
  {
    name: "Super Prime Package",
    price: 1499,
    description: "Buy super prime package and get set of 100 ebook with id activation",
    isActive: true,
    commissionStructure: [
      { level: 1, percentage: 50, amount: 500 },
      { level: 2, percentage: 20, amount: 200 },
      { level: 3, percentage: 10, amount: 100 },
      { level: 4, percentage: 2, amount: 20 },
      { level: 5, percentage: 2, amount: 20 },
      ...Array.from({ length: 15 }, (_, i) => ({
        level: i + 6,
        percentage: 1,
        amount: 10
      })),
      ...Array.from({ length: 100 }, (_, i) => ({
        level: i + 21,
        percentage: 0.01,
        amount: 0.10
      }))
    ]
  },
  {
    name: "Daimond",
    price: 2999,
    description: "Daimond package with direct Level 1 income ₹2000",
    isActive: true,
    commissionStructure: [
      { level: 1, percentage: 67, amount: 2000 }
    ]
  },
  {
    name: "Super Daimond",
    price: 4999,
    description: "Super Daimond package with direct Level 1 income ₹4000",
    isActive: true,
    commissionStructure: [
      { level: 1, percentage: 80, amount: 4000 }
    ]
  },
  {
    name: "Elite Package",
    price: 2999,
    description: "Buy elite package and get set of 200 ebook with id activation",
    isActive: true,
    commissionStructure: [
      { level: 1, percentage: 50, amount: 1000 },
      { level: 2, percentage: 20, amount: 400 },
      { level: 3, percentage: 10, amount: 200 },
      { level: 4, percentage: 2, amount: 40 },
      { level: 5, percentage: 2, amount: 40 },
      ...Array.from({ length: 15 }, (_, i) => ({
        level: i + 6,
        percentage: 1,
        amount: 20
      })),
      ...Array.from({ length: 100 }, (_, i) => ({
        level: i + 21,
        percentage: 0.01,
        amount: 0.20
      }))
    ]
  }
];

async function insertPackages() {
  try {
    const MONGO_URI =
      process.env.MONGO_URI_PROD ||
      process.env.MONGO_URI ||
      process.env.MONGODB_URI ||
      "";

    if (!MONGO_URI) {
      console.error(
        "Missing MongoDB connection string. Please set MONGO_URI_PROD or MONGO_URI in server/.env"
      );
      process.exit(1);
    }

    await mongoose.connect(MONGO_URI);
        for (const pkg of packages) {
      await Package.findOneAndUpdate(
        { name: pkg.name },
        pkg,
        { upsert: true, new: true }
      );
      console.log(`Inserted/Updated: ${pkg.name}`);
    }
    console.log("All packages inserted/updated successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Error inserting packages:", err);
    process.exit(1);
  }
}

insertPackages(); 