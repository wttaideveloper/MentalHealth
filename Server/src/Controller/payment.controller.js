const { asyncHandler } = require("../utils/asyncHandler");
const { ok, created } = require("../utils/response");
const { Test } = require("../models/Test");
const { Purchase } = require("../models/Purchase");
const { Entitlement } = require("../models/Entitlement");
const { Invoice } = require("../models/Invoice");

const { createRazorpayOrder, verifyWebhookSignature } = require("../services/razorpay.service");
const { buildInvoiceNumber, computeGstAmounts } = require("../services/invoice.service");
const { generateInvoicePdf } = require("../services/pdf.service");
const { sendInvoiceEmail } = require("../services/mail.service");
const { cfg } = require("../config/config");

let invoiceSequence = 1; // replace with DB counter in production

exports.createOrder = asyncHandler(async (req, res) => {
  const { testId } = req.body;

  const testDoc = await Test.findById(testId);
  if (!testDoc) return res.status(404).json({ success: false, message: "Test not found" });
  if (testDoc.price <= 0) return res.status(400).json({ success: false, message: "Test is free" });

  const amountInPaise = Math.round(testDoc.price * 100);
  const purchaseDoc = await Purchase.create({
    userId: req.user._id,
    testId: testDoc._id,
    amount: testDoc.price,
    currency: "INR",
    status: "created"
  });

  const order = await createRazorpayOrder({
    amountInPaise,
    currencyValue: "INR",
    receiptValue: `purchase_${purchaseDoc._id}`
  });

  purchaseDoc.razorpayOrderId = order.id;
  await purchaseDoc.save();

  return created(res, "Order created", {
    purchaseId: purchaseDoc._id,
    razorpayOrderId: order.id,
    amountInPaise,
    currency: "INR",
    keyId: cfg.RAZORPAY_KEY_ID
  });
});

// Razorpay webhook needs raw body: in app.js you’d mount a raw parser just for webhook route in production
exports.webhook = asyncHandler(async (req, res) => {
  const signatureValue = req.headers["x-razorpay-signature"];
  const rawBuffer = req.rawBodyBuffer; // set by route-level raw middleware

  const valid = verifyWebhookSignature(rawBuffer, signatureValue);
  if (!valid) return res.status(400).json({ success: false, message: "Invalid webhook signature" });

  const eventObj = req.body;

  if (eventObj.event === "payment.captured") {
    const orderId = eventObj?.payload?.payment?.entity?.order_id;
    const paymentId = eventObj?.payload?.payment?.entity?.id;

    const purchaseDoc = await Purchase.findOne({ razorpayOrderId: orderId });
    if (purchaseDoc && purchaseDoc.status !== "paid") {
      purchaseDoc.status = "paid";
      purchaseDoc.razorpayPaymentId = paymentId || "";
      await purchaseDoc.save();

      // entitlement: 1 year for the test
      const nowDate = new Date();
      await Entitlement.create({
        userId: purchaseDoc.userId,
        scopeType: "test",
        scopeId: purchaseDoc.testId,
        status: "active",
        validFrom: nowDate,
        validTo: new Date(nowDate.getTime() + 365 * 24 * 60 * 60 * 1000),
        source: "purchase"
      });

      // invoice
      const invoiceNumber = buildInvoiceNumber(invoiceSequence++);
      const gstAmounts = computeGstAmounts(purchaseDoc.amount);

      const invoiceDoc = await Invoice.create({
        userId: purchaseDoc.userId,
        purchaseId: purchaseDoc._id,
        invoiceNumber,
        gstin: cfg.GSTIN,
        baseAmount: purchaseDoc.amount,
        gstPercent: gstAmounts.gstPercent,
        gstAmount: gstAmounts.gstAmount,
        totalAmount: gstAmounts.totalAmount
      });

      const pdfPathValue = await generateInvoicePdf({
        fileName: `invoice_${invoiceNumber}.pdf`,
        invoiceNumber,
        totalAmount: invoiceDoc.totalAmount,
        gstAmount: invoiceDoc.gstAmount,
        gstPercent: invoiceDoc.gstPercent
      });

      invoiceDoc.pdfPath = pdfPathValue;
      await invoiceDoc.save();

      // email receipt
      // (need user email)
      const { User } = require("../models/User");
      const userDoc = await User.findById(purchaseDoc.userId);
      if (userDoc?.email) {
        await sendInvoiceEmail(userDoc.email, invoiceNumber);
        invoiceDoc.emailSentAt = new Date();
        await invoiceDoc.save();
      }
    }
  }

  return ok(res, "Webhook received", null);
});
