// // routes/callRoutes.js
// const express = require("express");
// const router = express.Router();
// const multer = require("multer");
// const path = require("path");
// const { v4: uuidv4 } = require("uuid");
// const { protect } = require("../middleware/authMiddleware");
// const callController = require("../controllers/callController");

// // ── Multer storage config ──────────────────────────────
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, process.env.UPLOAD_DIR || "./uploads");
//     },
//     filename: (req, file, cb) => {
//         const ext = path.extname(file.originalname).toLowerCase();
//         cb(null, `${uuidv4()}${ext}`);
//     },
// });

// const fileFilter = (req, file, cb) => {
//     const allowed = [".mp3", ".wav", ".m4a"];
//     const ext = path.extname(file.originalname).toLowerCase();
//     if (allowed.includes(ext)) {
//         cb(null, true);
//     } else {
//         cb(new Error("Only MP3, WAV, and M4A files are allowed."), false);
//     }
// };

// const upload = multer({
//     storage,
//     fileFilter,
//     limits: { fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 100) * 1024 * 1024 },
// });

// // ── Routes ─────────────────────────────────────────────
// // Upload one or more audio files
// router.post("/upload", protect, upload.array("audioFiles", 10), callController.uploadCalls);

// // Get all calls for the logged-in user (or all calls for admin)
// router.get("/", protect, callController.getCalls);

// // Get a single call by ID
// router.get("/:id", protect, callController.getCallById);

// // Get processing status of a call (used for polling)
// router.get("/:id/status", protect, callController.getCallStatus);

// module.exports = router;


// routes/callRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const callController = require("../controllers/callController");
const { analyseCall, reanalyseCall } = callController;

// ── MIME type map for correct browser audio playback ─────────────
const MIME_BY_EXT = {
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".m4a": "audio/mp4",
    ".ogg": "audio/ogg",
    ".webm": "audio/webm",
};
function getMimeType(filePath, fallback = "audio/mpeg") {
    const ext = path.extname(filePath || "").toLowerCase();
    return MIME_BY_EXT[ext] || fallback;
}


// ── BUG FIX: Upload directory ─────────────────────────────────────
// Original used process.env.UPLOAD_DIR || "./uploads" which resolves
// relative to wherever node is launched from (project root), not the
// src/ directory. Using path.join(__dirname, ...) makes it reliable
// regardless of where the process is started.
const UPLOAD_DIR = process.env.UPLOAD_DIR
    ? path.resolve(process.env.UPLOAD_DIR)
    : path.join(__dirname, "../../uploads");

// Ensure directory exists at route-load time
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ── Multer storage config ─────────────────────────────────────────
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
    const allowed = [".mp3", ".wav", ".m4a", ".ogg", ".webm"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
        cb(null, true);
    } else {
        // BUG FIX: passing an Error as first arg to cb causes multer to emit
        // it so our global error handler can return a proper 400 JSON response
        // instead of crashing the upload silently.
        cb(
            Object.assign(new Error("Only MP3, WAV, and M4A files are allowed."), {
                status: 400,
            }),
            false
        );
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize:
            (parseInt(process.env.MAX_FILE_SIZE_MB) || 100) * 1024 * 1024,
    },
});

// ── Routes ────────────────────────────────────────────────────────
// Upload one or more audio files
router.post(
    "/upload",
    protect,
    (req, res, next) => {
        // BUG FIX: wrap multer so its errors flow to the global error handler
        // instead of crashing the request unhandled.
        upload.array("audioFiles", 10)(req, res, (err) => {
            if (err) return next(err);
            next();
        });
    },
    callController.uploadCalls
);

// Get all calls (admin sees all, user sees own)
router.get("/", protect, callController.getCalls);

// ── Static sub-routes must come BEFORE :id param routes ─────────────

// Get single call by ID
router.get("/:id", protect, callController.getCallById);

// Polling endpoint — lightweight status check
router.get("/:id/status", protect, callController.getCallStatus);

// Stream audio for a Call document
// GET /api/calls/:id/stream
router.get("/:id/stream", protect, async (req, res) => {
    try {
        const AudioRecording = require("../models/AudioRecording");
        const c = await AudioRecording.findById(req.params.id).select("filePath mimeType storedFileName uploadedBy");
        if (!c) return res.status(404).json({ message: "Call not found" });

        const isAdmin = ["super_admin", "company_admin"].includes(req.user.role);
        if (!isAdmin && c.uploadedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Access denied." });
        }

        const fs = require("fs");
        const path = require("path");
        const absPath = path.resolve(c.filePath);

        if (!fs.existsSync(absPath)) {
            return res.status(404).json({ message: "Audio file not found on server." });
        }

        const stat = fs.statSync(absPath);
        const range = req.headers.range;

        res.setHeader("Content-Type", getMimeType(c.filePath, c.mimeType));
        res.setHeader("Accept-Ranges", "bytes");

        if (range) {
            const [startStr, endStr] = range.replace(/bytes=/, "").split("-");
            const start = parseInt(startStr, 10);
            const end = endStr ? parseInt(endStr, 10) : stat.size - 1;
            const chunkSize = end - start + 1;
            res.writeHead(206, {
                "Content-Range": `bytes ${start}-${end}/${stat.size}`,
                "Content-Length": chunkSize,
            });
            fs.createReadStream(absPath, { start, end }).pipe(res);
        } else {
            res.setHeader("Content-Length", stat.size);
            fs.createReadStream(absPath).pipe(res);
        }
    } catch (err) {
        console.error("Stream error:", err);
        res.status(500).json({ message: "Stream failed.", error: err.message });
    }
});

// Trigger AI analysis
// POST /api/calls/:id/analyse
router.post("/:id/analyse", protect, analyseCall);

// Force re-analysis (admin only)
// POST /api/calls/:id/reanalyse
router.post("/:id/reanalyse", protect, adminOnly, reanalyseCall);

module.exports = router;