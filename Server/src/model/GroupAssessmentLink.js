const mongoose = require("mongoose");

const groupAssessmentLinkSchema = new mongoose.Schema(
  {
    linkToken: { 
      type: String, 
      required: true, 
      unique: true, 
      index: true 
    },
    testId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Test", 
      required: true, 
      index: true 
    },
    createdBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    groupName: { 
      type: String, 
      required: true 
    },
    // Dynamic perspectives - Array of { perspectiveName, maxAttempts, currentAttempts }
    perspectives: [{
      perspectiveName: { type: String, required: true }, // e.g., "Student", "Parent", "Teacher"
      maxAttempts: { type: Number, default: null }, // null = unlimited
      currentAttempts: { type: Number, default: 0 }
    }],
    expiresAt: { 
      type: Date, 
      default: null 
    },
    isActive: { 
      type: Boolean, 
      default: true 
    },
    notes: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

// Indexes
groupAssessmentLinkSchema.index({ linkToken: 1 });
groupAssessmentLinkSchema.index({ testId: 1, isActive: 1 });
groupAssessmentLinkSchema.index({ createdBy: 1 });

const GroupAssessmentLink = mongoose.model("GroupAssessmentLink", groupAssessmentLinkSchema);
module.exports = { GroupAssessmentLink };


