import mongoose from "mongoose";
import dns from "node:dns";
import "dotenv/config";

let isConnected = false;
let connectionPromise = null;

// Public resolvers, used only when Node cannot resolve the Atlas SRV record itself
const FALLBACK_DNS_SERVERS = ["8.8.8.8", "1.1.1.1"];

const isSrvLookupError = (error) =>
  error?.syscall === "querySrv" || /querySrv/.test(error?.message || "");

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

      const connect = () =>
        mongoose.connect(mongoUri, {
          // Serverless-friendly options
          maxPoolSize: 1, // Reduce pool size for serverless
          serverSelectionTimeoutMS: 10000, // Increased timeout
          socketTimeoutMS: 45000, // Timeout for socket operations
          bufferCommands: true, // Enable buffering for serverless
          retryWrites: true,
          w: "majority",
        });

      let conn;
      try {
        conn = await connect();
      } catch (error) {
        if (!isSrvLookupError(error)) throw error;

        // Node sometimes misreads the system DNS servers (seen on Windows: falls back to 127.0.0.1)
        console.warn(
          `⚠️ SRV lookup failed (${error.message}). Retrying with public DNS...`
        );
        dns.setServers(FALLBACK_DNS_SERVERS);
        conn = await connect();
      }

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
