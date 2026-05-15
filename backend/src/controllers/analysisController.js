// backend/src/controllers/analysisController.js
// ─────────────────────────────────────────────────────────────────
// Controller for AI Analysis endpoints
// ─────────────────────────────────────────────────────────────────

const CallAnalysis = require("../models/CallAnalysis");
const AudioRecording = require("../models/AudioRecording");
const { processAudioRecording, processBatch } = require("../services/analysisWorker");

// ─────────────────────────────────────────────────────────────────
// POST /api/analysis/process/:audioRecordingId
// Trigger AI analysis for a single audio recording
// ─────────────────────────────────────────────────────────────────
const triggerAnalysis = async (req, res) => {
    try {
        const { audioRecordingId } = req.params;

        // Validate the recording exists
        const recording = await AudioRecording.findById(audioRecordingId);
        if (!recording) {
            return res.status(404).json({ message: "Audio recording not found." });
        }

        // Check ownership (non-admins can only analyse their own recordings)
        const isAdmin = ["super_admin", "company_admin"].includes(req.user.role);
        if (!isAdmin && recording.uploadedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Access denied." });
        }

        // Check if already being processed
        const existing = await CallAnalysis.findOne({ audioRecordingId });
        if (existing && ["transcribing", "translating", "analysing"].includes(existing.status)) {
            return res.status(409).json({
                message: "This recording is already being processed.",
                status: existing.status,
            });
        }

        // Start processing (async — don't await, respond immediately)
        // The client can poll the status endpoint
        processAudioRecording(audioRecordingId).catch((err) => {
            console.error(`Background analysis failed for ${audioRecordingId}:`, err.message);
        });

        res.status(202).json({
            message: "AI analysis started. Poll /api/analysis/:audioRecordingId/status for updates.",
            audioRecordingId,
        });
    } catch (error) {
        console.error("Trigger analysis error:", error);
        res.status(500).json({ message: "Failed to start analysis.", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────
// POST /api/analysis/process-sync/:audioRecordingId
// Trigger AI analysis and WAIT for the result (synchronous)
// Useful for testing and single-file processing
// ─────────────────────────────────────────────────────────────────
const triggerAnalysisSync = async (req, res) => {
    try {
        const { audioRecordingId } = req.params;

        const recording = await AudioRecording.findById(audioRecordingId);
        if (!recording) {
            return res.status(404).json({ message: "Audio recording not found." });
        }

        const isAdmin = ["super_admin", "company_admin"].includes(req.user.role);
        if (!isAdmin && recording.uploadedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Access denied." });
        }

        // Process synchronously — wait for completion
        const result = await processAudioRecording(audioRecordingId);

        res.status(200).json({
            message: "AI analysis completed successfully.",
            analysis: result,
        });
    } catch (error) {
        console.error("Sync analysis error:", error);
        res.status(500).json({ message: "Analysis failed.", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────
// POST /api/analysis/batch
// Trigger batch analysis for multiple recordings
// Body: { audioRecordingIds: ["id1", "id2", ...] }
// ─────────────────────────────────────────────────────────────────
const triggerBatchAnalysis = async (req, res) => {
    try {
        const { audioRecordingIds } = req.body;

        if (!Array.isArray(audioRecordingIds) || audioRecordingIds.length === 0) {
            return res.status(400).json({ message: "audioRecordingIds array is required." });
        }

        if (audioRecordingIds.length > 20) {
            return res.status(400).json({ message: "Maximum 20 recordings per batch." });
        }

        // Start batch processing in background
        processBatch(audioRecordingIds).catch((err) => {
            console.error("Batch processing error:", err.message);
        });

        res.status(202).json({
            message: `Batch analysis started for ${audioRecordingIds.length} recordings.`,
            audioRecordingIds,
        });
    } catch (error) {
        console.error("Batch analysis error:", error);
        res.status(500).json({ message: "Batch processing failed.", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────
// GET /api/analysis/:audioRecordingId
// Retrieve the full analysis result for a recording
// ─────────────────────────────────────────────────────────────────
const getAnalysis = async (req, res) => {
    try {
        const { audioRecordingId } = req.params;

        const analysis = await CallAnalysis.findOne({ audioRecordingId })
            .populate("audioRecordingId", "originalFileName storedFileName filePath title uploadedBy");

        if (!analysis) {
            return res.status(404).json({ message: "Analysis not found for this recording." });
        }

        // Check ownership
        const recording = await AudioRecording.findById(audioRecordingId);
        if (recording) {
            const isAdmin = ["super_admin", "company_admin"].includes(req.user.role);
            if (!isAdmin && recording.uploadedBy.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: "Access denied." });
            }
        }

        res.status(200).json({ analysis });
    } catch (error) {
        res.status(500).json({ message: "Server error.", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────
// GET /api/analysis/:audioRecordingId/status
// Lightweight polling endpoint — returns only status info
// ─────────────────────────────────────────────────────────────────
const getAnalysisStatus = async (req, res) => {
    try {
        const { audioRecordingId } = req.params;

        const analysis = await CallAnalysis.findOne({ audioRecordingId })
            .select("status errorMessage processingTimeMs updatedAt");

        if (!analysis) {
            return res.status(404).json({
                status: "not_started",
                message: "No analysis has been triggered for this recording.",
            });
        }

        res.status(200).json({
            audioRecordingId,
            status: analysis.status,
            errorMessage: analysis.errorMessage,
            processingTimeMs: analysis.processingTimeMs,
            updatedAt: analysis.updatedAt,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error.", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────
// GET /api/analysis
// List all analyses (admin: all, operator: own only)
// Supports query filters: ?sentiment=Positive&minScore=7&status=completed
// ─────────────────────────────────────────────────────────────────
const getAllAnalyses = async (req, res) => {
    try {
        const isAdmin = ["super_admin", "company_admin"].includes(req.user.role);

        // Build filter
        const filter = { status: "completed" };

        // Non-admins: only their own recordings
        if (!isAdmin) {
            const userRecordingIds = await AudioRecording.find({ uploadedBy: req.user._id })
                .select("_id")
                .lean();
            filter.audioRecordingId = { $in: userRecordingIds.map((r) => r._id) };
        }

        // Optional query filters
        if (req.query.sentiment) {
            filter.sentiment = req.query.sentiment;
        }
        if (req.query.minScore) {
            filter.leadScore = { $gte: parseInt(req.query.minScore, 10) };
        }
        if (req.query.maxScore) {
            filter.leadScore = {
                ...filter.leadScore,
                $lte: parseInt(req.query.maxScore, 10),
            };
        }
        if (req.query.status) {
            filter.status = req.query.status;
        }

        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 25;
        const skip = (page - 1) * limit;

        const [analyses, total] = await Promise.all([
            CallAnalysis.find(filter)
                .populate("audioRecordingId", "originalFileName title uploadedBy createdAt")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            CallAnalysis.countDocuments(filter),
        ]);

        res.status(200).json({
            analyses,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        res.status(500).json({ message: "Server error.", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────
// POST /api/analysis/:audioRecordingId/reanalyse
// Force re-analysis (Admin only) — deletes existing and re-runs
// ─────────────────────────────────────────────────────────────────
const reanalyse = async (req, res) => {
    try {
        const { audioRecordingId } = req.params;

        const recording = await AudioRecording.findById(audioRecordingId);
        if (!recording) {
            return res.status(404).json({ message: "Audio recording not found." });
        }

        // Delete existing analysis
        await CallAnalysis.deleteOne({ audioRecordingId });

        // Re-trigger
        processAudioRecording(audioRecordingId).catch((err) => {
            console.error(`Re-analysis failed for ${audioRecordingId}:`, err.message);
        });

        res.status(202).json({
            message: "Re-analysis started. Previous results cleared.",
            audioRecordingId,
        });
    } catch (error) {
        console.error("Re-analyse error:", error);
        res.status(500).json({ message: "Re-analysis failed.", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────
// GET /api/analysis/dashboard/stats
// Admin dashboard — aggregated metrics
// ─────────────────────────────────────────────────────────────────
const getDashboardStats = async (req, res) => {
    try {
        const [
            totalAnalysed,
            sentimentCounts,
            avgScores,
            followUpCount,
            topConcerns,
        ] = await Promise.all([
            // Total completed analyses
            CallAnalysis.countDocuments({ status: "completed" }),

            // Sentiment distribution
            CallAnalysis.aggregate([
                { $match: { status: "completed" } },
                { $group: { _id: "$sentiment", count: { $sum: 1 } } },
            ]),

            // Average scores
            CallAnalysis.aggregate([
                { $match: { status: "completed" } },
                {
                    $group: {
                        _id: null,
                        avgLeadScore: { $avg: "$leadScore" },
                        avgCommunication: { $avg: "$communicationScore" },
                        avgEngagement: { $avg: "$engagementScore" },
                        avgConfidence: { $avg: "$counsellorConfidenceScore" },
                        avgClosingProbability: { $avg: "$closingProbability" },
                    },
                },
            ]),

            // Follow-ups needed
            CallAnalysis.countDocuments({ status: "completed", followUpRequired: true }),

            // Top concerns
            CallAnalysis.aggregate([
                { $match: { status: "completed" } },
                { $unwind: "$keyConcerns" },
                { $group: { _id: "$keyConcerns", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 },
            ]),
        ]);

        // Format sentiment counts
        const sentiment = {};
        sentimentCounts.forEach((s) => {
            sentiment[s._id] = s.count;
        });

        const scores = avgScores[0] || {};

        res.status(200).json({
            totalAnalysed,
            sentiment,
            followUpCount,
            averages: {
                leadScore: Math.round((scores.avgLeadScore || 0) * 10) / 10,
                communicationScore: Math.round((scores.avgCommunication || 0) * 10) / 10,
                engagementScore: Math.round((scores.avgEngagement || 0) * 10) / 10,
                confidenceScore: Math.round((scores.avgConfidence || 0) * 10) / 10,
                closingProbability: Math.round((scores.avgClosingProbability || 0) * 10) / 10,
            },
            topConcerns: topConcerns.map((c) => ({ concern: c._id, count: c.count })),
        });
    } catch (error) {
        res.status(500).json({ message: "Server error.", error: error.message });
    }
};

module.exports = {
    triggerAnalysis,
    triggerAnalysisSync,
    triggerBatchAnalysis,
    getAnalysis,
    getAnalysisStatus,
    getAllAnalyses,
    reanalyse,
    getDashboardStats,
};
