const mongoose = require("mongoose");

const studentProfileSchema = new mongoose.Schema(
  {
    // Link to the group assessment link
    groupAssessmentLinkId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "GroupAssessmentLink", 
      required: true, 
      index: true 
    },
    linkToken: { 
      type: String, 
      required: true, 
      index: true 
    },
    
    // Student information
    name: { 
      type: String, 
      required: true, 
      trim: true 
    },
    dateOfBirth: { 
      type: Date, 
      required: true 
    },
    classGrade: { 
      type: String, 
      required: true, 
      trim: true 
    },
    school: { 
      type: String, 
      default: "", 
      trim: true 
    },
    parentName: { 
      type: String, 
      default: "", 
      trim: true 
    },
    
    // Additional metadata
    createdBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      default: null 
    }
  },
  { timestamps: true }
);

// Indexes for efficient queries
studentProfileSchema.index({ groupAssessmentLinkId: 1, linkToken: 1 });
studentProfileSchema.index({ linkToken: 1 });

const StudentProfile = mongoose.model("StudentProfile", studentProfileSchema);
module.exports = { StudentProfile };

