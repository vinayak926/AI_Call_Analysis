// // controllers/callController.js
// const Call = require("../models/Call");
// const path = require("path");
// const fs = require("fs");

// // ── POST /api/calls/upload ─────────────────────────────
// const uploadCalls = async (req, res) => {
//     try {
//         if (!req.files || req.files.length === 0) {
//             return res.status(400).json({ message: "No audio files received." });
//         }

//         const createdCalls = [];

//         for (const file of req.files) {
//             const fileSizeMB = +(file.size / (1024 * 1024)).toFixed(2);

//             const call = await Call.create({
//                 uploadedBy: req.user._id,
//                 originalFileName: file.originalname,
//                 storedFileName: file.filename,
//                 filePath: file.path,
//                 fileSizeMB,
//                 mimeType: file.mimetype,
//                 status: "pending",
//             });

//             createdCalls.push(call);

//             // TODO (Step 8): Enqueue the call ID into the Bull processing queue
//             // processingQueue.add({ callId: call._id });
//         }

//         res.status(201).json({
//             message: `${createdCalls.length} file(s) uploaded successfully. Processing will begin shortly.`,
//             calls: createdCalls,
//         });
//     } catch (error) {
//         console.error("Upload error:", error);
//         res.status(500).json({ message: "Upload failed.", error: error.message });
//     }
// };

// // ── GET /api/calls ─────────────────────────────────────
// const getCalls = async (req, res) => {
//     try {
//         const isAdmin = ["super_admin", "company_admin"].includes(req.user.role);
//         const filter = isAdmin ? {} : { uploadedBy: req.user._id };

//         const calls = await Call.find(filter)
//             .populate("uploadedBy", "fullName email")
//             .sort({ createdAt: -1 });

//         res.status(200).json({ calls });
//     } catch (error) {
//         res.status(500).json({ message: "Server error.", error: error.message });
//     }
// };

// // ── GET /api/calls/:id ────────────────────────────────
// const getCallById = async (req, res) => {
//     try {
//         const call = await Call.findById(req.params.id).populate("uploadedBy", "fullName email");

//         if (!call) return res.status(404).json({ message: "Call not found." });

//         // Operators can only view their own calls
//         const isAdmin = ["super_admin", "company_admin"].includes(req.user.role);
//         if (!isAdmin && call.uploadedBy._id.toString() !== req.user._id.toString()) {
//             return res.status(403).json({ message: "Access denied." });
//         }

//         res.status(200).json({ call });
//     } catch (error) {
//         res.status(500).json({ message: "Server error.", error: error.message });
//     }
// };

// // ── GET /api/calls/:id/status ────────────────────────
// const getCallStatus = async (req, res) => {
//     try {
//         const call = await Call.findById(req.params.id).select("status errorMessage");
//         if (!call) return res.status(404).json({ message: "Call not found." });
//         res.status(200).json({ status: call.status, errorMessage: call.errorMessage });
//     } catch (error) {
//         res.status(500).json({ message: "Server error.", error: error.message });
//     }
// };

// module.exports = { uploadCalls, getCalls, getCallById, getCallStatus };


// controllers/callController.js
const AudioRecording = require("../models/AudioRecording");
const CallAnalysis = require("../models/CallAnalysis");
const path = require("path");
const fs = require("fs");

// Lazy import to avoid circular require issues
function getWorker() {
    return require("../services/analysisWorker");
}

const isAdminUser = (user) =>
    ["super_admin", "company_admin"].includes(user.role);

// ── POST /api/calls/upload ─────────────────────────────────────────
// Now creates an AudioRecording (unified model) instead of Call
const uploadCalls = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: "No audio files received." });
        }

        const created = [];

        for (const file of req.files) {
            const fileSizeMB = +(file.size / (1024 * 1024)).toFixed(2);

            const recording = await AudioRecording.create({
                uploadedBy: req.user._id,
                originalFileName: file.originalname,
                storedFileName: file.filename,
                filePath: file.path,
                fileSizeMB,
                mimeType: file.mimetype,
                status: "pending",
            });

            created.push(recording);
        }

        res.status(201).json({
            message: `${created.length} file(s) uploaded successfully.`,
            calls: created,   // keep key as "calls" so frontend doesn't break
        });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ message: "Upload failed.", error: error.message });
    }
};

// ── GET /api/calls ─────────────────────────────────────────────────
const getCalls = async (req, res) => {
    try {
        const filter = isAdminUser(req.user) ? {} : { uploadedBy: req.user._id };

        const recordings = await AudioRecording.find(filter)
            .populate("uploadedBy", "fullName email")
            .sort({ createdAt: -1 });

        res.status(200).json({ calls: recordings });
    } catch (error) {
        res.status(500).json({ message: "Server error.", error: error.message });
    }
};

// ── GET /api/calls/:id ─────────────────────────────────────────────
const getCallById = async (req, res) => {
    try {
        const recording = await AudioRecording.findById(req.params.id)
            .populate("uploadedBy", "fullName email");

        if (!recording) return res.status(404).json({ message: "Call not found." });

        if (
            !isAdminUser(req.user) &&
            recording.uploadedBy._id.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({ message: "Access denied." });
        }

        res.status(200).json({ call: recording });
    } catch (error) {
        res.status(500).json({ message: "Server error.", error: error.message });
    }
};

// ── GET /api/calls/:id/status ──────────────────────────────────────
const getCallStatus = async (req, res) => {
    try {
        const recording = await AudioRecording.findById(req.params.id)
            .select("status");

        if (!recording) return res.status(404).json({ message: "Call not found." });

        // Also fetch analysis status if it exists
        const analysis = await CallAnalysis.findOne({ audioRecordingId: req.params.id })
            .select("status errorMessage processingTimeMs");

        res.status(200).json({
            status: recording.status,
            analysisStatus: analysis?.status || "not_started",
            errorMessage: analysis?.errorMessage || null,
            processingTimeMs: analysis?.processingTimeMs || null,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error.", error: error.message });
    }
};

// ── POST /api/calls/:id/analyse ────────────────────────────────────
// Delegates to analysisWorker (unified pipeline)
const analyseCall = async (req, res) => {
    try {
        const recording = await AudioRecording.findById(req.params.id);
        if (!recording) return res.status(404).json({ message: "Call not found." });

        if (!isAdminUser(req.user) && recording.uploadedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Access denied." });
        }

        const existing = await CallAnalysis.findOne({ audioRecordingId: req.params.id });
        if (existing && ["transcribing", "translating", "analysing"].includes(existing.status)) {
            return res.status(409).json({ message: "Already being processed." });
        }

        const { processAudioRecording } = getWorker();
        processAudioRecording(req.params.id).catch((err) => {
            console.error(`Call analysis failed for ${req.params.id}:`, err.message);
        });

        res.status(202).json({
            message: "Analysis started. Poll /api/calls/:id/status for updates.",
            callId: req.params.id,
        });
    } catch (error) {
        console.error("analyseCall error:", error);
        res.status(500).json({ message: "Failed to start analysis.", error: error.message });
    }
};

// ── POST /api/calls/:id/reanalyse ──────────────────────────────────
const reanalyseCall = async (req, res) => {
    try {
        const recording = await AudioRecording.findById(req.params.id);
        if (!recording) return res.status(404).json({ message: "Call not found." });

        // Delete previous analysis so pipeline runs fresh
        await CallAnalysis.deleteOne({ audioRecordingId: req.params.id });

        // Reset recording status
        recording.status = "pending";
        await recording.save();

        const { processAudioRecording } = getWorker();
        processAudioRecording(req.params.id).catch((err) => {
            console.error(`Re-analysis failed for ${req.params.id}:`, err.message);
        });

        res.status(202).json({
            message: "Re-analysis started. Previous results cleared.",
            callId: req.params.id,
        });
    } catch (error) {
        console.error("reanalyseCall error:", error);
        res.status(500).json({ message: "Re-analysis failed.", error: error.message });
    }
};

module.exports = { uploadCalls, getCalls, getCallById, getCallStatus, analyseCall, reanalyseCall };