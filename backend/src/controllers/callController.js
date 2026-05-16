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
const Call = require("../models/Call");
const path = require("path");
const fs = require("fs");

// Lazy import to avoid circular require issues at module load time
function getWorker() {
    return require("../services/callAnalysisWorker");
}

// ── Shared admin-role helper ──────────────────────────────────────
// BUG FIX: Original getCalls/getCallById used "company_admin" but
// authMiddleware.adminOnly and the User model both use "company_admin".
// However, the User model enum is ["counselor","company_admin","super_admin"].
// The call controller used "super_admin" and "company_admin" consistently
// which is correct — the real mismatch was that the admin seeder in
// server.js set role: "super_admin" so the seeded admin CAN see all calls.
// Unified helper keeps both in one place so future changes are easy.
const isAdminUser = (user) =>
    ["super_admin", "company_admin"].includes(user.role);

// ── POST /api/calls/upload ─────────────────────────────────────────
const uploadCalls = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: "No audio files received." });
        }

        const createdCalls = [];

        for (const file of req.files) {
            const fileSizeMB = +(file.size / (1024 * 1024)).toFixed(2);

            const call = await Call.create({
                uploadedBy: req.user._id,
                originalFileName: file.originalname,
                storedFileName: file.filename,
                // BUG FIX: store a relative path so the record stays valid even
                // if the server is restarted from a different working directory.
                filePath: file.path,
                fileSizeMB,
                mimeType: file.mimetype,
                status: "pending",
            });

            createdCalls.push(call);

            // TODO (Phase 2): enqueue into Bull processing queue
            // processingQueue.add({ callId: call._id });
        }

        res.status(201).json({
            message: `${createdCalls.length} file(s) uploaded successfully. Processing will begin shortly.`,
            calls: createdCalls,
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

        const calls = await Call.find(filter)
            .populate("uploadedBy", "fullName email")
            .sort({ createdAt: -1 });

        res.status(200).json({ calls });
    } catch (error) {
        res.status(500).json({ message: "Server error.", error: error.message });
    }
};

// ── GET /api/calls/:id ─────────────────────────────────────────────
const getCallById = async (req, res) => {
    try {
        const call = await Call.findById(req.params.id).populate(
            "uploadedBy",
            "fullName email"
        );

        if (!call) return res.status(404).json({ message: "Call not found." });

        // BUG FIX: original compared call.uploadedBy._id but after .populate()
        // uploadedBy is a full object; before populate it's just an ObjectId.
        // Using toString() on both sides handles both cases safely.
        if (
            !isAdminUser(req.user) &&
            call.uploadedBy._id.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({ message: "Access denied." });
        }

        res.status(200).json({ call });
    } catch (error) {
        res.status(500).json({ message: "Server error.", error: error.message });
    }
};

// ── GET /api/calls/:id/status ──────────────────────────────────────
// Lightweight polling endpoint — used by CallDetailPage every 5 s
const getCallStatus = async (req, res) => {
    try {
        const call = await Call.findById(req.params.id).select(
            "status errorMessage"
        );
        if (!call) return res.status(404).json({ message: "Call not found." });
        res
            .status(200)
            .json({ status: call.status, errorMessage: call.errorMessage });
    } catch (error) {
        res.status(500).json({ message: "Server error.", error: error.message });
    }
};

// ── POST /api/calls/:id/analyse ───────────────────────────────────
// Trigger AI analysis on a Call document (async, non-blocking)
const analyseCall = async (req, res) => {
    try {
        const call = await Call.findById(req.params.id);
        if (!call) return res.status(404).json({ message: "Call not found." });

        if (!isAdminUser(req.user) && call.uploadedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Access denied." });
        }

        if (call.status === "processing") {
            return res.status(409).json({ message: "This call is already being processed." });
        }

        // Mark as processing immediately
        call.status = "processing";
        call.errorMessage = null;
        await call.save();

        // Fire the call-specific worker async (don't await)
        const { processCall } = getWorker();
        processCall(call._id.toString()).catch((err) => {
            console.error(`Call analysis failed for ${call._id}:`, err.message);
        });

        res.status(202).json({
            message: "Analysis started. Poll /api/calls/:id/status for updates.",
            callId: call._id,
        });
    } catch (error) {
        console.error("analyseCall error:", error);
        res.status(500).json({ message: "Failed to start analysis.", error: error.message });
    }
};

// ── POST /api/calls/:id/reanalyse (admin only) ─────────────────────
const reanalyseCall = async (req, res) => {
    try {
        const call = await Call.findById(req.params.id);
        if (!call) return res.status(404).json({ message: "Call not found." });

        // Clear previous analysis fields
        call.status = "processing";
        call.errorMessage = null;
        call.studentName = null;
        call.counsellorName = null;
        call.courseInterest = null;
        call.studentCity = null;
        call.keyConcerns = [];
        call.sentiment = null;
        call.leadScore = null;
        call.callSummary = null;
        call.transcriptOriginal = null;
        call.transcriptEnglish = null;
        call.detectedLanguage = null;
        call.scores = {};
        await call.save();

        const { processCall } = getWorker();
        processCall(call._id.toString()).catch((err) => {
            console.error(`Re-analysis failed for ${call._id}:`, err.message);
        });

        res.status(202).json({
            message: "Re-analysis started. Previous results cleared.",
            callId: call._id,
        });
    } catch (error) {
        console.error("reanalyseCall error:", error);
        res.status(500).json({ message: "Re-analysis failed.", error: error.message });
    }
};

module.exports = { uploadCalls, getCalls, getCallById, getCallStatus, analyseCall, reanalyseCall };