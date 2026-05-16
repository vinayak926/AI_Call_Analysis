// frontend/src/pages/RecordingsPage.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Mic, Trash2, Zap, Loader, CheckCircle, AlertTriangle,
  Clock, RefreshCw, FileAudio, Play, Pause
} from "lucide-react";
import { getRecordings, deleteRecording, getAudioStreamUrl } from "../services/api";
import API from "../services/api";
import AudioPlayer from "../components/AudioPlayer";
import Navbar from "../components/Layout/Navbar";

const statusBadges = {
  pending:    { label: 'Pending',    color: '#d97706', bg: '#fffbeb', Icon: Clock },
  processing: { label: 'Processing', color: '#2563eb', bg: '#eff6ff', Icon: Loader },
  analysed:   { label: 'Analysed',   color: '#16a34a', bg: '#f0fdf4', Icon: CheckCircle },
  completed:  { label: 'Analysed',   color: '#16a34a', bg: '#f0fdf4', Icon: CheckCircle },
  failed:     { label: 'Failed',     color: '#dc2626', bg: '#fef2f2', Icon: AlertTriangle },
};

export default function RecordingsPage() {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const [analysingId, setAnalysingId] = useState(null);

  const fetchRecordings = async () => {
    setLoading(true);
    try {
      const data = await getRecordings();
      setRecordings(data.recordings || []);
      setError(null);
    } catch (err) {
      setError("Failed to load recordings.");
      console.error(err);
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

  // ── Trigger AI analysis ─────────────────────────────
  const handleAnalyse = async (id) => {
    setAnalysingId(id);
    try {
      await API.post(`/audio/${id}/analyse`);
      // Update local status immediately
      setRecordings(prev => prev.map(r =>
        r._id === id ? { ...r, status: 'processing' } : r
      ));
      // Poll for completion
      const poll = setInterval(async () => {
        try {
          const res = await API.get(`/audio/${id}`);
          const rec = res.data.recording || res.data;
          if (rec.status === 'analysed' || rec.status === 'completed' || rec.status === 'failed') {
            clearInterval(poll);
            setAnalysingId(null);
            fetchRecordings();
          }
        } catch {
          clearInterval(poll);
          setAnalysingId(null);
        }
      }, 4000);
    } catch (err) {
      alert(err.response?.data?.message || "Analysis failed.");
      setAnalysingId(null);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatSize = (mb) => {
    if (!mb) return '—';
    return mb < 1 ? `${Math.round(mb * 1024)} KB` : `${mb.toFixed(1)} MB`;
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ flex: 1, background: '#f8f7f4', minHeight: '100vh', marginLeft: '240px' }}>
        <div style={{ padding: '32px 40px', maxWidth: '900px', margin: '0 auto' }}>

          {/* ── Header ──────────────────────────────────── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#1a1a1a', letterSpacing: '-0.02em', margin: '0 0 4px' }}>
                Recordings
              </h1>
              <p style={{ fontSize: '14px', color: '#8a8480', margin: 0 }}>
                {recordings.length} audio file{recordings.length !== 1 ? 's' : ''} uploaded
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={fetchRecordings} disabled={loading} style={{
                padding: '10px 16px', background: 'white', border: '1px solid #e8e3da',
                borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '13px', fontWeight: '600', color: '#6b6560', fontFamily: 'inherit',
              }}>
                <RefreshCw size={14} style={loading ? { animation: 'spin 1s linear infinite' } : {}} /> Refresh
              </button>
              <Link to="/upload-audio" style={{
                padding: '10px 20px', background: '#111', color: 'white', borderRadius: '12px',
                fontWeight: '700', fontSize: '13px', textDecoration: 'none',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                + Upload Audio
              </Link>
            </div>
          </div>

          {/* ── Loading ─────────────────────────────────── */}
          {loading && (
            <div style={{ padding: '60px 0', textAlign: 'center' }}>
              <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', color: '#6366f1', marginBottom: '8px' }} />
              <p style={{ color: '#8a8480', fontSize: '14px' }}>Loading recordings...</p>
            </div>
          )}
          {error && <div style={{ padding: '32px', color: '#dc2626', textAlign: 'center', fontSize: '14px' }}>{error}</div>}

          {/* ── Empty State ─────────────────────────────── */}
          {!loading && !error && recordings.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <Mic size={40} style={{ margin: '0 auto 16px', color: '#d4d0cc' }} />
              <p style={{ color: '#8a8480', fontSize: '15px', fontWeight: '600' }}>No recordings yet</p>
              <Link to="/upload-audio" style={{ color: '#6366f1', fontSize: '14px', fontWeight: '700', textDecoration: 'none', marginTop: '8px', display: 'inline-block' }}>
                Upload your first audio file →
              </Link>
            </div>
          )}

          {/* ── Recording Cards ─────────────────────────── */}
          {!loading && !error && recordings.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recordings.map((rec) => {
                const badge = statusBadges[rec.status] || statusBadges.pending;
                const BadgeIcon = badge.Icon;
                const canAnalyse = rec.status === 'pending' || rec.status === 'failed';
                const isAnalysing = analysingId === rec._id || rec.status === 'processing';
                const isPlaying = playingId === rec._id;

                return (
                  <div key={rec._id} style={{
                    background: 'white', border: '1px solid #e8e3da',
                    borderRadius: '20px', overflow: 'hidden',
                    transition: 'box-shadow 0.2s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                  >
                    {/* ── Card Header ──────────────────────── */}
                    <div style={{ display: 'flex', alignItems: 'center', padding: '18px 22px', gap: '14px' }}>

                      {/* Icon */}
                      <div style={{
                        width: '44px', height: '44px', borderRadius: '12px',
                        background: isPlaying ? '#6366f1' : '#f0ece6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        transition: 'background 0.2s',
                      }}>
                        {isPlaying
                          ? <Pause size={18} color="white" />
                          : <FileAudio size={18} color="#8a8480" />
                        }
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontWeight: '700', fontSize: '14px', color: '#1a1a1a', margin: 0,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {rec.title || rec.originalFileName}
                        </p>
                        <p style={{ fontSize: '12px', color: '#8a8480', margin: '3px 0 0', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <span>{rec.uploadedBy?.fullName || 'Unknown'}</span>
                          <span>·</span>
                          <span>{formatSize(rec.fileSizeMB)}</span>
                          <span>·</span>
                          <span>{formatDate(rec.createdAt)}</span>
                          {rec.durationSeconds && (
                            <>
                              <span>·</span>
                              <span>{Math.floor(rec.durationSeconds / 60)}:{String(rec.durationSeconds % 60).padStart(2, '0')}</span>
                            </>
                          )}
                        </p>
                      </div>

                      {/* Status Badge */}
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        padding: '5px 14px', borderRadius: '50px',
                        background: badge.bg, color: badge.color,
                        fontSize: '11px', fontWeight: '700', flexShrink: 0,
                      }}>
                        <BadgeIcon size={12} style={isAnalysing ? { animation: 'spin 1s linear infinite' } : {}} />
                        {isAnalysing ? 'Processing...' : badge.label}
                      </span>

                      {/* ── Actions ─────────────────────────── */}
                      <div style={{ display: 'flex', gap: '8px', flexShrink: 0, alignItems: 'center' }}>
                        {/* Play/Pause */}
                        <button
                          onClick={() => togglePlay(rec._id)}
                          style={{
                            padding: '8px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                            fontWeight: '700', fontSize: '13px', fontFamily: 'inherit',
                            background: isPlaying ? '#1e293b' : '#f0ece6',
                            color: isPlaying ? 'white' : '#1a1a1a',
                            display: 'flex', alignItems: 'center', gap: '6px',
                            transition: 'all 0.15s',
                          }}
                        >
                          {isPlaying ? <><Pause size={13} /> Stop</> : <><Play size={13} /> Play</>}
                        </button>

                        {/* Analyse */}
                        {canAnalyse && (
                          <button
                            onClick={() => handleAnalyse(rec._id)}
                            disabled={isAnalysing}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '5px',
                              padding: '8px 14px', borderRadius: '10px', border: 'none',
                              cursor: isAnalysing ? 'not-allowed' : 'pointer',
                              fontWeight: '700', fontSize: '13px', fontFamily: 'inherit',
                              background: isAnalysing ? '#f0f0f0' : '#6366f1',
                              color: isAnalysing ? '#999' : 'white',
                            }}
                          >
                            {isAnalysing
                              ? <><Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> ...</>
                              : <><Zap size={13} /> Analyse</>
                            }
                          </button>
                        )}

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(rec._id)}
                          style={{
                            padding: '8px 10px', borderRadius: '10px',
                            background: '#fef2f2', color: '#dc2626',
                            border: '1px solid #fecaca', cursor: 'pointer',
                            display: 'flex', alignItems: 'center',
                          }}
                          title="Delete recording"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* ── Notes (if any) ───────────────────── */}
                    {rec.notes && (
                      <div style={{ padding: '0 22px 12px', fontSize: '12px', color: '#8a8480' }}>
                        📝 {rec.notes}
                      </div>
                    )}

                    {/* ── Inline Audio Player ─────────────── */}
                    {isPlaying && (
                      <div style={{ padding: '0 22px 20px' }}>
                        <AudioPlayer
                          src={getAudioStreamUrl(rec._id)}
                          fileName={rec.originalFileName}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}