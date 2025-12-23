const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const { cfg } = require("./config/config");
const { notFoundMiddleware, errorMiddleware } = require("./middlewares/error.middleware");

const authRoutes = require("./routes/auth.routes");
const consentRoutes = require("./routes/consent.routes");
const testRoutes = require("./routes/test.routes");
const attemptRoutes = require("./routes/attempt.routes");
const resultRoutes = require("./routes/result.routes");
const paymentRoutes = require("./routes/payment.routes");
const invoiceRoutes = require("./routes/invoice.routes");
const reportRoutes = require("./routes/report.routes");
const adminReportRoutes = require("./routes/adminReports.routes");

const app = express();

app.use(cors({ origin: cfg.CORS_ORIGIN, credentials: true }));
app.use(helmet());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/health", (req, res) => res.json({ success: true, message: "OK" }));

app.use("/api/auth", authRoutes);
app.use("/api/consent", consentRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/attempts", attemptRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin/reports", adminReportRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = { app };
