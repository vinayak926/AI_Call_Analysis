// backend/src/controllers/audioController.js

const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const AudioRecording = require("../models/AudioRecording");

// ── MIME type map — browser needs the correct type to play audio ──
// Multer stores whatever the OS/browser sends (unreliable for M4A).
// We derive it from the file extension instead — always accurate.
const MIME_BY_EXT = {
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".m4a": "audio/mp4",      
    ".ogg": "audio/ogg",
    ".webm": "audio/webm",
};

function getMimeType(filePath, fallback = "audio/mpeg") {
    const ext = require("path").extname(filePath).toLowerCase();
    return MIME_BY_EXT[ext] || fallback;
}

// ─────────────────────────────────────────────────────────────
// POST /api/audio/upload
// Upload one audio file
// ─────────────────────────────────────────────────────────────
exports.uploadAudio = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No audio file received." });
        }

        const fileSizeMB = +(req.file.size / (1024 * 1024)).toFixed(2);

        const recording = await AudioRecording.create({
            uploadedBy: req.user._id,
            originalFileName: req.file.originalname,
            storedFileName: req.file.filename,
            filePath: req.file.path,
            fileSizeMB,
            mimeType: req.file.mimetype,
            title: req.body.title || req.file.originalname,
            notes: req.body.notes || "",
        });

        res.status(201).json({
            message: "Audio file uploaded successfully.",
            recording,
        });
    } catch (error) {
        console.error("Audio upload error:", error);
        res.status(500).json({ message: "Upload failed.", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────
// GET /api/audio
// List all recordings (admin sees all, others see their own)
// ─────────────────────────────────────────────────────────────
exports.getRecordings = async (req, res) => {
    try {
        const isAdmin = ["super_admin", "admin"].includes(req.user.role);
        const filter = isAdmin ? {} : { uploadedBy: req.user._id };

        const recordings = await AudioRecording.find(filter)
            .populate("uploadedBy", "fullName email role")
            .sort({ createdAt: -1 });

        res.status(200).json({ recordings });
    } catch (error) {
        res.status(500).json({ message: "Server error.", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────
// GET /api/audio/:id
// Get single recording metadata
// ─────────────────────────────────────────────────────────────
exports.getRecordingById = async (req, res) => {
    try {
        const recording = await AudioRecording.findById(req.params.id).populate(
            "uploadedBy",
            "fullName email role"
        );

        if (!recording) {
            return res.status(404).json({ message: "Recording not found." });
        }

        // Non-admins can only see their own recordings
        const isAdmin = ["super_admin", "admin"].includes(req.user.role);
        if (
            !isAdmin &&
            recording.uploadedBy._id.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({ message: "Access denied." });
        }

        res.status(200).json({ recording });
    } catch (error) {
        res.status(500).json({ message: "Server error.", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────
// GET /api/audio/:id/stream
// Stream the audio file to the browser (supports range requests
// so the HTML5 audio player can seek forward/backward)
// ─────────────────────────────────────────────────────────────
exports.streamAudio = async (req, res) => {
    try {
        const recording = await AudioRecording.findById(req.params.id);

        if (!recording) {
            return res.status(404).json({ message: "Recording not found." });
        }

        // Access control
        const isAdmin = ["super_admin", "admin"].includes(req.user.role);
        if (
            !isAdmin &&
            recording.uploadedBy.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({ message: "Access denied." });
        }

        const filePath = path.resolve(recording.filePath);

        // Check file still exists on disk
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: "Audio file not found on server." });
        }

        const stat = fs.statSync(filePath);
        const fileSize = stat.size;
        const range = req.headers.range;

        if (range) {
            // ── Range request (browser seeking) ──────────────────
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunkSize = end - start + 1;

            const fileStream = fs.createReadStream(filePath, { start, end });

            res.writeHead(206, {
                "Content-Range": `bytes ${start}-${end}/${fileSize}`,
                "Accept-Ranges": "bytes",
                "Content-Length": chunkSize,
                // "Content-Type": recording.mimeType || "audio/mpeg",
                "Content-Type": getMimeType(recording.filePath, recording.mimeType),
            });

            fileStream.pipe(res);
        } else {
            // ── Full file request ─────────────────────────────────
            res.writeHead(200, {
                "Content-Length": fileSize,
                // "Content-Type": recording.mimeType || "audio/mpeg",
                "Content-Type": getMimeType(recording.filePath, recording.mimeType),
                "Accept-Ranges": "bytes",
            });

            fs.createReadStream(filePath).pipe(res);
        }
    } catch (error) {
        console.error("Stream error:", error);
        res.status(500).json({ message: "Streaming failed.", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────
// DELETE /api/audio/:id
// Delete recording from DB and disk
// ─────────────────────────────────────────────────────────────
exports.deleteRecording = async (req, res) => {
    try {
        const recording = await AudioRecording.findById(req.params.id);

        if (!recording) {
            return res.status(404).json({ message: "Recording not found." });
        }

        const isAdmin = ["super_admin", "admin"].includes(req.user.role);
        if (
            !isAdmin &&
            recording.uploadedBy.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({ message: "Access denied." });
        }

        // Delete file from disk
        const filePath = path.resolve(recording.filePath);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await AudioRecording.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: "Recording deleted successfully." });
    } catch (error) {
        res.status(500).json({ message: "Server error.", error: error.message });
    }
};