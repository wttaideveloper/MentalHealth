const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true },
    testId: { type: mongoose.Schema.Types.ObjectId, ref: "Test", index: true, required: true },

    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    status: { type: String, enum: ["created", "paid", "failed", "refunded"], default: "created" },

    razorpayOrderId: { type: String, default: "" },
    razorpayPaymentId: { type: String, default: "" }
  },
  { timestamps: true }
);

const Purchase = mongoose.model("Purchase", purchaseSchema);
module.exports = { Purchase };
