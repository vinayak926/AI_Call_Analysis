// controllers/authController.js
const User = require("../models/User");
const jwt = require("jsonwebtoken");

// JWT token generate karo
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// ─── REGISTER ────────────────────────────────────────────
// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { fullName, email, phone, company, position, password } = req.body;

    // Validation
    if (!fullName || !email || !phone || !company || !position || !password) {
      return res.status(400).json({ message: "Saare fields required hain." });
    }

    // Check: email already exists?
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Yeh email already registered hai." });
    }

    // User create karo (default role: counselor, isApproved: false)
    const user = await User.create({
      fullName,
      email,
      phone,
      company,
      position,
      password,
    });

    res.status(201).json({
      message: "Registration successful! Admin approval ka wait karo.",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── LOGIN ───────────────────────────────────────────────
// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email aur password dono required hain." });
    }

    // User find karo
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email ya password." });
    }

    // Password check karo
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email ya password." });
    }

    // Approval check karo
    if (!user.isApproved) {
      return res.status(403).json({
        message: "Aapka account abhi admin se approve nahi hua. Thoda wait karo.",
      });
    }

    // Token send karo
    const token = generateToken(user._id, user.role);

    res.status(200).json({
      message: "Login successful!",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        company: user.company,
        position: user.position,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── ADMIN LOGIN ─────────────────────────────────────────
// POST /api/auth/admin-login
// .env me ADMIN_PANEL_PASSWORD set hai
const adminLogin = async (req, res) => {
  try {
    const { email, password, adminPassword } = req.body;

    // Step 1: Admin panel password verify karo (.env se)
    if (adminPassword !== process.env.ADMIN_PANEL_PASSWORD) {
      return res.status(401).json({ message: "Admin panel password galat hai." });
    }

    // Step 2: User dhundo aur role check karo
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Admin user nahi mila." });
    }

    if (user.role !== "super_admin" && user.role !== "company_admin") {
      return res.status(403).json({ message: "Aapke paas admin access nahi hai." });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Password galat hai." });
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      message: "Admin login successful!",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── GET ALL USERS (Admin only) ──────────────────────────
// GET /api/auth/users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── APPROVE USER (Admin only) ───────────────────────────
// PATCH /api/auth/approve/:id
const approveUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User nahi mila." });
    }

    res.status(200).json({ message: "User approved!", user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── CHANGE USER ROLE (Admin only) ───────────────────────
// PATCH /api/auth/role/:id
const changeRole = async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ["counselor", "company_admin", "super_admin"];

    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role." });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User nahi mila." });
    }

    res.status(200).json({ message: "Role updated!", user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── GET LOGGED IN USER PROFILE ──────────────────────────
// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── DELETE USER (Admin only) ─────────────────────────
// DELETE /api/auth/users/:id
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    // Prevent deleting the super_admin account
    if (user.role === "super_admin") {
      return res.status(403).json({ message: "Super admin cannot be deleted." });
    }
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  register,
  login,
  adminLogin,
  getAllUsers,
  approveUser,
  changeRole,
  getMe,
  deleteUser,
};