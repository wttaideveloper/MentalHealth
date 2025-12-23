const mongoose = require("mongoose");

const entitlementSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true },
    scopeType: { type: String, enum: ["test", "plan"], required: true },
    scopeId: { type: mongoose.Schema.Types.ObjectId, default: null },
    status: { type: String, enum: ["active", "revoked"], default: "active" },
    validFrom: { type: Date, required: true },
    validTo: { type: Date, required: true },
    source: { type: String, enum: ["purchase", "subscription", "admin"], default: "purchase" }
  },
  { timestamps: true }
);

const Entitlement = mongoose.model("Entitlement", entitlementSchema);
module.exports = { Entitlement };
