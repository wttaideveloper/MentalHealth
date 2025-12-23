const mongoose = require("mongoose");

const consentVersionSchema = new mongoose.Schema(
  {
    version: { type: String, unique: true, required: true },
    tosUrl: { type: String, default: "" },
    privacyUrl: { type: String, default: "" },
    effectiveAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const ConsentVersion = mongoose.model("ConsentVersion", consentVersionSchema);
module.exports = { ConsentVersion };
