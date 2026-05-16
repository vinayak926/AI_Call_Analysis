// frontend/src/pages/UploadAudioPage.jsx

import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, File, CheckCircle, AlertCircle, Loader } from "lucide-react";
import { uploadAudioFile } from "../services/api";
import Navbar from "../components/Layout/Navbar";

export default function UploadAudioPage() {
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState("");
    const [notes, setNotes] = useState("");
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const inputRef = useRef();
    const navigate = useNavigate();

    const ALLOWED_TYPES = ["audio/mpeg", "audio/wav", "audio/mp4", "audio/x-m4a", "audio/ogg", "audio/webm"];

    const handleDrop = (e) => {
        e.preventDefault();
        const dropped = e.dataTransfer.files[0];
        if (dropped && ALLOWED_TYPES.includes(dropped.type)) {
            setFile(dropped);
            setError(null);
        } else {
            setError("Only MP3, WAV, M4A, OGG, or WEBM files are supported.");
        }
    };

    const handleFileSelect = (e) => {
        const selected = e.target.files[0];
        if (selected) { setFile(selected); setError(null); }
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        setError(null);
        try {
            await uploadAudioFile(file, title || file.name, notes);
            setSuccess(true);
            setTimeout(() => navigate("/recordings"), 1500);
        } catch (err) {
            setError(err.response?.data?.message || "Upload failed. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Navbar />
            <div style={{ flex: 1, background: "rgb(248,250,252)", minHeight: "100vh", padding: "40px 24px", marginLeft: "240px" }}>
            <div style={{ maxWidth: "520px", margin: "0 auto" }}>
                <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", marginBottom: "8px" }}>Upload Audio Recording</h1>
                <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "32px" }}>Supported: MP3, WAV, M4A, OGG, WEBM — max 100 MB</p>

                {/* Drop zone */}
                <div
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => inputRef.current.click()}
                    style={{
                        border: "2px dashed #cbd5e1", borderRadius: "16px",
                        padding: "48px 24px", textAlign: "center", cursor: "pointer",
                        background: "white", transition: "border-color 0.2s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "#3b82f6"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "#cbd5e1"}
                >
                    <Upload size={32} color="#94a3b8" style={{ marginBottom: "12px" }} />
                    <p style={{ color: "#475569", fontWeight: "600", margin: 0 }}>Drop audio file here or click to browse</p>
                    <input ref={inputRef} type="file" accept=".mp3,.wav,.m4a,.ogg,.webm" onChange={handleFileSelect} style={{ display: "none" }} />
                </div>

                {/* Selected file */}
                {file && (
                    <div style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "12px", background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "14px 16px" }}>
                        <File size={18} color="#3b82f6" />
                        <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontWeight: "600", fontSize: "14px", color: "#0f172a" }}>{file.name}</p>
                            <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <button onClick={() => setFile(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: "18px" }}>×</button>
                    </div>
                )}

                {/* Optional fields */}
                {file && (
                    <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
                        <input
                            type="text"
                            placeholder="Title (optional)"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            style={inputStyle}
                        />
                        <textarea
                            placeholder="Notes (optional)"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            rows={3}
                            style={{ ...inputStyle, resize: "vertical" }}
                        />
                        <button
                            onClick={handleUpload}
                            disabled={uploading || success}
                            style={{
                                padding: "14px", background: success ? "#16a34a" : "#0f172a", color: "white",
                                borderRadius: "12px", fontWeight: "700", fontSize: "15px", border: "none",
                                cursor: uploading || success ? "not-allowed" : "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                                opacity: uploading ? 0.8 : 1,
                            }}
                        >
                            {success
                                ? <><CheckCircle size={16} /> Uploaded! Redirecting...</>
                                : uploading
                                    ? <><Loader size={16} style={{ animation: "spin 1s linear infinite" }} /> Uploading...</>
                                    : "Upload Recording"}
                        </button>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "8px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px", padding: "12px 16px", color: "#dc2626", fontSize: "14px" }}>
                        <AlertCircle size={16} /> {error}
                    </div>
                )}
            </div>
            </div>
        </div>
    );
}

const inputStyle = {
    padding: "12px 16px",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "14px",
    fontFamily: "inherit",
    outline: "none",
    background: "white",
    width: "100%",
    boxSizing: "border-box",
};