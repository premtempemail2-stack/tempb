const UserSite = require("../models/UserSite");
const Template = require("../models/Template");
const Domain = require("../models/Domain");
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
    const { customDomain } = req.body || {};

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

    const isFirstPublish = site.deploymentStatus === "draft";
    let domainRecord = null;

    // On first publish, allow setting a custom domain
    if (isFirstPublish && customDomain) {
      const normalizedDomain = customDomain.toLowerCase().trim();

      // Check if domain is already taken
      const existingDomain = await Domain.findOne({ domain: normalizedDomain });
      if (existingDomain) {
        return res.status(400).json({
          success: false,
          message: "Domain is already registered to another site",
        });
      }

      // Create domain record
      domainRecord = await Domain.create({
        domain: normalizedDomain,
        siteId: site._id,
        userId: req.user._id,
      });

      // Set custom domain on site (not verified yet)
      site.customDomain = normalizedDomain;
      site.domainVerified = false;
    }

    // Copy draft to published
    site.publishedContent = site.draftContent;
    site.publishedDynamicContent = site.draftDynamicContent;
    site.deploymentStatus = "published";
    site.publishedAt = new Date();

    await site.save();

    // Build response
    const responseData = {
      siteId: site.siteId,
      publishedAt: site.publishedAt,
      publishedUrl:
        site.customDomain && site.domainVerified
          ? `https://${site.customDomain}`
          : `https://${site.siteId}.${
              process.env.BUILDER_DOMAIN || "builder.com"
            }`,
      customDomain: site.customDomain || null,
      domainVerified: site.domainVerified,
      isFirstPublish,
    };

    // Include DNS instructions if a new domain was just added
    if (domainRecord) {
      responseData.domainSetup = {
        domainId: domainRecord._id,
        verificationToken: domainRecord.verificationToken,
        instructions: {
          step1: "Add a TXT record to your DNS settings",
          step2: "Host: @ or _webbuilder-verify",
          step3: `Value: ${domainRecord.verificationToken}`,
          step4: "Add a CNAME record pointing to your builder subdomain",
          step5: `CNAME: ${site.siteId}.${
            process.env.BUILDER_DOMAIN || "builder.com"
          }`,
          step6: "Wait for DNS propagation (may take up to 48 hours)",
          step7: "Click verify once the records are added",
        },
      };
    }

    res.json({
      success: true,
      message: "Site published successfully",
      data: responseData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update custom domain for a site
// @route   PUT /api/sites/:siteId/domain
// @access  Private
exports.updateCustomDomain = async (req, res, next) => {
  try {
    const { customDomain } = req.body;

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

    // Remove existing domain if any
    if (site.customDomain) {
      await Domain.findOneAndDelete({
        domain: site.customDomain,
        userId: req.user._id,
      });
      site.customDomain = null;
      site.domainVerified = false;
    }

    // If a new domain is provided, set it
    if (customDomain) {
      const normalizedDomain = customDomain.toLowerCase().trim();

      // Check if domain is already taken
      const existingDomain = await Domain.findOne({ domain: normalizedDomain });
      if (existingDomain) {
        return res.status(400).json({
          success: false,
          message: "Domain is already registered to another site",
        });
      }

      // Create domain record
      const domainRecord = await Domain.create({
        domain: normalizedDomain,
        siteId: site._id,
        userId: req.user._id,
      });

      site.customDomain = normalizedDomain;
      site.domainVerified = false;
      await site.save();

      return res.json({
        success: true,
        message: customDomain
          ? "Custom domain updated successfully"
          : "Custom domain removed",
        data: {
          siteId: site.siteId,
          customDomain: site.customDomain,
          domainVerified: site.domainVerified,
          domainSetup: {
            domainId: domainRecord._id,
            verificationToken: domainRecord.verificationToken,
            instructions: {
              step1: "Add a TXT record to your DNS settings",
              step2: "Host: @ or _webbuilder-verify",
              step3: `Value: ${domainRecord.verificationToken}`,
              step4: "Add a CNAME record pointing to your builder subdomain",
              step5: `CNAME: ${site.siteId}.${
                process.env.BUILDER_DOMAIN || "builder.com"
              }`,
              step6: "Wait for DNS propagation (may take up to 48 hours)",
              step7: "Click verify once the records are added",
            },
          },
        },
      });
    }

    await site.save();

    res.json({
      success: true,
      message: "Custom domain removed",
      data: {
        siteId: site.siteId,
        customDomain: null,
        domainVerified: false,
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
