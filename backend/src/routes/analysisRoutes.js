// backend/src/routes/analysisRoutes.js
// ─────────────────────────────────────────────────────────────────
// Routes for AI Analysis endpoints
// ─────────────────────────────────────────────────────────────────

const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const analysisController = require("../controllers/analysisController");

// All routes require authentication
router.use(protect);

// ── Trigger analysis ──────────────────────────────────────────────

// Async trigger — responds immediately, processes in background
router.post("/process/:audioRecordingId", analysisController.triggerAnalysis);

// Sync trigger — waits for full pipeline completion before responding
router.post("/process-sync/:audioRecordingId", analysisController.triggerAnalysisSync);

// Batch processing (Admin only) — process multiple recordings
router.post("/batch", adminOnly, analysisController.triggerBatchAnalysis);

// ── Retrieve results ──────────────────────────────────────────────

// Dashboard stats (Admin only)
router.get("/dashboard/stats", adminOnly, analysisController.getDashboardStats);

// List all analyses (paginated, filterable)
router.get("/", analysisController.getAllAnalyses);

// Get full analysis for a specific recording
router.get("/:audioRecordingId", analysisController.getAnalysis);

// Lightweight status polling endpoint
router.get("/:audioRecordingId/status", analysisController.getAnalysisStatus);

// ── Admin actions ─────────────────────────────────────────────────

// Force re-analysis (Admin only)
router.post("/:audioRecordingId/reanalyse", adminOnly, analysisController.reanalyse);

module.exports = router;
