import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "./config/index.js";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import harvestRoutes from "./routes/harvest.js";
import rewardRoutes from "./routes/rewards.js";
import uploadRoutes from "./routes/upload.js";
import traceRoutes from "./routes/trace.js";
import educationRoutes from "./routes/education.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(cors({ origin: config.corsOrigins, credentials: true }));

// Rate limiting — general
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later" },
  })
);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts, please try again later" },
});

// Body parsing — reduced from 10MB to 1MB
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Health check
app.get("/api/health", (_, res) => {
  res.json({ status: "ok", service: "harvest-hero-api" });
});

// Routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/farm", harvestRoutes);
app.use("/api/rewards", rewardRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/trace", traceRoutes);
app.use("/api/education", educationRoutes);

// 404 handler — return JSON for API routes
app.use("/api", (_, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Global error handler
app.use(errorHandler);

// Graceful shutdown
let server: ReturnType<typeof express.application.listen> | null = null;

async function start() {
  await connectDB();
  server = app.listen(config.port, () => {
    console.log(`Harvest Hero API running on port ${config.port}`);
  });
}

function shutdown(signal: string) {
  console.log(`${signal} received. Shutting down gracefully...`);
  if (server) {
    server.close(() => {
      console.log("HTTP server closed");
      process.exit(0);
    });
  }
  // Force close after 10s
  setTimeout(() => process.exit(1), 10000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
