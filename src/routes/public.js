const express = require("express");
const router = express.Router();
const siteController = require("../controllers/siteController");

// Public routes for published content
// These are meant to be accessed by the rendering engine

// Get published site content by siteId
router.get("/sites/:siteId", siteController.getPublished);

module.exports = router;
