// backend/src/models/AudioRecording.js

const mongoose = require("mongoose");

const audioRecordingSchema = new mongoose.Schema(
    {
        // Who uploaded this file
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // Original name of the file as uploaded by user
        originalFileName: {
            type: String,
            required: true,
            trim: true,
        },

        // UUID-based filename stored on disk (e.g. "a1b2c3d4.mp3")
        storedFileName: {
            type: String,
            required: true,
        },

        // Absolute path on disk where file is saved
        filePath: {
            type: String,
            required: true,
        },

        // File size in MB
        fileSizeMB: {
            type: Number,
            default: 0,
        },

        // Duration of the audio in seconds (extracted later if needed)
        durationSeconds: {
            type: Number,
            default: null,
        },

        // MIME type of the file (audio/mpeg, audio/wav, etc.)
        mimeType: {
            type: String,
            default: "audio/mpeg",
        },

        // Optional: link to a CallLog if this recording belongs to a call
        callLogId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CallLog",
            default: null,
        },

        // Optional title/label for this recording
        title: {
            type: String,
            default: "",
            trim: true,
        },

        // Optional notes
        notes: {
            type: String,
            default: "",
        },

        // Processing pipeline status
        // pending → processing → analysed | failed
        status: {
            type: String,
            enum: ["pending", "processing", "analysed", "failed"],
            default: "pending",
        },
    },
    { timestamps: true }
);

// Index for fast lookup by uploader
audioRecordingSchema.index({ uploadedBy: 1, createdAt: -1 });

module.exports = mongoose.model("AudioRecording", audioRecordingSchema);