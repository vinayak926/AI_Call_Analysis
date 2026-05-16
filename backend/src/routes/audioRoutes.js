// // backend/src/routes/audioRoutes.js

// const express = require("express");
// const router = express.Router();
// const multer = require("multer");
// const path = require("path");
// const fs = require("fs");
// const { v4: uuidv4 } = require("uuid");
// const { protect } = require("../middleware/authMiddleware");
// // const { protect, adminOnly } = require("../middleware/authMiddleware");
// const {
//     uploadAudio,
//     getRecordings,
//     getRecordingById,
//     streamAudio,
//     deleteRecording,
// } = require("../controllers/audioController");

// // ── Ensure uploads directory exists ──────────────────────────
// const UPLOAD_DIR = path.join(__dirname, "../../uploads/audio");
// if (!fs.existsSync(UPLOAD_DIR)) {
//     fs.mkdirSync(UPLOAD_DIR, { recursive: true });
// }

// // ── Multer config ─────────────────────────────────────────────
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, UPLOAD_DIR);
//     },
//     filename: (req, file, cb) => {
//         const ext = path.extname(file.originalname).toLowerCase();
//         cb(null, `${uuidv4()}${ext}`);
//     },
// });

// const fileFilter = (req, file, cb) => {
//     const allowedExtensions = [".mp3", ".wav", ".m4a", ".ogg", ".webm"];
//     const ext = path.extname(file.originalname).toLowerCase();
//     if (allowedExtensions.includes(ext)) {
//         cb(null, true);
//     } else {
//         cb(new Error("Only audio files (MP3, WAV, M4A, OGG, WEBM) are allowed."), false);
//     }
// };

// const upload = multer({
//     storage,
//     fileFilter,
//     limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB max
// });

// // ── All routes require login ──────────────────────────────────
// router.use(protect);

// // Upload
// router.post("/upload", upload.single("audioFile"), uploadAudio);

// // List all recordings
// router.get("/", getRecordings);

// // Get single recording metadata
// router.get("/:id", getRecordingById);

// // Stream audio (used by the browser's audio player)
// router.get("/:id/stream", streamAudio);

// // ── Trigger AI analysis on a recording ───────────────────
// // POST /api/audio/:id/analyse
// router.post("/:id/analyse", async (req, res) => {
//     try {
//         const AudioRecording = require("../models/AudioRecording");
//         const recording = await AudioRecording.findById(req.params.id);
//         if (!recording) {
//             return res.status(404).json({ message: "Recording not found." });
//         }

//         // Check ownership (non-admins can only analyse their own)
//         const isAdmin = ["super_admin", "company_admin"].includes(req.user.role);
//         if (!isAdmin && recording.uploadedBy.toString() !== req.user._id.toString()) {
//             return res.status(403).json({ message: "Access denied." });
//         }

//         // Import and run the analysis worker
//         const { processAudioRecording } = require("../services/analysisWorker");

//         // Fire async — don't block the response
//         processAudioRecording(req.params.id).catch((err) => {
//             console.error(`Analysis failed for ${req.params.id}:`, err.message);
//         });

//         res.status(202).json({
//             message: "AI analysis started.",
//             audioRecordingId: req.params.id,
//         });
//     } catch (error) {
//         console.error("Analyse trigger error:", error);
//         res.status(500).json({ message: "Failed to start analysis.", error: error.message });
//     }
// });

// // Delete
// router.delete("/:id", deleteRecording);

// module.exports = router;

// backend/src/routes/audioRoutes.js

const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const { protect } = require("../middleware/authMiddleware");
const {
    uploadAudio,
    getRecordings,
    getRecordingById,
    streamAudio,
    deleteRecording,
} = require("../controllers/audioController");

// ── Ensure uploads/audio directory exists ─────────────────────────
// BUG FIX: Original path was correct but only created here; if
// audioRoutes is loaded before app.js mkdir call, race condition could
// cause ENOENT on first upload. We create it here too (idempotent).
const UPLOAD_DIR = path.join(__dirname, "../../uploads/audio");
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ── Multer config ──────────────────────────────────────────────────
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
        cb(
            Object.assign(
                new Error("Only audio files (MP3, WAV, M4A, OGG, WEBM) are allowed."),
                { status: 400 }
            ),
            false
        );
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB max
});

// ── All routes require login ───────────────────────────────────────
router.use(protect);

// Upload single audio file
router.post(
    "/upload",
    (req, res, next) => {
        upload.single("audioFile")(req, res, (err) => {
            if (err) return next(err);
            next();
        });
    },
    uploadAudio
);

// List all recordings
router.get("/", getRecordings);

// ── Static sub-routes BEFORE :id param routes ─────────────────────
// (no static sub-routes currently, but pattern kept for safety)

// Get single recording metadata
router.get("/:id", getRecordingById);

// Stream audio (used by the browser's audio player)
router.get("/:id/stream", streamAudio);

// Trigger AI analysis on a recording
// POST /api/audio/:id/analyse
router.post("/:id/analyse", async (req, res) => {
    try {
        const AudioRecording = require("../models/AudioRecording");
        const recording = await AudioRecording.findById(req.params.id);
        if (!recording) {
            return res.status(404).json({ message: "Recording not found." });
        }

        const isAdmin = ["super_admin", "company_admin"].includes(req.user.role);
        if (
            !isAdmin &&
            recording.uploadedBy.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({ message: "Access denied." });
        }

        const { processAudioRecording } = require("../services/analysisWorker");

        // Fire async — don't block the response
        processAudioRecording(req.params.id).catch((err) => {
            console.error(`Analysis failed for ${req.params.id}:`, err.message);
        });

        res.status(202).json({
            message: "AI analysis started.",
            audioRecordingId: req.params.id,
        });
    } catch (error) {
        console.error("Analyse trigger error:", error);
        res
            .status(500)
            .json({ message: "Failed to start analysis.", error: error.message });
    }
});

// Delete recording
router.delete("/:id", deleteRecording);

module.exports = router;