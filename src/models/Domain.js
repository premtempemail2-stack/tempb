const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const domainSchema = new mongoose.Schema(
  {
    domain: {
      type: String,
      required: [true, "Domain is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserSite",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Verification token for DNS TXT record
    verificationToken: {
      type: String,
      default: () => `wbb-verify-${uuidv4().slice(0, 16)}`,
    },
    // Verification status
    verified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: Date,
    // DNS configuration status
    dnsConfigured: {
      type: Boolean,
      default: false,
    },
    // SSL status
    sslStatus: {
      type: String,
      enum: ["pending", "active", "failed"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
domainSchema.index({ domain: 1 }, { unique: true });
domainSchema.index({ siteId: 1 });
domainSchema.index({ userId: 1 });

module.exports = mongoose.model("Domain", domainSchema);
