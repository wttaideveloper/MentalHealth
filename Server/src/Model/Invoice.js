const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true },
    purchaseId: { type: mongoose.Schema.Types.ObjectId, ref: "Purchase", index: true, required: true },

    invoiceNumber: { type: String, required: true, unique: true },
    gstin: { type: String, default: "" },

    baseAmount: { type: Number, required: true },
    gstPercent: { type: Number, required: true },
    gstAmount: { type: Number, required: true },
    totalAmount: { type: Number, required: true },

    pdfPath: { type: String, default: "" },
    emailSentAt: { type: Date, default: null }
  },
  { timestamps: true }
);

const Invoice = mongoose.model("Invoice", invoiceSchema);
module.exports = { Invoice };
