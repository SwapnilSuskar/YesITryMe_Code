import mongoose from "mongoose";
import "dotenv/config";

let isConnected = false;
let connectionPromise = null;

const connectDB = async () => {
  // If already connected, return existing connection
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log("✅ Using existing database connection");
    return mongoose.connection;
  }

  // If connection is in progress, wait for it
  if (connectionPromise) {
    console.log("⏳ Waiting for existing connection...");
    return connectionPromise;
  }

  // Create new connection promise
  connectionPromise = (async () => {
    try {
      const mongoUri = process.env.MONGO_URI_PROD || process.env.MONGO_URI;

      if (!mongoUri) {
        throw new Error("MongoDB URI not found in environment variables");
      }

      console.log("🔌 Attempting to connect to MongoDB...");

      const conn = await mongoose.connect(mongoUri, {
        // Serverless-friendly options
        maxPoolSize: 1, // Reduce pool size for serverless
        serverSelectionTimeoutMS: 10000, // Increased timeout
        socketTimeoutMS: 45000, // Timeout for socket operations
        bufferCommands: true, // Enable buffering for serverless
        retryWrites: true,
        w: "majority",
      });

      isConnected = true;
      console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}`);

      // Handle connection events
      mongoose.connection.on("error", (err) => {
        console.error("❌ MongoDB connection error:", err);
        isConnected = false;
        connectionPromise = null;
      });

      mongoose.connection.on("disconnected", () => {
        console.log("⚠️ MongoDB disconnected");
        isConnected = false;
        connectionPromise = null;
      });

      mongoose.connection.on("reconnected", () => {
        console.log("🔄 MongoDB reconnected");
        isConnected = true;
      });

      return conn;
    } catch (error) {
      console.error("❌ Database connection failed:", error.message);
      isConnected = false;
      connectionPromise = null;

      // Don't exit process in serverless environment
      if (process.env.NODE_ENV === "production") {
        console.error(
          "Database connection failed in production, but continuing..."
        );
        return null;
      } else {
        process.exit(1);
      }
    }
  })();

  return connectionPromise;
};

// Function to check connection status
export const getConnectionStatus = () => {
  return {
    isConnected,
    readyState: mongoose.connection.readyState,
    readyStateText: getReadyStateText(mongoose.connection.readyState),
  };
};

// Helper function to get readable connection state
const getReadyStateText = (state) => {
  switch (state) {
    case 0:
      return "disconnected";
    case 1:
      return "connected";
    case 2:
      return "connecting";
    case 3:
      return "disconnecting";
    default:
      return "unknown";
  }
};

export default connectDB;
