// // backend/src/routes/analysisRoutes.js
// // ─────────────────────────────────────────────────────────────────
// // Routes for AI Analysis endpoints
// // ─────────────────────────────────────────────────────────────────

// const express = require("express");
// const router = express.Router();
// const { protect, adminOnly } = require("../middleware/authMiddleware");
// const analysisController = require("../controllers/analysisController");

// // All routes require authentication
// router.use(protect);

// // ── Trigger analysis ──────────────────────────────────────────────

// // Async trigger — responds immediately, processes in background
// router.post("/process/:audioRecordingId", analysisController.triggerAnalysis);

// // Sync trigger — waits for full pipeline completion before responding
// router.post("/process-sync/:audioRecordingId", analysisController.triggerAnalysisSync);

// // Batch processing (Admin only) — process multiple recordings
// router.post("/batch", adminOnly, analysisController.triggerBatchAnalysis);

// // ── Retrieve results ──────────────────────────────────────────────

// // Dashboard stats (Admin only)
// router.get("/dashboard/stats", adminOnly, analysisController.getDashboardStats);

// // List all analyses (paginated, filterable)
// router.get("/", analysisController.getAllAnalyses);

// // Get full analysis for a specific recording
// router.get("/:audioRecordingId", analysisController.getAnalysis);

// // Lightweight status polling endpoint
// router.get("/:audioRecordingId/status", analysisController.getAnalysisStatus);

// // ── Admin actions ─────────────────────────────────────────────────

// // Force re-analysis (Admin only)
// router.post("/:audioRecordingId/reanalyse", adminOnly, analysisController.reanalyse);

// module.exports = router;
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

// ── Static / named routes MUST come before param routes ───────────
// BUG FIX: In the original file, GET /dashboard/stats was declared
// AFTER GET /:audioRecordingId. Express matches routes top-to-bottom,
// so a request to /api/analysis/dashboard/stats was swallowed by
// /:audioRecordingId (treating "dashboard" as the ID), causing a
// CastError (invalid ObjectId) instead of returning dashboard data.
// Fix: move all static-path routes above the :param routes.

// Dashboard stats (Admin only)
router.get("/dashboard/stats", adminOnly, analysisController.getDashboardStats);

// List all analyses (paginated, filterable)
router.get("/", analysisController.getAllAnalyses);

// ── Trigger analysis ──────────────────────────────────────────────
// Async trigger — responds immediately, processes in background
router.post("/process/:audioRecordingId", analysisController.triggerAnalysis);

// Sync trigger — waits for full pipeline completion before responding
router.post(
    "/process-sync/:audioRecordingId",
    analysisController.triggerAnalysisSync
);

// Batch processing (Admin only)
router.post("/batch", adminOnly, analysisController.triggerBatchAnalysis);

// ── Param routes (must be after static routes) ────────────────────

// Get full analysis for a specific recording
router.get("/:audioRecordingId", analysisController.getAnalysis);

// Lightweight status polling endpoint
router.get("/:audioRecordingId/status", analysisController.getAnalysisStatus);

// Force re-analysis (Admin only)
router.post(
    "/:audioRecordingId/reanalyse",
    adminOnly,
    analysisController.reanalyse
);

module.exports = router;