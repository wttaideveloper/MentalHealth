const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: { type: String, lowercase: true, trim: true, unique: true, sparse: true },
    phone: { type: String, trim: true, unique: true, sparse: true },

    passwordHash: { type: String, default: "" },
    googleId: { type: String, default: "" },

    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },

    role: { type: String, enum: ["user", "admin"], default: "user" },

    isEmailVerified: { type: Boolean, default: false },
    emailVerifyTokenHash: { type: String, default: "" }, // Keep for backward compatibility
    emailVerificationCode: { type: String, default: "" }, // Hashed 6-digit code
    emailVerificationCodeExpiresAt: { type: Date, default: null }, // Code expiration (10 minutes)

    resetPasswordTokenHash: { type: String, default: "" },
    resetPasswordExpiresAt: { type: Date, default: null },

    latestConsentAcceptedVersion: { type: String, default: "" },

    profile: {
      dob: { type: Date, default: null },
      gender: { type: String, default: "" }
    }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
module.exports = { User };
