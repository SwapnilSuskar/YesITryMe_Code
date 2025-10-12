import mongoose from "mongoose";
import PaymentVerification from "../models/PaymentVerification.js";
import User from "../models/User.js";
import Purchase from "../models/Purchase.js";
import referralService from "../services/referralService.js";
import { config } from "dotenv";

config();

// Connect to production database
const connectToProduction = async () => {
  try {
    console.log("🔌 Connecting to Production Database...");

    const productionUri = process.env.MONGO_URI_PROD;
    if (!productionUri) {
      throw new Error("Production MongoDB URI not found");
    }

    console.log(`🔗 Using Production Database`);

    await mongoose.connect(productionUri, {
      maxPoolSize: 1,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      bufferCommands: true,
      retryWrites: true,
      w: "majority",
    });

    console.log("✅ Connected to Production MongoDB");
    return true;
  } catch (error) {
    console.error(
      "❌ Failed to connect to production database:",
      error.message
    );
    return false;
  }
};

const fixProductionMissingPurchaseIds = async () => {
  try {
    const connected = await connectToProduction();
    if (!connected) {
      console.log("❌ Cannot proceed without production database connection");
      return;
    }

    console.log("🔧 Starting Fix for Missing Purchase IDs in Production...\n");

    // Find all verified payment verifications that don't have purchase IDs
    const verificationsWithoutPurchaseIds = await PaymentVerification.find({
      status: "verified",
      $or: [
        { purchaseId: { $exists: false } },
        { purchaseId: null },
        { purchaseId: "" },
      ],
    }).sort({ verifiedAt: -1 });

    console.log(
      `📊 Found ${verificationsWithoutPurchaseIds.length} verified payments without purchase IDs\n`
    );

    if (verificationsWithoutPurchaseIds.length === 0) {
      console.log(
        "✅ No verifications found without purchase IDs. All are properly processed!"
      );
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const verification of verificationsWithoutPurchaseIds) {
      try {
        console.log(
          `\n🔍 Processing verification for user: ${verification.userId}`
        );
        console.log(
          `📦 Package: ${verification.packageName} (₹${verification.packagePrice})`
        );
        console.log(`📅 Verified: ${verification.verifiedAt}`);
        console.log(`🆔 Transaction ID: ${verification.transactionId}`);

        // Check if user exists
        const user = await User.findOne({ userId: verification.userId });
        if (!user) {
          console.log(`❌ User ${verification.userId} not found, skipping...`);
          errorCount++;
          continue;
        }

        // Check if purchase already exists for this user and package
        const existingPurchase = await Purchase.findOne({
          purchaserId: verification.userId,
          packageName: verification.packageName,
          packagePrice: verification.packagePrice,
        });

        if (existingPurchase) {
          console.log(
            `✅ Purchase already exists: ${existingPurchase.purchaseId}`
          );
          // Update verification with existing purchase ID
          verification.purchaseId = existingPurchase.purchaseId;
          verification.purchaseRecord = existingPurchase._id;
          await verification.save();
          console.log(`✅ Updated verification with existing purchase ID`);
          successCount++;
          continue;
        }

        // Process purchase and commission distribution
        console.log(`💰 Processing purchase and commission distribution...`);

        // Convert payment method to a valid format
        let paymentMethod = verification.paymentMethod;
        if (paymentMethod.toLowerCase().includes("google pay")) {
          paymentMethod = "google_pay";
        } else if (paymentMethod.toLowerCase().includes("phonepe")) {
          paymentMethod = "phonepe";
        } else if (paymentMethod.toLowerCase().includes("paytm")) {
          paymentMethod = "paytm";
        } else if (paymentMethod.toLowerCase().includes("amazon pay")) {
          paymentMethod = "amazon_pay";
        } else if (paymentMethod.toLowerCase().includes("net banking")) {
          paymentMethod = "net_banking";
        } else if (paymentMethod.toLowerCase().includes("credit card")) {
          paymentMethod = "credit_card";
        } else if (paymentMethod.toLowerCase().includes("debit card")) {
          paymentMethod = "debit_card";
        } else if (paymentMethod.toLowerCase().includes("upi")) {
          paymentMethod = "upi";
        } else if (paymentMethod.toLowerCase().includes("bank transfer")) {
          paymentMethod = "bank_transfer";
        } else if (paymentMethod.toLowerCase().includes("online")) {
          paymentMethod = "online";
        } else if (paymentMethod.toLowerCase().includes("cash")) {
          paymentMethod = "cash";
        }
        const purchaseData = {
          purchaserId: verification.userId,
          packageId: verification.packageId,
          packageName: verification.packageName,
          packagePrice: verification.packagePrice,
          paymentMethod: paymentMethod,
        };

        const result = await referralService.processPackagePurchase(
          purchaseData
        );

        // Update verification record with purchase reference
        verification.purchaseId = result.purchaseId;
        verification.purchaseRecord = result.purchaseObjectId;
        await verification.save();

        console.log(`✅ Successfully created purchase: ${result.purchaseId}`);
        console.log(
          `💰 Commission distributed: ₹${result.totalCommissionDistributed}`
        );
        console.log(`👥 Distributions: ${result.distributions.length}`);

        successCount++;
      } catch (error) {
        console.error(
          `❌ Error processing verification for ${verification.userId}:`,
          error.message
        );
        errorCount++;
      }
    }

    console.log("\n" + "=".repeat(80));
    console.log("📊 PRODUCTION FIX SUMMARY");
    console.log("=".repeat(80));
    console.log(`✅ Successfully processed: ${successCount}`);
    console.log(`❌ Errors encountered: ${errorCount}`);
    console.log(
      `📦 Total verifications processed: ${verificationsWithoutPurchaseIds.length}`
    );
    console.log("=".repeat(80));

    // Show some examples of fixed verifications
    if (successCount > 0) {
      console.log("\n🎯 Examples of fixed verifications:");
      const fixedVerifications = await PaymentVerification.find({
        status: "verified",
        purchaseId: { $exists: true, $ne: null, $ne: "" },
      })
        .sort({ updatedAt: -1 })
        .limit(5);

      for (const verification of fixedVerifications) {
        console.log(
          `👤 ${verification.userId}: ${verification.packageName} - Purchase ID: ${verification.purchaseId}`
        );
      }
    }
  } catch (error) {
    console.error("❌ Error in fix production missing purchase IDs:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Disconnected from Production MongoDB");
  }
};

// Run the script
fixProductionMissingPurchaseIds();
