const express = require('express');
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/api/auth/register", authController.register);
router.get("/api/auth/register/:confirm_token", authController.verifyEmail);
router.post("/api/auth/login", authController.login);
router.post("/api/auth/refresh-token", authController.refresh_token);
router.post("/api/auth/logout", authController.logout);
router.post("/api/auth/password-reset", authController.password_reset);
router.post("/api/auth/password-reset/:confirm_token", authController.password_reset_token);

module.exports = router;