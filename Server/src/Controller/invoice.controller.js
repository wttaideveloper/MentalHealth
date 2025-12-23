const { asyncHandler } = require("../utils/asyncHandler");
const { ok } = require("../utils/response");
const { Invoice } = require("../models/Invoice");

exports.getById = asyncHandler(async (req, res) => {
  const invoiceDoc = await Invoice.findOne({ _id: req.params.invoiceId, userId: req.user._id });
  if (!invoiceDoc) return res.status(404).json({ success: false, message: "Invoice not found" });
  return ok(res, "Invoice", invoiceDoc);
});
