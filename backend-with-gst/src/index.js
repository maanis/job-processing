require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");
const healthRoutes = require("./routes/healthRoutes");
const authRoutes = require("./routes/authRoutes");
const jobRoutes = require("./routes/jobRoutes");
const { setupStaticFiles } = require("./middleware/uploadMiddleware");

const app = express();

// Security Middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable if you're serving frontend
    crossOriginEmbedderPolicy: false,
  }),
);

// Logging Middleware
if (process.env.NODE_ENV === "production") {
  app.use(morgan("combined")); // Detailed logs in production
} else {
  app.use(morgan("dev")); // Concise logs in development
}

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes
app.use(limiter);

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 login attempts per 15 minutes
  message: "Too many login attempts, please try again later.",
});

// Middleware
app.use(express.json());

// CORS Configuration
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? [process.env.FRONTEND_URL] // Production: only allow specified frontend URL
    : [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8080",
      ]; // Development: allow common dev ports

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.includes(origin) ||
        process.env.NODE_ENV === "development"
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS: " + origin));
      }
    },
    credentials: true,
  }),
);

app.use(cookieParser());

// Setup static file serving for uploads
setupStaticFiles(app);

// Routes
app.use("/api", healthRoutes);
app.use("/api/auth", authLimiter, authRoutes); // Apply stricter rate limit to auth
app.use("/api/jobs", jobRoutes);
const adminRoutes = require("./routes/adminRoutes");
app.use("/api/admin", adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Connect to DB
connectDB();

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);

  // Signal PM2 that app is ready
  if (process.send) {
    process.send("ready");
  }
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  server.close(() => {
    console.log("HTTP server closed");

    // Close database connection
    const mongoose = require("mongoose");
    mongoose.connection.close(false, () => {
      console.log("MongoDB connection closed");
      process.exit(0);
    });
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  gracefulShutdown("uncaughtException");
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
