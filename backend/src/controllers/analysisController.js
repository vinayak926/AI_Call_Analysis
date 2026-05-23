// backend/src/controllers/analysisController.js
// ─────────────────────────────────────────────────────────────────
// Controller for AI Analysis endpoints
// ─────────────────────────────────────────────────────────────────

const CallAnalysis = require("../models/CallAnalysis");
const AudioRecording = require("../models/AudioRecording");
const User = require("../models/User");
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

        // ── Base filter ───────────────────────────────────────────
        const filter = {};

        // Non-admins only see their own recordings
        if (!isAdmin) {
            const userRecordingIds = await AudioRecording.find({ uploadedBy: req.user._id })
                .select("_id")
                .lean();
            filter.audioRecordingId = { $in: userRecordingIds.map((r) => r._id) };
        }

        // ── Status filter ─────────────────────────────────────────
        // Default to "completed" unless caller explicitly passes status=all
        if (req.query.status && req.query.status !== "all") {
            filter.status = req.query.status;
        } else if (!req.query.status) {
            filter.status = "completed";
        }

        // ── Keyword / text search ─────────────────────────────────
        // Searches: studentName, counsellorName, courseInterested,
        //           city, keyConcerns, callSummary
        // Example: ?keyword=fees
        if (req.query.keyword && req.query.keyword.trim()) {
            filter.$text = { $search: req.query.keyword.trim() };
        }

        // ── Sentiment filter ──────────────────────────────────────
        // Example: ?sentiment=Positive
        if (req.query.sentiment && req.query.sentiment !== "all") {
            filter.sentiment = req.query.sentiment;
        }

        // ── Lead score range ──────────────────────────────────────
        // Example: ?minScore=7&maxScore=10
        if (req.query.minScore || req.query.maxScore) {
            filter.leadScore = {};
            if (req.query.minScore) {
                filter.leadScore.$gte = parseInt(req.query.minScore, 10);
            }
            if (req.query.maxScore) {
                filter.leadScore.$lte = parseInt(req.query.maxScore, 10);
            }
        }

        // ── Counsellor name filter ────────────────────────────────
        // Example: ?counsellor=Priya
        // Uses case-insensitive partial match (regex)
        if (req.query.counsellor && req.query.counsellor.trim()) {
            filter.counsellorName = {
                $regex: req.query.counsellor.trim(),
                $options: "i",
            };
        }

        // ── Student name filter ───────────────────────────────────
        // Example: ?student=Rahul
        if (req.query.student && req.query.student.trim()) {
            filter.studentName = {
                $regex: req.query.student.trim(),
                $options: "i",
            };
        }

        // ── Course filter ─────────────────────────────────────────
        // Example: ?course=MBA
        if (req.query.course && req.query.course.trim()) {
            filter.courseInterested = {
                $regex: req.query.course.trim(),
                $options: "i",
            };
        }

        // ── City filter ───────────────────────────────────────────
        // Example: ?city=Ahmedabad
        if (req.query.city && req.query.city.trim()) {
            filter.city = {
                $regex: req.query.city.trim(),
                $options: "i",
            };
        }

        // ── Follow-up filter ──────────────────────────────────────
        // Example: ?followUp=true
        if (req.query.followUp === "true") {
            filter.followUpRequired = true;
        }

        // ── Interested filter ─────────────────────────────────────
        // Example: ?interested=true
        if (req.query.interested === "true") {
            filter.interested = true;
        }

        // ── Date range filter ─────────────────────────────────────
        // Example: ?dateFrom=2026-01-01&dateTo=2026-06-30
        if (req.query.dateFrom || req.query.dateTo) {
            filter.createdAt = {};
            if (req.query.dateFrom) {
                filter.createdAt.$gte = new Date(req.query.dateFrom);
            }
            if (req.query.dateTo) {
                // Include the full end day by going to end of that date
                const end = new Date(req.query.dateTo);
                end.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = end;
            }
        }

        // ── Pagination ────────────────────────────────────────────
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(parseInt(req.query.limit, 10) || 25, 100); // cap at 100
        const skip = (page - 1) * limit;

        // ── Sort ──────────────────────────────────────────────────
        // If keyword search is active, sort by text relevance score first
        // Otherwise sort by newest first
        let sortOption = { createdAt: -1 };
        if (req.query.keyword && req.query.keyword.trim()) {
            sortOption = { score: { $meta: "textScore" }, createdAt: -1 };
        }

        // ── Query ─────────────────────────────────────────────────
        const selectFields = req.query.keyword
            ? { score: { $meta: "textScore" } }
            : {};

        const [analyses, total] = await Promise.all([
            CallAnalysis.find(filter, selectFields)
                .populate("audioRecordingId", "originalFileName title uploadedBy createdAt")
                .sort(sortOption)
                .skip(skip)
                .limit(limit)
                .lean(),
            CallAnalysis.countDocuments(filter),
        ]);

        // ── Response ──────────────────────────────────────────────
        res.status(200).json({
            analyses,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page < Math.ceil(total / limit),
                hasPrevPage: page > 1,
            },
            appliedFilters: {
                keyword: req.query.keyword || null,
                sentiment: req.query.sentiment || null,
                counsellor: req.query.counsellor || null,
                student: req.query.student || null,
                course: req.query.course || null,
                city: req.query.city || null,
                minScore: req.query.minScore || null,
                maxScore: req.query.maxScore || null,
                followUp: req.query.followUp || null,
                interested: req.query.interested || null,
                dateFrom: req.query.dateFrom || null,
                dateTo: req.query.dateTo || null,
                status: filter.status || null,
            },
        });
    } catch (error) {
        console.error("Search analyses error:", error);
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
            counsellorLeaderboard,
            concernFlagAgg
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

            CallAnalysis.aggregate([
                { $match: { status: "completed", counsellorName: { $ne: null } } },
                {
                    $group: {
                        _id: "$counsellorName",
                        totalCalls: { $sum: 1 },
                        avgLeadScore: { $avg: "$leadScore" },
                        hotLeads: { $sum: { $cond: [{ $gte: ["$leadScore", 8] }, 1, 0] } },
                        avgClosing: { $avg: "$closingProbability" },
                    }
                },
                { $sort: { avgLeadScore: -1 } },
                { $limit: 10 },
            ]),

            // NEW — concern flag counts (fees, placement, parent, timing)
            CallAnalysis.aggregate([
                { $match: { status: "completed" } },
                {
                    $group: {
                        _id: null,
                        feesIssue: { $sum: { $cond: ["$feesIssue", 1, 0] } },
                        placementConcern: { $sum: { $cond: ["$placementConcern", 1, 0] } },
                        parentConcern: { $sum: { $cond: ["$parentConcern", 1, 0] } },
                        timingConcern: { $sum: { $cond: ["$timingConcern", 1, 0] } },
                    }
                },
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
            counsellorLeaderboard: counsellorLeaderboard.map(c => ({
                name: c._id,
                totalCalls: c.totalCalls,
                avgLeadScore: Math.round(c.avgLeadScore * 10) / 10,
                hotLeads: c.hotLeads,
                avgClosing: Math.round(c.avgClosing * 10) / 10,
            })),
            concernFlags: concernFlagAgg[0] || {
                feesIssue: 0, placementConcern: 0, parentConcern: 0, timingConcern: 0,
            },
        });
    } catch (error) {
        res.status(500).json({ message: "Server error.", error: error.message });
    }
};

// ───────────────────────────────────────────────────────────────
// POST /api/analysis/export/google-sheets
// Admin only — bulk export all completed analyses to Google Sheet
// ───────────────────────────────────────────────────────────────
const exportToGoogleSheets = async (req, res) => {
    try {
        const { appendToGoogleSheet } = require("../services/googleSheetsService");

        if (process.env.GOOGLE_SHEETS_ENABLED !== 'true') {
            return res.status(400).json({ message: "Google Sheets integration is not enabled. Set GOOGLE_SHEETS_ENABLED=true in .env" });
        }

        const analyses = await CallAnalysis.find({ status: "completed" })
            .populate("audioRecordingId", "originalFileName uploadedBy")
            .lean();

        if (analyses.length === 0) {
            return res.status(200).json({ message: "No completed analyses to export.", exported: 0 });
        }

        let exported = 0;
        let failed = 0;

        for (const analysis of analyses) {
            try {
                const uploaderDoc = analysis.audioRecordingId?.uploadedBy
                    ? await User.findById(analysis.audioRecordingId.uploadedBy).select("fullName").lean()
                    : null;
                await appendToGoogleSheet(analysis, analysis.audioRecordingId, uploaderDoc?.fullName || "");
                exported++;
            } catch (err) {
                console.error(`Sheets export failed for ${analysis._id}:`, err.message);
                failed++;
            }
        }

        res.status(200).json({ message: "Google Sheets export complete.", exported, failed });
    } catch (error) {
        res.status(500).json({ message: "Export failed.", error: error.message });
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
    exportToGoogleSheets,
};
