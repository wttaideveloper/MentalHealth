const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

const { cfg } = require("./config/config");
const { notFoundMiddleware, errorMiddleware } = require("./middleware/error.middleware");

const authRoutes = require("./routes/auth.routes");
const consentRoutes = require("./routes/consent.routes");
const testRoutes = require("./routes/test.routes");
const attemptRoutes = require("./routes/attempt.routes");
const resultRoutes = require("./routes/result.routes");
const paymentRoutes = require("./routes/payment.routes");
const invoiceRoutes = require("./routes/invoice.routes");
const reportRoutes = require("./routes/report.routes");
const adminRoutes = require("./routes/admin.routes");
const adminReportRoutes = require("./routes/adminreports.routes");
const adminTestsRoutes = require("./routes/admintests.routes");

async function createApp() {
  const app = express();

  app.use(cors({ origin: cfg.CORS_ORIGIN, credentials: true }));
  
  if (cfg.NODE_ENV === "development") {
    // Relaxed CSP for development with Vite HMR
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          connectSrc: ["'self'", "ws://localhost:*", "http://localhost:*"],
          styleSrc: ["'self'", "'unsafe-inline'"],
        },
      },
    }));
  } else {
    app.use(helmet());
  }
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan("dev"));

  // API routes first
  app.get("/api/health", (req, res) => res.json({ success: true, message: "OK" }));
  app.use("/api/auth", authRoutes);
  app.use("/api/consent", consentRoutes);
  app.use("/api/tests", testRoutes);
  app.use("/api/attempts", attemptRoutes);
  app.use("/api/results", resultRoutes);
  app.use("/api/payments", paymentRoutes);
  app.use("/api/invoices", invoiceRoutes);
  app.use("/api/reports", reportRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/admin/reports", adminReportRoutes);
  app.use("/api/admin/tests", adminTestsRoutes);

  // Frontend serving
  if (cfg.NODE_ENV === "development") {
    const { createServer } = require("vite");
    
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
      root: path.join(__dirname, "../../client"),
      envDir: path.join(__dirname, "../../"),
      configFile: path.join(__dirname, "../../vite.config.js"),
    });
    
    app.use((req, res, next) => {
      if (req.originalUrl.startsWith('/api/')) {
        return next();
      }
      vite.middlewares(req, res, next);
    });
  } else {
    app.use(express.static(path.join(__dirname, "../../dist/public")));
    app.use((req, res, next) => {
      if (req.path.startsWith('/api/')) {
        return next();
      }
      res.sendFile(path.join(__dirname, "../../dist/public/index.html"));
    });
  }

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}

module.exports = { createApp };
