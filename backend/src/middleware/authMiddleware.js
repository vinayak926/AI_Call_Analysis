// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ─── Token verify karo ───────────────────────────────────
// const protect = async (req, res, next) => {
//   try {
//     const authHeader = req.headers.authorization;

//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return res.status(401).json({ message: "Token nahi mila. Login karo." });
//     }

//     const token = authHeader.split(" ")[1];
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     req.user = await User.findById(decoded.id).select("-password");

//     if (!req.user) {
//       return res.status(401).json({ message: "User nahi mila." });
//     }

//     next();
//   } catch (error) {
//     return res.status(401).json({ message: "Invalid ya expired token." });
//   }
// };
const protect = async (req, res, next) => {
  try {
    // Support both Authorization header AND ?token= query param (for audio streaming)
    let token = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ message: "Token nahi mila. Login karo." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({ message: "User nahi mila." });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid ya expired token." });
  }
};

// ─── Admin only access ───────────────────────────────────
const adminOnly = (req, res, next) => {
  if (req.user.role === "super_admin" || req.user.role === "company_admin") {
    return next();
  }
  return res.status(403).json({ message: "Sirf admins access kar sakte hain." });
};

// ─── Super Admin only ────────────────────────────────────
const superAdminOnly = (req, res, next) => {
  if (req.user.role === "super_admin") {
    return next();
  }
  return res.status(403).json({ message: "Sirf super admin access kar sakta hai." });
};

module.exports = { protect, adminOnly, superAdminOnly };