const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true },
    testId: { type: mongoose.Schema.Types.ObjectId, ref: "Test", index: true, required: true },
    attemptId: { type: mongoose.Schema.Types.ObjectId, ref: "TestAttempt", index: true, required: true },

    score: { type: Number, required: true },
    band: { type: String, default: "" },
    subscales: { type: Object, default: {} },

    interpretation: { type: Object, default: {} },
    riskFlags: { type: Object, default: {} }
  },
  { timestamps: true }
);

const Result = mongoose.model("Result", resultSchema);
module.exports = { Result };
