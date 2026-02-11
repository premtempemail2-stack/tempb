const UserSite = require("../models/UserSite");
const Template = require("../models/Template");
const generateSiteId = require("../utils/generateSiteId");
const {
  compareTemplateVersions,
  applyMigration,
} = require("../utils/templateMigration");

// @desc    Get all sites for current user
// @route   GET /api/sites
// @access  Private
exports.getSites = async (req, res, next) => {
  try {
    const sites = await UserSite.find({ userId: req.user._id })
      .select(
        "siteId name deploymentStatus customDomain domainVerified templateVersion publishedAt createdAt"
      )
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      count: sites.length,
      data: sites,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Clone template to create new site
// @route   POST /api/sites
// @access  Private
exports.createSite = async (req, res, next) => {
  try {
    const { templateId, name } = req.body;

    // Get template
    const template = await Template.findById(templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    // Generate unique site ID
    const siteName = name || template.name;
    const siteId = generateSiteId(siteName);

    // Create user site with cloned template config
    const userSite = await UserSite.create({
      userId: req.user._id,
      templateId: template._id,
      templateVersion: template.version,
      siteId,
      name: siteName,
      draftContent: template.config,
      metadata: {
        seoTitle: siteName,
        seoDescription: template.description,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: userSite._id,
        siteId: userSite.siteId,
        name: userSite.name,
        previewUrl: `/sites/${userSite.siteId}`,
        templateVersion: userSite.templateVersion,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get site by siteId
// @route   GET /api/sites/:siteId
// @access  Private
exports.getSite = async (req, res, next) => {
  try {
    const site = await UserSite.findOne({
      siteId: req.params.siteId,
      userId: req.user._id,
    }).populate("templateId", "name version");

    if (!site) {
      return res.status(404).json({
        success: false,
        message: "Site not found",
      });
    }

    res.json({
      success: true,
      data: site,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update draft content
// @route   PUT /api/sites/:siteId/draft
// @access  Private
exports.updateDraft = async (req, res, next) => {
  try {
    const { content, dynamicContent } = req.body;

    const site = await UserSite.findOne({
      siteId: req.params.siteId,
      userId: req.user._id,
    });

    if (!site) {
      return res.status(404).json({
        success: false,
        message: "Site not found",
      });
    }

    // Update draft content
    if (content) {
      site.draftContent = content;
    }

    if (dynamicContent) {
      site.draftDynamicContent = dynamicContent;
    }

    site.lastUpdatedAt = new Date();
    await site.save();

    res.json({
      success: true,
      message: "Draft updated successfully",
      data: {
        siteId: site.siteId,
        lastUpdatedAt: site.lastUpdatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get preview (draft) content
// @route   GET /api/sites/:siteId/preview
// @access  Private
exports.getPreview = async (req, res, next) => {
  try {
    const site = await UserSite.findOne({
      siteId: req.params.siteId,
      userId: req.user._id,
    }).select("siteId name draftContent draftDynamicContent metadata");

    if (!site) {
      return res.status(404).json({
        success: false,
        message: "Site not found",
      });
    }

    res.json({
      success: true,
      data: {
        siteId: site.siteId,
        name: site.name,
        content: site.draftContent,
        dynamicContent: site.draftDynamicContent,
        metadata: site.metadata,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Publish site (copy draft to published)
// @route   POST /api/sites/:siteId/publish
// @access  Private
exports.publishSite = async (req, res, next) => {
  try {
    const site = await UserSite.findOne({
      siteId: req.params.siteId,
      userId: req.user._id,
    });

    if (!site) {
      return res.status(404).json({
        success: false,
        message: "Site not found",
      });
    }

    // Copy draft to published
    site.publishedContent = site.draftContent;
    site.publishedDynamicContent = site.draftDynamicContent;
    site.deploymentStatus = "published";
    site.publishedAt = new Date();

    await site.save();

    // TODO: Trigger revalidation webhook for Next.js rendering engine
    // TODO: Move assets from temp to permanent storage

    res.json({
      success: true,
      message: "Site published successfully",
      data: {
        siteId: site.siteId,
        publishedAt: site.publishedAt,
        publishedUrl:
          site.customDomain && site.domainVerified
            ? `https://${site.customDomain}`
            : `https://${site.siteId}.${
                process.env.BUILDER_DOMAIN || "builder.com"
              }`,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get published content (public)
// @route   GET /api/sites/:siteId/published
// @access  Public
exports.getPublished = async (req, res, next) => {
  try {
    const site = await UserSite.findOne({
      siteId: req.params.siteId,
      deploymentStatus: "published",
    }).select(
      "siteId name publishedContent publishedDynamicContent metadata customDomain"
    );

    if (!site || !site.publishedContent) {
      return res.status(404).json({
        success: false,
        message: "Published site not found",
      });
    }

    res.json({
      success: true,
      data: {
        siteId: site.siteId,
        name: site.name,
        content: site.publishedContent,
        dynamicContent: site.publishedDynamicContent,
        metadata: site.metadata,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check for template updates
// @route   GET /api/sites/:siteId/check-updates
// @access  Private
exports.checkUpdates = async (req, res, next) => {
  try {
    const site = await UserSite.findOne({
      siteId: req.params.siteId,
      userId: req.user._id,
    });

    if (!site) {
      return res.status(404).json({
        success: false,
        message: "Site not found",
      });
    }

    // Get latest template version
    const template = await Template.findById(site.templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    // Compare versions
    if (template.version === site.templateVersion) {
      return res.json({
        success: true,
        data: {
          updateAvailable: false,
          currentVersion: site.templateVersion,
        },
      });
    }

    // Get migration report
    const migrationReport = compareTemplateVersions(
      site.draftContent,
      template.config,
      site.templateVersion,
      template.version
    );

    res.json({
      success: true,
      data: {
        updateAvailable: true,
        currentVersion: site.templateVersion,
        latestVersion: template.version,
        migrationReport,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Apply template update
// @route   POST /api/sites/:siteId/apply-update
// @access  Private
exports.applyUpdate = async (req, res, next) => {
  try {
    const { acceptedChanges } = req.body; // Array of change paths to accept

    const site = await UserSite.findOne({
      siteId: req.params.siteId,
      userId: req.user._id,
    });

    if (!site) {
      return res.status(404).json({
        success: false,
        message: "Site not found",
      });
    }

    // Get latest template
    const template = await Template.findById(site.templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    // Generate migration report
    const migrationReport = compareTemplateVersions(
      site.draftContent,
      template.config,
      site.templateVersion,
      template.version
    );

    // Apply migration
    const migratedConfig = applyMigration(
      site.draftContent,
      template.config,
      migrationReport
    );

    // Update site
    site.draftContent = migratedConfig;
    site.templateVersion = template.version;
    site.availableUpgrade = null;
    site.lastUpdatedAt = new Date();

    await site.save();

    res.json({
      success: true,
      message: "Template updated successfully",
      data: {
        siteId: site.siteId,
        newVersion: site.templateVersion,
        appliedChanges: migrationReport.changes.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Manage dynamic content (articles, products, etc.)
// @route   POST /api/sites/:siteId/dynamic/:collectionType
// @access  Private
exports.addDynamicContent = async (req, res, next) => {
  try {
    const { collectionType } = req.params;
    const { item } = req.body;

    const site = await UserSite.findOne({
      siteId: req.params.siteId,
      userId: req.user._id,
    });

    if (!site) {
      return res.status(404).json({
        success: false,
        message: "Site not found",
      });
    }

    // Find or create collection
    let collection = site.draftDynamicContent.find(
      (c) => c.type === collectionType
    );
    if (!collection) {
      collection = { type: collectionType, items: [] };
      site.draftDynamicContent.push(collection);
    }

    // Add item with generated ID
    const newItem = {
      id: `${collectionType}-${Date.now()}`,
      slug: item.slug || item.title?.toLowerCase().replace(/\s+/g, "-"),
      ...item,
      createdAt: new Date(),
    };

    // Find collection again after potentially pushing
    const collectionIndex = site.draftDynamicContent.findIndex(
      (c) => c.type === collectionType
    );
    site.draftDynamicContent[collectionIndex].items.push(newItem);

    await site.save();

    res.status(201).json({
      success: true,
      data: newItem,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dynamic content
// @route   GET /api/sites/:siteId/dynamic/:collectionType
// @access  Private
exports.getDynamicContent = async (req, res, next) => {
  try {
    const { collectionType } = req.params;

    const site = await UserSite.findOne({
      siteId: req.params.siteId,
      userId: req.user._id,
    });

    if (!site) {
      return res.status(404).json({
        success: false,
        message: "Site not found",
      });
    }

    const collection = site.draftDynamicContent.find(
      (c) => c.type === collectionType
    );

    res.json({
      success: true,
      data: collection?.items || [],
    });
  } catch (error) {
    next(error);
  }
};
