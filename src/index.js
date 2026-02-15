require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

// Import routes
const authRoutes = require("./routes/auth");
const templateRoutes = require("./routes/templates");
const siteRoutes = require("./routes/sites");
const domainRoutes = require("./routes/domains");
const publicRoutes = require("./routes/public");

const app = express();

// Security and Parsing Middleware (Can be outside startServer)
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`
    );
  });
  next();
});

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Health check
    app.get("/health", (req, res) => {
      res.json({
        status: "ok",
        database:
          mongoose.connection.readyState === 1 ? "connected" : "disconnected",
        timestamp: new Date().toISOString(),
      });
    });

    // API Routes
    app.use("/api/auth", authRoutes);
    app.use("/api/templates", templateRoutes);
    app.use("/api/sites", siteRoutes);
    app.use("/api/domains", domainRoutes);

    // Public routes (for rendering engine)
    app.use("/public", publicRoutes);

    // 404 handler
    app.use((req, res) => {
      res.status(404).json({
        success: false,
        message: "Route not found",
      });
    });

    // Error handler
    app.use(errorHandler);

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(
        `Server running in ${
          process.env.NODE_ENV || "development"
        } mode on port ${PORT}`
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    // Exit if initial connection fails in production, or retry in dev
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    } else {
      console.log("Retrying database connection in 5 seconds...");
      setTimeout(startServer, 5000);
    }
  }
};

startServer();

module.exports = app;
