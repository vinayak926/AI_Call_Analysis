// //server.js

// require("dotenv").config();
// const app = require("./src/app");
// const connectDB = require("./src/config/db");

// connectDB();

// app.listen(process.env.PORT, () =>
//   console.log(`🚀 AI Analysis Server on ${process.env.PORT}`)
// );

require("dotenv").config();
const app = require("./src/app");
const connectDB = require("./src/config/db");
const User = require("./src/models/User");

const seedAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@callintel.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "Admin@CallIntel2026";

    // Pehle purana admin delete karo (plaintext wala)
    await User.deleteOne({ email: adminEmail });
    console.log("🗑️ Old admin deleted");

    // new User() use karo — pre-save hook khud hash karega
    const admin = new User({
      fullName: "Super Admin",
      email: adminEmail,
      phone: "0000000000",
      company: "CallIntel",
      position: "Admin",
      password: adminPassword,
      role: "super_admin",
      isApproved: true,
    });

    await admin.save();
    console.log("✅ Admin seeded with hashed password:", adminEmail);
  } catch (err) {
    console.error("❌ Seed error:", err.message);
  }
};

connectDB().then(() => {
  seedAdmin();
  app.listen(process.env.PORT || 5001, () =>
    console.log(`🚀 AI Analysis Server on ${process.env.PORT || 5001}`)
  );
});