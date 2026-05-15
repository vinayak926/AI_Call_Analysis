// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const {
  register,
  login,
  adminLogin,
  getAllUsers,
  approveUser,
  changeRole,
  getMe,
} = require("../controllers/authController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/admin-login", adminLogin);

// Protected routes (login required)
router.get("/me", protect, getMe);

// Admin only routes
router.get("/users", protect, adminOnly, getAllUsers);
router.patch("/approve/:id", protect, adminOnly, approveUser);
router.patch("/role/:id", protect, adminOnly, changeRole);

module.exports = router;