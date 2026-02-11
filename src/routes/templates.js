const express = require("express");
const router = express.Router();
const templateController = require("../controllers/templateController");

// Routes
router.get("/", templateController.getTemplates);
router.get("/:id", templateController.getTemplate);
router.get("/:id/versions", templateController.getTemplateVersions);

module.exports = router;
