import User from "../models/User.js";

// Generate a sequential user ID (ITM00000001, ITM00000002, ...)
export const generateUserId = async () => {
  try {
    // Find the user with the highest userId that matches ITM followed by digits
    const lastUser = await User.findOne({ userId: /^YITM\d+$/ })
      .sort({ userId: -1 })
      .collation({ locale: "en", numericOrdering: true });

    let nextNumber = 1;
    if (lastUser && lastUser.userId) {
      const match = lastUser.userId.match(/^YITM(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    // Pad the number to 8 digits with leading zeros
    const padded = String(nextNumber).padStart(8, "0");
    return `YITM${padded}`;
  } catch (error) {
    console.error("Error generating userId:", error);
    // Fallback: generate based on current timestamp
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `YITM${String(timestamp).slice(-6)}${String(random).padStart(
      2,
      "0"
    )}`;
  }
};
