// routes/callRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { protect } = require("../middleware/authMiddleware");
const callController = require("../controllers/callController");

// ── Multer storage config ──────────────────────────────
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, process.env.UPLOAD_DIR || "./uploads");
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${uuidv4()}${ext}`);
    },
});

const fileFilter = (req, file, cb) => {
    const allowed = [".mp3", ".wav", ".m4a"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error("Only MP3, WAV, and M4A files are allowed."), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 100) * 1024 * 1024 },
});

// ── Routes ─────────────────────────────────────────────
// Upload one or more audio files
router.post("/upload", protect, upload.array("audioFiles", 10), callController.uploadCalls);

// Get all calls for the logged-in user (or all calls for admin)
router.get("/", protect, callController.getCalls);

// Get a single call by ID
router.get("/:id", protect, callController.getCallById);

// Get processing status of a call (used for polling)
router.get("/:id/status", protect, callController.getCallStatus);

module.exports = router;