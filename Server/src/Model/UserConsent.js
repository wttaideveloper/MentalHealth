const mongoose = require("mongoose");

const userConsentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true },
    version: { type: String, required: true },
    acceptedAt: { type: Date, required: true },
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" }
  },
  { timestamps: true }
);

const UserConsent = mongoose.model("UserConsent", userConsentSchema);
module.exports = { UserConsent };
