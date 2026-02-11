const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const authController = require("../controllers/authController");
const auth = require("../middleware/auth");
const validate = require("../middleware/validate");

// Validation rules
const registerValidation = [
  body("email").isEmail().withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("name").trim().notEmpty().withMessage("Name is required"),
];

const loginValidation = [
  body("email").isEmail().withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

// Routes
router.post("/register", registerValidation, validate, authController.register);
router.post("/login", loginValidation, validate, authController.login);
router.get("/me", auth, authController.getMe);

module.exports = router;
