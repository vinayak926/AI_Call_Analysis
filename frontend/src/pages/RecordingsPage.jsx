// frontend/src/pages/RecordingsPage.jsx

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Mic, Trash2, Eye } from "lucide-react";
import { getRecordings, deleteRecording, getAudioStreamUrl } from "../services/api";
import AudioPlayer from "../components/AudioPlayer";

export default function RecordingsPage() {
    const [recordings, setRecordings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [playingId, setPlayingId] = useState(null); // which row is expanded

    const fetchRecordings = async () => {
        try {
            const data = await getRecordings();
            setRecordings(data.recordings);
        } catch {
            setError("Failed to load recordings.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRecordings(); }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this recording? This cannot be undone.")) return;
        try {
            await deleteRecording(id);
            setRecordings(prev => prev.filter(r => r._id !== id));
            if (playingId === id) setPlayingId(null);
        } catch {
            alert("Delete failed.");
        }
    };

    const togglePlay = (id) => {
        setPlayingId(prev => (prev === id ? null : id));
    };

    if (loading) return <div style={pageStyle}><p style={{ color: "#64748b" }}>Loading recordings...</p></div>;
    if (error) return <div style={pageStyle}><p style={{ color: "#dc2626" }}>{error}</p></div>;

    return (
        <div style={pageStyle}>
            <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
                    <div>
                        <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", margin: 0 }}>Recordings</h1>
                        <p style={{ fontSize: "14px", color: "#64748b", marginTop: "4px" }}>{recordings.length} audio file{recordings.length !== 1 ? "s" : ""}</p>
                    </div>
                    <Link to="/upload-audio" style={{
                        padding: "10px 20px", background: "#0f172a", color: "white",
                        borderRadius: "12px", fontWeight: "700", fontSize: "14px", textDecoration: "none",
                    }}>
                        + Upload Audio
                    </Link>
                </div>

                {/* Empty state */}
                {recordings.length === 0 && (
                    <div style={{ textAlign: "center", padding: "80px 0", color: "#94a3b8" }}>
                        <Mic size={36} style={{ marginBottom: "12px", opacity: 0.5 }} />
                        <p>No recordings yet. Upload your first audio file.</p>
                    </div>
                )}

                {/* Recording cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {recordings.map((rec) => (
                        <div key={rec._id} style={{
                            background: "white", border: "1px solid #e2e8f0",
                            borderRadius: "16px", overflow: "hidden",
                        }}>
                            {/* Card header */}
                            <div style={{ display: "flex", alignItems: "center", padding: "16px 20px", gap: "12px" }}>
                                {/* Mic icon */}
                                <div style={{
                                    width: "40px", height: "40px", borderRadius: "10px",
                                    background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                                }}>
                                    <Mic size={18} color="#3b82f6" />
                                </div>

                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontWeight: "700", fontSize: "14px", color: "#0f172a", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {rec.title || rec.originalFileName}
                                    </p>
                                    <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0" }}>
                                        {rec.uploadedBy?.fullName || "Unknown"} · {rec.fileSizeMB} MB · {new Date(rec.createdAt).toLocaleDateString()}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                                    <button
                                        onClick={() => togglePlay(rec._id)}
                                        style={{
                                            padding: "7px 16px", borderRadius: "8px",
                                            background: playingId === rec._id ? "#1e293b" : "#f1f5f9",
                                            color: playingId === rec._id ? "white" : "#334155",
                                            border: "none", cursor: "pointer", fontWeight: "600", fontSize: "13px",
                                        }}
                                    >
                                        {playingId === rec._id ? "▶ Playing" : "▶ Play"}
                                    </button>

                                    <button
                                        onClick={() => handleDelete(rec._id)}
                                        style={{
                                            padding: "7px 10px", borderRadius: "8px",
                                            background: "#fef2f2", color: "#dc2626",
                                            border: "1px solid #fecaca", cursor: "pointer",
                                            display: "flex", alignItems: "center",
                                        }}
                                        title="Delete"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Inline Audio Player — shown when this card is expanded */}
                            {playingId === rec._id && (
                                <div style={{ padding: "0 20px 20px" }}>
                                    <AudioPlayer
                                        src={getAudioStreamUrl(rec._id)}
                                        fileName={rec.originalFileName}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

const pageStyle = {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: "40px 24px",
};