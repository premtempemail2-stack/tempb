const mongoose = require("mongoose");

// Dynamic content item schema (for articles, products, etc.)
const dynamicContentItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    slug: { type: String, required: true },
    title: String,
    content: mongoose.Schema.Types.Mixed,
    metadata: mongoose.Schema.Types.Mixed,
    publishedAt: Date,
    isPublished: { type: Boolean, default: false },
  },
  { _id: false, timestamps: true }
);

// Dynamic content collection schema
const dynamicCollectionSchema = new mongoose.Schema(
  {
    type: { type: String, required: true }, // e.g., "articles", "products"
    items: [dynamicContentItemSchema],
  },
  { _id: false }
);

// UserSite schema - cloned template for user
const userSiteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Template",
      required: true,
    },
    templateVersion: {
      type: String,
      required: true,
    },
    // Unique URL-friendly identifier
    siteId: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Draft content - what user sees in preview/editor
    draftContent: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    // Published content - what's live on the website
    publishedContent: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // Dynamic content collections (articles, products, etc.)
    draftDynamicContent: [dynamicCollectionSchema],
    publishedDynamicContent: [dynamicCollectionSchema],

    // Deployment status
    deploymentStatus: {
      type: String,
      enum: ["draft", "published", "updating", "failed"],
      default: "draft",
    },

    // Site metadata
    metadata: {
      seoTitle: String,
      seoDescription: String,
      favicon: String,
      socialImage: String,
      analytics: {
        googleAnalyticsId: String,
      },
    },

    // Custom domain
    customDomain: {
      type: String,
      default: null,
    },
    domainVerified: {
      type: Boolean,
      default: false,
    },

    // Template upgrade tracking
    availableUpgrade: {
      version: String,
      changes: [
        {
          type: {
            type: String,
            enum: ["added", "removed", "modified", "fixed"],
          },
          description: String,
          path: String,
          requiresAction: Boolean,
          actionDescription: String,
        },
      ],
    },

    // Timestamps for various events
    publishedAt: Date,
    lastUpdatedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
userSiteSchema.index({ userId: 1 });
userSiteSchema.index({ siteId: 1 }, { unique: true });
userSiteSchema.index({ customDomain: 1 }, { sparse: true });
userSiteSchema.index({ templateId: 1, templateVersion: 1 });

// Virtual for preview URL
userSiteSchema.virtual("previewUrl").get(function () {
  return `/sites/${this.siteId}`;
});

// Virtual for published URL
userSiteSchema.virtual("publishedUrl").get(function () {
  if (this.customDomain && this.domainVerified) {
    return `https://${this.customDomain}`;
  }
  return `https://${
    this.siteId
  }.${process.env.BUILDER_DOMAIN || "builder.com"}`;
});

module.exports = mongoose.model("UserSite", userSiteSchema);
