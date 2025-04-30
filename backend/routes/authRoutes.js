// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authenticateToken, isAdmin } = require("../middleware/auth");

// Публичные маршруты
router.post("/login", authController.login);
router.post("/logout", authController.logout);

// Защищенные маршруты (только для админа)
// router.post('/register', authenticateToken, isAdmin, authController.register);
router.post("/register", authController.register);

module.exports = router;
