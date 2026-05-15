// backend/src/routes/audioRoutes.js

const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const { protect } = require("../middleware/authMiddleware");
// const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
    uploadAudio,
    getRecordings,
    getRecordingById,
    streamAudio,
    deleteRecording,
} = require("../controllers/audioController");

// ── Ensure uploads directory exists ──────────────────────────
const UPLOAD_DIR = path.join(__dirname, "../../uploads/audio");
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ── Multer config ─────────────────────────────────────────────
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${uuidv4()}${ext}`);
    },
});

const fileFilter = (req, file, cb) => {
    const allowedExtensions = [".mp3", ".wav", ".m4a", ".ogg", ".webm"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error("Only audio files (MP3, WAV, M4A, OGG, WEBM) are allowed."), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB max
});

// ── All routes require login ──────────────────────────────────
router.use(protect);

// Upload
router.post("/upload", upload.single("audioFile"), uploadAudio);

// List all recordings
router.get("/", getRecordings);

// Get single recording metadata
router.get("/:id", getRecordingById);

// Stream audio (used by the browser's audio player)
router.get("/:id/stream", streamAudio);

// Delete
router.delete("/:id", deleteRecording);

module.exports = router;