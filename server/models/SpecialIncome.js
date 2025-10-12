import mongoose from "mongoose";

const specialIncomeSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  leaderShipFund: { type: Number, default: 0 },
  royaltyIncome: { type: Number, default: 0 },
  rewardIncome: { type: Number, default: 0 },
});

export default mongoose.model("SpecialIncome", specialIncomeSchema);