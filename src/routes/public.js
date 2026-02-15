const express = require("express");
const router = express.Router();
const siteController = require("../controllers/siteController");
const domainController = require("../controllers/domainController");

// Public routes for published content
// These are meant to be accessed by the rendering engine

// Lookup siteId by custom domain
router.get("/domains/lookup/:domain", domainController.lookupDomain);

// Get published site content by siteId
router.get("/sites/:siteId", siteController.getPublished);

module.exports = router;
