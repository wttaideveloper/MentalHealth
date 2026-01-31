const mongoose = require("mongoose");

const groupAssessmentSchema = new mongoose.Schema(
  {
    testId: { type: mongoose.Schema.Types.ObjectId, ref: "Test", required: true, index: true },
    groupName: { type: String, required: true }, // e.g., "John Doe - Character Assessment" or "Bala" (student name)
    normalizedStudentName: { type: String, index: true, default: null }, // Normalized student name for fuzzy matching (legacy, kept for backward compatibility)
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "StudentProfile", index: true }, // The student profile being assessed (for link-based assessments)
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    
    // Link to GroupAssessmentLink if created via link
    groupAssessmentLinkId: { type: mongoose.Schema.Types.ObjectId, ref: "GroupAssessmentLink", index: true, default: null },
    linkToken: { type: String, index: true, default: null }, // Token from the link
    
    // Dynamic perspectives - Array of { perspectiveName, userId, resultId, participantInfo }
    perspectives: [{
      perspectiveName: { type: String, required: true }, // e.g., "Student", "Parent", "Teacher", "Counselor", etc.
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // null for anonymous link attempts
      resultId: { type: mongoose.Schema.Types.ObjectId, ref: "Result", default: null },
      participantInfo: { type: Object, default: null } // For anonymous link attempts: { name, email, dateOfBirth, gender }
    }],
    
    // Status tracking
    status: { 
      type: String, 
      enum: ["pending", "in_progress", "completed", "cancelled"], 
      default: "pending",
      index: true
    },
    
    // Metadata
    notes: { type: String, default: "" },
    completedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

// Index for efficient queries
groupAssessmentSchema.index({ testId: 1, status: 1 });
groupAssessmentSchema.index({ createdBy: 1, status: 1 });
groupAssessmentSchema.index({ subjectId: 1 });
groupAssessmentSchema.index({ groupAssessmentLinkId: 1, subjectId: 1 }); // For finding group assessment by link and student profile
groupAssessmentSchema.index({ groupAssessmentLinkId: 1, normalizedStudentName: 1 }); // Legacy index for backward compatibility

const GroupAssessment = mongoose.model("GroupAssessment", groupAssessmentSchema);
module.exports = { GroupAssessment };

