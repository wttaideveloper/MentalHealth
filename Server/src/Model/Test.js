const mongoose = require("mongoose");

const testSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: { type: String, default: "" },
    shortDescription: { type: String, default: "" },
    longDescription: { type: String, default: "" },

    durationMinutesMin: { type: Number, default: 10 },
    durationMinutesMax: { type: Number, default: 12 },
    questionsCount: { type: Number, default: 20 },

    price: { type: Number, default: 0 },
    mrp: { type: Number, default: 0 },

    imageUrl: { type: String, default: "" },
    tag: { type: String, default: "Research-Based" },

    timeLimitSeconds: { type: Number, default: 0 }, // 0 => no limit

    schemaJson: { type: Object, required: true },        // question schema
    eligibilityRules: { type: Object, default: {} },     // age/plan etc
    scoringRules: { type: Object, default: {} },         // sum/weighted/subscales
    riskRules: { type: Object, default: {} },            // risk triggers

    isActive: { type: Boolean, default: true },
    popularityScore: { type: Number, default: 0 }
  },
  { timestamps: true }
);

const Test = mongoose.model("Test", testSchema);
module.exports = { Test };
