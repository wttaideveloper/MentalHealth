const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, default: null }, // Optional for anonymous link attempts
    testId: { type: mongoose.Schema.Types.ObjectId, ref: "Test", index: true, required: true },
    attemptId: { type: mongoose.Schema.Types.ObjectId, ref: "TestAttempt", index: true, required: true },
    linkToken: { type: String, index: true, default: null }, // For anonymous results via assessment link

    score: { type: Number, required: true },
    band: { type: String, default: "" },
    bandDescription: { type: String, default: "" },
    subscales: { type: Object, default: {} },
    categoryResults: { type: Map, of: Object, default: {} }, // Category results with bands

    interpretation: { type: Object, default: {} },
    riskFlags: { type: Object, default: {} }
  },
  { timestamps: true }
);

const Result = mongoose.model("Result", resultSchema);
module.exports = { Result };
