const { cfg } = require("../config/config");

function buildInvoiceNumber(sequenceValue) {
  const yearValue = new Date().getFullYear();
  return `${cfg.INVOICE_PREFIX}-${yearValue}-${String(sequenceValue).padStart(6, "0")}`;
}

function computeGstAmounts(baseAmountValue) {
  const gstPercentValue = cfg.GST_PERCENT;
  const gstAmountValue = Number(((baseAmountValue * gstPercentValue) / 100).toFixed(2));
  const totalAmountValue = Number((baseAmountValue + gstAmountValue).toFixed(2));
  return { gstPercent: gstPercentValue, gstAmount: gstAmountValue, totalAmount: totalAmountValue };
}

module.exports = { buildInvoiceNumber, computeGstAmounts };
