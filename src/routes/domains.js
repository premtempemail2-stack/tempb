const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const domainController = require("../controllers/domainController");
const auth = require("../middleware/auth");
const validate = require("../middleware/validate");

// Validation rules
const addDomainValidation = [
  body("domain")
    .trim()
    .notEmpty()
    .withMessage("Domain is required")
    .matches(/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i)
    .withMessage("Please provide a valid domain"),
  body("siteId")
    .notEmpty()
    .withMessage("Site ID is required")
    .isMongoId()
    .withMessage("Invalid site ID"),
];

// Protected routes
router.use(auth);

// Domain management
router.get("/", domainController.getDomains);
router.post("/", addDomainValidation, validate, domainController.addDomain);
router.post("/:id/verify", domainController.verifyDomain);
router.get("/:id/dns-status", domainController.checkDnsStatus);
router.delete("/:id", domainController.deleteDomain);

module.exports = router;
