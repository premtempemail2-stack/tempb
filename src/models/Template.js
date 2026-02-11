const mongoose = require("mongoose");

// Section schema - flexible props for different section types
const sectionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: { type: String, required: true },
    props: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

// Page schema
const pageSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    slug: { type: String, required: true },
    title: { type: String, required: true },
    seo: {
      description: String,
      ogImage: String,
    },
    sections: [sectionSchema],
    // For dynamic pages (articles, products, etc.)
    isDynamic: { type: Boolean, default: false },
    dynamicConfig: {
      // e.g., "articles", "products"
      collectionType: String,
      // Template for individual items
      itemTemplate: { type: mongoose.Schema.Types.Mixed },
      // List page template
      listTemplate: { type: mongoose.Schema.Types.Mixed },
    },
  },
  { _id: false }
);

// Navigation item schema
const navItemSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    href: { type: String, required: true },
  },
  { _id: false }
);

// Theme schema
const themeSchema = new mongoose.Schema(
  {
    color: {
      primary: String,
      secondary: String,
      accent: String,
      background: String,
      text: String,
    },
    font: String,
    fontSize: {
      base: String,
      heading: String,
    },
    fontWeight: {
      normal: { type: Number, default: 400 },
      bold: { type: Number, default: 700 },
    },
  },
  { _id: false }
);

// Template config schema
const configSchema = new mongoose.Schema(
  {
    pages: [pageSchema],
    theme: themeSchema,
    navigation: [navItemSchema],
    footer: { type: mongoose.Schema.Types.Mixed },
  },
  { _id: false }
);

// Main Template schema
const templateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Template name is required"],
      trim: true,
    },
    version: {
      type: String,
      required: true,
      default: "1.0.0",
    },
    description: {
      type: String,
      default: "",
    },
    thumbnail: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      default: "general",
    },
    config: {
      type: configSchema,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Changelog for version updates
    changelog: [
      {
        version: String,
        date: Date,
        changes: [
          {
            type: {
              type: String,
              enum: ["added", "removed", "modified", "fixed"],
            },
            description: String,
            path: String, // e.g., "pages.0.sections.2" for specific location
          },
        ],
      },
    ],
    // Previous versions for comparison
    previousVersions: [
      {
        version: String,
        config: mongoose.Schema.Types.Mixed,
        createdAt: Date,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
templateSchema.index({ isActive: 1, category: 1 });
templateSchema.index({ name: 1, version: 1 }, { unique: true });

module.exports = mongoose.model("Template", templateSchema);
