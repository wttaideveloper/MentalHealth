const mongoose = require("mongoose");

const testAttemptSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true },
    testId: { type: mongoose.Schema.Types.ObjectId, ref: "Test", index: true, required: true },

    status: { type: String, enum: ["in_progress", "submitted", "expired"], default: "in_progress" },

    answers: { type: Object, default: {} }, // can be encrypted later
    startedAt: { type: Date, required: true },
    lastSavedAt: { type: Date, default: null },
    submittedAt: { type: Date, default: null },

    timeLimitSeconds: { type: Number, default: 0 },
    expiresAt: { type: Date, default: null }
  },
  { timestamps: true }
);

const TestAttempt = mongoose.model("TestAttempt", testAttemptSchema);
module.exports = { TestAttempt };
