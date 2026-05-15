// models/Call.js
const mongoose = require("mongoose");

const callSchema = new mongoose.Schema(
    {
        // Who uploaded this call
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // Original audio file info
        originalFileName: { type: String, required: true },
        storedFileName: { type: String, required: true },   // UUID-based name on disk
        filePath: { type: String, required: true },
        fileSizeMB: { type: Number },
        durationSeconds: { type: Number },
        mimeType: { type: String },

        // Processing pipeline status
        // pending → processing → completed | failed
        status: {
            type: String,
            enum: ["pending", "processing", "completed", "failed"],
            default: "pending",
        },
        errorMessage: { type: String, default: null },

        // Transcript (populated by Worker 1 + 2)
        transcriptOriginal: { type: String, default: null },   // raw Hindi/Gujarati
        transcriptEnglish: { type: String, default: null },    // translated English
        detectedLanguage: { type: String, default: null },     // "hi", "gu", "en"

        // AI Analysis (populated by Worker 3)
        studentName: { type: String, default: null },
        counsellorName: { type: String, default: null },
        courseInterest: { type: String, default: null },
        studentCity: { type: String, default: null },
        keyConcerns: [{ type: String }],
        followUpDate: { type: String, default: null },
        sentiment: {
            type: String,
            enum: ["Positive", "Negative", "Neutral", null],
            default: null,
        },
        leadScore: { type: Number, min: 1, max: 10, default: null },
        callSummary: { type: String, default: null },

        // Counsellor performance scores (1–10 each)
        scores: {
            confidence: { type: Number, default: null },
            communication: { type: Number, default: null },
            engagement: { type: Number, default: null },
            objectionHandling: { type: Number, default: null },
            scriptCompliance: { type: Number, default: null },
        },

        // Excel export
        excelReportPath: { type: String, default: null },

        // For future connector integration
        externalCallId: { type: String, default: null },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Call", callSchema);