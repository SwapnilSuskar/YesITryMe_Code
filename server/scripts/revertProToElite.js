import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Package from "../models/Package.js";
import Purchase from "../models/Purchase.js";
import PaymentVerification from "../models/PaymentVerification.js";
import Product from "../models/Product.js";
import ProductOrder from "../models/ProductOrder.js";
import Wallet from "../models/Wallet.js";

// Load environment variables from server/.env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Undoes renameEliteToPro: renames "Pro Package" back to "Elite Package" in the package itself and in every
// record that stores the package name. Price and commission are not touched.
//
// Dry run (shows counts only):  node scripts/revertProToElite.js
// Apply the rename:             node scripts/revertProToElite.js --apply
const OLD_NAME = "Pro Package";
const NEW_NAME = "Elite Package";
const NEW_DESCRIPTION = "Buy elite package and get set of 200 ebook with id activation";
const apply = process.argv.includes("--apply");

const targets = [
  { label: "purchases", model: Purchase, field: "packageName" },
  { label: "payment verifications", model: PaymentVerification, field: "packageName" },
  { label: "products", model: Product, field: "packageName" },
  { label: "product orders", model: ProductOrder, field: "packageName" },
  {
    label: "product order commission lines",
    model: ProductOrder,
    field: "commissionDistributions.$[line].packageName",
    filter: { "commissionDistributions.packageName": OLD_NAME },
    arrayFilters: [{ "line.packageName": OLD_NAME }]
  },
  { label: "wallet entries", model: Wallet, field: "packageName" }
];

async function revertProToElite() {
  const MONGO_URI =
    process.env.MONGO_URI_PROD || process.env.MONGO_URI || process.env.MONGODB_URI || "";

  if (!MONGO_URI) {
    console.error("Missing MongoDB connection string. Set MONGO_URI_PROD or MONGO_URI in server/.env");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log(`Connected to ${mongoose.connection.name}`);
    console.log(apply ? "Mode: APPLY (writing changes)\n" : "Mode: DRY RUN (no changes written)\n");

    const existingNew = await Package.findOne({ name: NEW_NAME });
    if (existingNew) {
      console.error(`STOPPED: a package named "${NEW_NAME}" already exists (${existingNew._id}).`);
      process.exit(1);
    }

    const pkg = await Package.findOne({ name: OLD_NAME });
    console.log(
      pkg
        ? `Package: "${OLD_NAME}" found (${pkg._id}, price ₹${pkg.price}, active=${pkg.isActive})`
        : `Package: no package named "${OLD_NAME}" — only linked records will be renamed`
    );

    if (apply && pkg) {
      await Package.updateOne(
        { _id: pkg._id },
        { $set: { name: NEW_NAME, description: NEW_DESCRIPTION } }
      );
      console.log(`  renamed to "${NEW_NAME}"`);
    }

    for (const target of targets) {
      const filter = target.filter || { [target.field]: OLD_NAME };
      const count = await target.model.countDocuments(filter);
      console.log(`${target.label}: ${count} record(s) named "${OLD_NAME}"`);

      if (apply && count > 0) {
        const options = target.arrayFilters ? { arrayFilters: target.arrayFilters } : {};
        const result = await target.model.updateMany(
          filter,
          { $set: { [target.field]: NEW_NAME } },
          options
        );
        console.log(`  updated ${result.modifiedCount}`);
      }
    }

    console.log(apply ? "\nDone." : "\nDry run finished. Re-run with --apply to write these changes.");
    process.exit(0);
  } catch (err) {
    console.error("Error renaming Pro Package back to Elite Package:", err);
    process.exit(1);
  }
}

revertProToElite();
