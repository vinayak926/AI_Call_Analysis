// backend/src/models/CallAnalysis.js

const mongoose = require("mongoose");

const callAnalysisSchema = new mongoose.Schema(
    {
        // ── Link to the source audio recording ────────────────────
        audioRecordingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AudioRecording",
            required: true,
            unique: true, // one analysis per recording
        },

        // ── Transcription data ────────────────────────────────────
        transcript: {
            // Raw text exactly as returned by Whisper
            originalText: { type: String, default: null },
            // English translation (same as originalText if already English)
            englishText: { type: String, default: null },
            // Language detected by Whisper (BCP-47: 'en', 'hi', 'gu', etc.)
            detectedLanguage: { type: String, default: null },
            // Whether translation was performed
            translationRequired: { type: Boolean, default: false },
        },

        // ── Extracted lead intelligence ───────────────────────────
        studentName: { type: String, default: null },
        counsellorName: { type: String, default: null },
        courseInterested: { type: String, default: null },
        city: { type: String, default: null },
        keyConcerns: [{ type: String }],
        followUpDate: { type: String, default: null },

        // ── Sentiment & interest ──────────────────────────────────
        sentiment: {
            type: String,
            enum: ["Positive", "Negative", "Neutral"],
            required: true,
        },
        interested: { type: Boolean, default: false },
        followUpRequired: { type: Boolean, default: false },

        // ── Concern flags ─────────────────────────────────────────
        parentConcern: { type: Boolean, default: false },
        feesIssue: { type: Boolean, default: false },
        placementConcern: { type: Boolean, default: false },
        timingConcern: { type: Boolean, default: false },

        // ── Scores (1–10) ─────────────────────────────────────────
        leadScore: { type: Number, min: 1, max: 10, required: true },
        communicationScore: { type: Number, min: 1, max: 10, default: null },
        engagementScore: { type: Number, min: 1, max: 10, default: null },
        counsellorConfidenceScore: { type: Number, min: 1, max: 10, default: null },

        // ── Closing probability (0–100%) ──────────────────────────
        closingProbability: { type: Number, min: 0, max: 100, default: null },

        // ── AI-generated summary ──────────────────────────────────
        callSummary: { type: String, required: true },

        // ── Processing metadata ───────────────────────────────────
        processingTimeMs: { type: Number, default: null },
        llmModel: { type: String, default: "gpt-4o" },
        sttModel: { type: String, default: "whisper-1" },

        // ── Pipeline status ───────────────────────────────────────
        status: {
            type: String,
            enum: ["pending", "transcribing", "translating", "analysing", "completed", "failed"],
            default: "pending",
        },
        errorMessage: { type: String, default: null },
    },
    { timestamps: true }
);

// Index for fast lookup by status, sentiment, and leadScore
// Note: audioRecordingId already has a unique index from the schema definition
// Note: audioRecordingId already has a unique index from the schema definition
callAnalysisSchema.index({ status: 1 });
callAnalysisSchema.index({ sentiment: 1 });
callAnalysisSchema.index({ leadScore: 1 });

// ── New indexes for search API ────────────────────────────────────
callAnalysisSchema.index({ counsellorName: 1 });
callAnalysisSchema.index({ courseInterested: 1 });
callAnalysisSchema.index({ city: 1 });
callAnalysisSchema.index({ followUpRequired: 1 });
callAnalysisSchema.index({ createdAt: -1 });

// Text index — powers keyword search across student name,
// counsellor name, course, city, concerns, and call summary
callAnalysisSchema.index(
    {
        studentName: "text",
        counsellorName: "text",
        courseInterested: "text",
        city: "text",
        keyConcerns: "text",
        callSummary: "text",
    },
    {
        name: "call_analysis_text_search",
        weights: {
            studentName: 10,   
            counsellorName: 8,
            courseInterested: 6,
            city: 4,
            keyConcerns: 3,
            callSummary: 1,    
        },
    }
);

module.exports = mongoose.model("CallAnalysis", callAnalysisSchema, "call_analysis");