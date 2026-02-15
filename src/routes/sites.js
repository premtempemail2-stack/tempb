const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const siteController = require("../controllers/siteController");
const auth = require("../middleware/auth");
const validate = require("../middleware/validate");

// Validation rules
const createSiteValidation = [
  body("templateId")
    .notEmpty()
    .withMessage("Template ID is required")
    .isMongoId()
    .withMessage("Invalid template ID"),
  body("name")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Name must be between 1 and 100 characters"),
];

const updateDraftValidation = [
  body("content")
    .optional()
    .isObject()
    .withMessage("Content must be an object"),
  body("dynamicContent")
    .optional()
    .isArray()
    .withMessage("Dynamic content must be an array"),
];

// Protected routes
router.use(auth);

// Site CRUD
router.get("/", siteController.getSites);
router.post("/", createSiteValidation, validate, siteController.createSite);
router.get("/:siteId", siteController.getSite);

// Draft & Preview
router.put(
  "/:siteId/draft",
  updateDraftValidation,
  validate,
  siteController.updateDraft
);
router.get("/:siteId/preview", siteController.getPreview);

// Publish
router.post("/:siteId/publish", siteController.publishSite);

// Custom domain management
router.put("/:siteId/domain", siteController.updateCustomDomain);

// Template updates
router.get("/:siteId/check-updates", siteController.checkUpdates);
router.post("/:siteId/apply-update", siteController.applyUpdate);

// Dynamic content
router.get(
  "/:siteId/dynamic/:collectionType",
  siteController.getDynamicContent
);
router.post(
  "/:siteId/dynamic/:collectionType",
  siteController.addDynamicContent
);

module.exports = router;
