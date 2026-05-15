// controllers/callController.js
const Call = require("../models/Call");
const path = require("path");
const fs = require("fs");

// ── POST /api/calls/upload ─────────────────────────────
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
                filePath: file.path,
                fileSizeMB,
                mimeType: file.mimetype,
                status: "pending",
            });

            createdCalls.push(call);

            // TODO (Step 8): Enqueue the call ID into the Bull processing queue
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

// ── GET /api/calls ─────────────────────────────────────
const getCalls = async (req, res) => {
    try {
        const isAdmin = ["super_admin", "company_admin"].includes(req.user.role);
        const filter = isAdmin ? {} : { uploadedBy: req.user._id };

        const calls = await Call.find(filter)
            .populate("uploadedBy", "fullName email")
            .sort({ createdAt: -1 });

        res.status(200).json({ calls });
    } catch (error) {
        res.status(500).json({ message: "Server error.", error: error.message });
    }
};

// ── GET /api/calls/:id ────────────────────────────────
const getCallById = async (req, res) => {
    try {
        const call = await Call.findById(req.params.id).populate("uploadedBy", "fullName email");

        if (!call) return res.status(404).json({ message: "Call not found." });

        // Operators can only view their own calls
        const isAdmin = ["super_admin", "company_admin"].includes(req.user.role);
        if (!isAdmin && call.uploadedBy._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Access denied." });
        }

        res.status(200).json({ call });
    } catch (error) {
        res.status(500).json({ message: "Server error.", error: error.message });
    }
};

// ── GET /api/calls/:id/status ────────────────────────
const getCallStatus = async (req, res) => {
    try {
        const call = await Call.findById(req.params.id).select("status errorMessage");
        if (!call) return res.status(404).json({ message: "Call not found." });
        res.status(200).json({ status: call.status, errorMessage: call.errorMessage });
    } catch (error) {
        res.status(500).json({ message: "Server error.", error: error.message });
    }
};

module.exports = { uploadCalls, getCalls, getCallById, getCallStatus };