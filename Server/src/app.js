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
const assessmentLinkRoutes = require("./routes/assessmentLink.routes");
const publicAssessmentLinkRoutes = require("./routes/publicAssessmentLink.routes");
const uploadRoutes = require("./routes/upload.routes");
const groupAssessmentRoutes = require("./routes/groupAssessment.routes");
const groupAssessmentLinkRoutes = require("./routes/groupAssessmentLink.routes");
const publicGroupAssessmentLinkRoutes = require("./routes/publicGroupAssessmentLink.routes");

async function createApp() {
  const app = express();

  const allowedOrigins = cfg.CORS_ORIGIN
    ? cfg.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : ['http://localhost:3000'];

  app.use(cors({
    origin: allowedOrigins,
    credentials: true
  }));
  
  // Serve uploaded files BEFORE helmet to avoid CSP issues
  // This route needs to be before helmet middleware
  // Images don't need credentials, so we use "*" for simplicity
  app.use("/uploads", (req, res, next) => {
    // Set CORS headers for static file requests (images don't use credentials)
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    
    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  }, express.static(path.join(__dirname, "../uploads"), {
    setHeaders: (res, filePath) => {
      // Set CORS headers for static files (no credentials needed for images)
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET');
      
      // Ensure proper content-type headers for images
      if (filePath.endsWith('.png')) {
        res.setHeader('Content-Type', 'image/png');
      } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
        res.setHeader('Content-Type', 'image/jpeg');
      } else if (filePath.endsWith('.gif')) {
        res.setHeader('Content-Type', 'image/gif');
      } else if (filePath.endsWith('.webp')) {
        res.setHeader('Content-Type', 'image/webp');
      }
    }
  }));
  
  if (cfg.NODE_ENV === "development") {
    // Relaxed CSP for development with Vite HMR
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          connectSrc: ["'self'", "ws://localhost:*", "http://localhost:*"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "http://localhost:*", "https://purecatamphetamine.github.io"],
        },
      },
    }));
  } else {
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "http://localhost:*", "https://purecatamphetamine.github.io"],
          fontSrc: ["'self'", "https:", "data:"],
          formAction: ["'self'"],
          frameAncestors: ["'self'"],
          objectSrc: ["'none'"],
          scriptSrcAttr: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
    }));
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
  app.use("/api/admin/assessment-links", assessmentLinkRoutes);
  app.use("/api/public/assessment-links", publicAssessmentLinkRoutes);
  app.use("/api/upload", uploadRoutes);
  app.use("/api/group-assessments", groupAssessmentRoutes);
  app.use("/api/admin/group-assessment-links", groupAssessmentLinkRoutes);
  app.use("/api/public/group-assessment-links", publicGroupAssessmentLinkRoutes);

  // Frontend serving removed - now runs independently
  // API routes only

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}

module.exports = { createApp };
