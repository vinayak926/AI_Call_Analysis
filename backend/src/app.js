// const express = require("express");
// const cors = require("cors");
// const path = require("path");
// const fs = require("fs");
// const audioRoutes = require("./routes/audioRoutes");

// const app = express();

// // ── Ensure upload directory exists ──────────────────
// const uploadDir = process.env.UPLOAD_DIR || "./uploads";
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
// }

// app.use(cors());
// app.use(express.json());

// // ── Serve uploaded audio files (for playback in UI) ─
// app.use("/uploads", express.static(path.resolve(uploadDir)));

// // ── Routes ───────────────────────────────────────────
// app.use("/api/auth", require("./routes/authRoutes"));
// app.use("/api/calls", require("./routes/callRoutes"));
// app.use("/api/audio", audioRoutes);
// app.use("/api/analysis", require("./routes/analysisRoutes"));
// // app.use("/api/reports", require("./routes/reportRoutes")); // Phase 2

// // ── Health check ─────────────────────────────────────
// app.get("/", (req, res) => {
//   res.json({ message: "🚀 CallIntel AI Backend Running" });
// });

// module.exports = app;

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();

// ── Ensure BOTH upload directories exist ──────────────────────────
// BUG FIX: app.js only created ./uploads, but audioRoutes.js saves
// files to ./uploads/audio. If that subdir doesn't exist multer throws
// ENOENT and the upload silently fails.
const uploadDirs = [
  process.env.UPLOAD_DIR || path.join(__dirname, "../../uploads"),
  path.join(__dirname, "../../uploads/audio"),
];
uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created upload directory: ${dir}`);
  }
});

// ── CORS ──────────────────────────────────────────────────────────
// BUG FIX: bare cors() rejects cross-origin requests with credentials
// from Vite dev server (localhost:5173). Must explicitly allow the
// frontend origin and credentials so Authorization headers pass through.
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Serve uploaded audio files (for playback in UI) ──────────────
const uploadRootDir =
  process.env.UPLOAD_DIR || path.join(__dirname, "../../uploads");
app.use("/uploads", express.static(path.resolve(uploadRootDir)));

// ── Routes ────────────────────────────────────────────────────────
// BUG FIX: Original app.js only registered audioRoutes.
// authRoutes, callRoutes, and analysisRoutes were missing — they exist
// in the routes folder but were never mounted. All /api/auth, /api/calls
// and /api/analysis calls returned 404.
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/calls", require("./routes/callRoutes"));
app.use("/api/audio", require("./routes/audioRoutes"));
app.use("/api/analysis", require("./routes/analysisRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));

// ── Global error handler ─────────────────────────────────────────
// BUG FIX: No error handler existed, so multer file-filter errors
// (wrong extension) and other thrown errors crashed the process or
// returned an empty 500 with no body, confusing the frontend.
app.use((err, req, res, next) => {
  console.error("Global error:", err.message);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ message: err.message || "Internal server error" });
});

// ── Health check ─────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ message: "🚀 CallIntel AI Backend Running" });
});

module.exports = app;