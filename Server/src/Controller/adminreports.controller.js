const { Purchase } = require("../Model/Purchase");
const { TestAttempt } = require("../Model/Testattempt");

const { asyncHandler } = require("../utils/Asynchandler");
const { ok } = require("../utils/Response");
const { toCsv } = require("../services/csv.service");

exports.summary = asyncHandler(async (req, res) => {
  const purchasesCountValue = await Purchase.countDocuments();
  const paidCountValue = await Purchase.countDocuments({ status: "paid" });

  const attemptsStartedValue = await TestAttempt.countDocuments();
  const attemptsCompletedValue = await TestAttempt.countDocuments({ status: "submitted" });

  return ok(res, "Summary", {
    purchasesCount: purchasesCountValue,
    paidCount: paidCountValue,
    attemptsStarted: attemptsStartedValue,
    attemptsCompleted: attemptsCompletedValue
  });
});

exports.purchasesCsv = asyncHandler(async (req, res) => {
  const items = await Purchase.find()
    .populate("testId", "title")
    .populate("userId", "email")
    .sort({ createdAt: -1 })
    .limit(5000);

  const rows = items.map((p) => ({
    id: String(p._id),
    user: p.userId?.email || "",
    test: p.testId?.title || "",
    amount: p.amount,
    currency: p.currency,
    status: p.status,
    orderId: p.razorpayOrderId,
    paymentId: p.razorpayPaymentId,
    createdAt: p.createdAt
  }));

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=purchases.csv");
  return res.send(toCsv(rows));
});

exports.usageCsv = asyncHandler(async (req, res) => {
  const items = await TestAttempt.find()
    .populate("testId", "title")
    .populate("userId", "email")
    .sort({ createdAt: -1 })
    .limit(5000);

  const rows = items.map((a) => ({
    attemptId: String(a._id),
    user: a.userId?.email || "",
    test: a.testId?.title || "",
    status: a.status,
    startedAt: a.startedAt,
    submittedAt: a.submittedAt || ""
  }));

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=usage.csv");
  return res.send(toCsv(rows));
});
