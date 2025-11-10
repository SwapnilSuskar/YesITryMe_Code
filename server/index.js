import express from "express";
import "dotenv/config";
import connectDB, { getConnectionStatus } from "./config/db.js";
import cors from "cors";
import morgan from "morgan";
import authRoutes from "./routes/auth.js";
import contactRoutes from "./routes/contact.js";
import packageRoutes from "./routes/packages.js";
import adminRoutes from "./routes/admin.js";
import fundsRoutes from "./routes/funds.js";
import kycRoutes from "./routes/kyc.js";
import paymentRoutes from "./routes/payment.js";
import payoutRoutes from "./routes/payout.js";
import mlmRoutes from "./routes/mlm.js";
import specialIncomeRoutes from "./routes/specialIncome.js";
import productRoutes from "./routes/products.js";
import superPackageRoutes from "./routes/superPackages.js";
import notificationRoutes from "./routes/notifications.js";
import aiToolRoutes from "./routes/aiTools.js";
import socialRoutes from "./routes/social.js";
import coinsRoutes from "./routes/coins.js";
import nomineeRoutes from "./routes/nominee.js";
import rechargeRoutes from "./routes/recharge.js";
import walletTopUpRoutes from "./routes/walletTopUp.js";

const app = express();

// Memory optimization settings
app.set('trust proxy', 1);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://www.yesitryme.com",
    "https://yes-i-try-me-codebase-client.vercel.app",
    "https://yes-i-try-me-client-yesitrymes-projects.vercel.app",
    "https://yes-i-try-me-client.vercel.app",
    "https://i-try-me-codebase-server.vercel.app",
    "https://yes-i-try-me-code.vercel.app",
    "https://yes-i-try-me-client-git-main-yesitrymes-projects.vercel.app",
    "https://yes-i-try-me-client-h1kdqb7le-yesitrymes-projects.vercel.app",
    "https://yes-i-try-me-code-git-main-yesitrymes-projects.vercel.app",
    "https://yes-i-try-me-code-73nawtz6c-yesitrymes-projects.vercel.app",
    "https://yes-i-try-me-client-i3i3ect8d-yesitrymes-projects.vercel.app",
  ],
  credentials: true, // Allow credentials for authentication
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
};

// Middleware
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('/{*splat}', cors(corsOptions), (req, res) => {
  res.status(200).end();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Memory monitoring middleware (development only)
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    const startMemory = process.memoryUsage();
    res.on('finish', () => {
      const endMemory = process.memoryUsage();
      const memoryDiff = {
        rss: endMemory.rss - startMemory.rss,
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        heapTotal: endMemory.heapTotal - startMemory.heapTotal,
        external: endMemory.external - startMemory.external
      };
      
      if (Math.abs(memoryDiff.heapUsed) > 10 * 1024 * 1024) { // 10MB threshold
        console.log(`⚠️  High memory usage on ${req.method} ${req.path}:`, {
          heapUsed: `${Math.round(memoryDiff.heapUsed / 1024 / 1024)}MB`,
          rss: `${Math.round(memoryDiff.rss / 1024 / 1024)}MB`
        });
      }
    });
    next();
  });
}

// Database connection middleware for serverless
app.use(async (req, res, next) => {
  try {
    // Skip database check for health and test routes
    if (
      req.path === "/health" ||
      req.path === "/test" ||
      req.path === "/db-test" ||
      req.path === "/"
    ) {
      return next();
    }

    // Ensure database is connected
    const connectionStatus = getConnectionStatus();
    if (connectionStatus.readyState !== 1) {
      console.log("🔄 Database not connected, attempting connection...");
      await connectDB();
    }
    next();
  } catch (error) {
    console.error("❌ Database connection middleware error:", error);
    res.status(500).json({
      message: "Database connection failed",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

// Basic route
app.get("/", (req, res) => {
  const connection = getConnectionStatus();
  res.json({
    message: "YesITryMe API is running",
    status: "success",
    database: {
      status: connection.readyStateText,
      readyState: connection.readyState,
      isConnected: connection.isConnected,
    },
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    nodeVersion: process.version,
  });
});

// Test route for debugging
app.get("/test", (req, res) => {
  res.json({
    message: "Test route working",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
});

// Database test route
app.get("/db-test", async (req, res) => {
  try {
    const connectionStatus = getConnectionStatus();
    console.log("Current connection status:", connectionStatus);

    if (connectionStatus.readyState === 1) {
      res.json({
        status: "success",
        message: "Database is connected",
        connectionStatus,
        timestamp: new Date().toISOString(),
      });
    } else {
      // Try to connect
      console.log("Attempting to connect to database...");
      await connectDB();
      const newStatus = getConnectionStatus();

      res.json({
        status: newStatus.readyState === 1 ? "success" : "error",
        message:
          newStatus.readyState === 1
            ? "Database connected successfully"
            : "Failed to connect to database",
        connectionStatus: newStatus,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Database test failed",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Health check route
app.get("/health", (req, res) => {
  const connectionStatus = getConnectionStatus();
  res.json({
    status: "healthy",
    database: connectionStatus.readyStateText,
    databaseReadyState: connectionStatus.readyState,
    isConnected: connectionStatus.isConnected,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Register routes
app.use("/api/auth", authRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/funds", fundsRoutes);
app.use("/api/kyc", kycRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/payout", payoutRoutes);
app.use("/api/mlm", mlmRoutes);
app.use("/api/special-income", specialIncomeRoutes);
app.use("/api/products", productRoutes);
app.use("/api/super-packages", superPackageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/ai-tools", aiToolRoutes);
app.use("/api/social", socialRoutes);
app.use("/api/coins", coinsRoutes);
app.use("/api/nominee", nomineeRoutes);
app.use("/api/recharge", rechargeRoutes);
app.use("/api/wallet-topup", walletTopUpRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Connect to database on app initialization
connectDB().catch((error) => {
  console.error("Failed to connect to database:", error);
  // Don't crash the app in production/serverless
  if (process.env.NODE_ENV !== "production") {
    process.exit(1);
  }
});

// For Vercel serverless functions, export the app
export default app;

// For local development, start the server
if (process.env.NODE_ENV !== "production") {
  const startServer = async () => {
    try {
      // Start server
      const PORT = process.env.PORT || 5000;
      app.listen(PORT, () => {
        console.log(`🚀 Server is running on port ${PORT}`);
        console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
        console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      });
    } catch (error) {
      console.error("❌ Failed to start server:", error);
      process.exit(1);
    }
  };

  startServer();
}