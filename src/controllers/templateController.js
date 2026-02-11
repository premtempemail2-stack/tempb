const Template = require("../models/Template");

// @desc    Get all active templates
// @route   GET /api/templates
// @access  Public
exports.getTemplates = async (req, res, next) => {
  try {
    const { category } = req.query;

    const query = { isActive: true };
    if (category) {
      query.category = category;
    }

    const templates = await Template.find(query)
      .select("name version description thumbnail category createdAt")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: templates.length,
      data: templates,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single template
// @route   GET /api/templates/:id
// @access  Public
exports.getTemplate = async (req, res, next) => {
  try {
    const template = await Template.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get template versions/changelog
// @route   GET /api/templates/:id/versions
// @access  Public
exports.getTemplateVersions = async (req, res, next) => {
  try {
    const template = await Template.findById(req.params.id).select(
      "name version changelog previousVersions"
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    res.json({
      success: true,
      data: {
        currentVersion: template.version,
        changelog: template.changelog,
        previousVersions: template.previousVersions?.map((v) => ({
          version: v.version,
          createdAt: v.createdAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};
