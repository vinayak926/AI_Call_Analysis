const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const audioRoutes = require("./routes/audioRoutes");

const app = express();

// ── Ensure upload directory exists ──────────────────
const uploadDir = process.env.UPLOAD_DIR || "./uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(cors());
app.use(express.json());

// ── Serve uploaded audio files (for playback in UI) ─
app.use("/uploads", express.static(path.resolve(uploadDir)));

// ── Routes ───────────────────────────────────────────
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/calls", require("./routes/callRoutes"));
app.use("/api/audio", audioRoutes);
app.use("/api/analysis", require("./routes/analysisRoutes"));
// app.use("/api/reports", require("./routes/reportRoutes")); // Phase 2

// ── Health check ─────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ message: "🚀 CallIntel AI Backend Running" });
});

module.exports = app;