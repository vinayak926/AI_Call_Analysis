// src/pages/counselor/CounselorRecordingsPage.jsx
import React, { useEffect, useState, useRef } from 'react';
import AppLayout from '../../components/Layout/AppLayout';
import { getRecordings, deleteRecording, getAudioStreamUrl } from '../../services/api';
import API from '../../services/api';
import {
    LayoutDashboard, Phone, Mic, Upload,
    Play, Pause, Trash2, Zap, Loader,
    RefreshCw, Search, CheckCircle, Clock, AlertTriangle,
} from 'lucide-react';

const COUNSELOR_NAV = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/calls', label: 'My Calls', icon: Phone },
    { path: '/recordings', label: 'Recordings', icon: Mic },
    { path: '/upload', label: 'Upload', icon: Upload },
];

const STATUS_ICON = { pending: Clock, processing: Loader, analysed: CheckCircle, completed: CheckCircle, failed: AlertTriangle };
const STATUS_COLOR = { pending: '#d97706', processing: '#2563eb', analysed: '#16a34a', completed: '#16a34a', failed: '#dc2626' };

export default function CounselorRecordingsPage() {
    const [recordings, setRecordings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [playingId, setPlayingId] = useState(null);
    const [analysingId, setAnalysingId] = useState(null);
    const audioRef = useRef(null);

    const fetchRecordings = async () => {
        setLoading(true);
        try {
            const res = await getRecordings();
            setRecordings(res.recordings || []);
        } catch { } finally { setLoading(false); }
    };

    useEffect(() => { fetchRecordings(); }, []);

    const handlePlay = (id) => {
        if (playingId === id) {
            audioRef.current?.pause();
            setPlayingId(null);
        } else {
            setPlayingId(id);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this recording?')) return;
        try {
            await deleteRecording(id);
            setRecordings(prev => prev.filter(r => r._id !== id));
            if (playingId === id) setPlayingId(null);
        } catch { alert('Delete failed.'); }
    };

    // const handleAnalyse = async (id) => {
    //     setAnalysingId(id);
    //     try { await API.post(`/audio/${id}/analyse`); }
    //     catch { }
    //     setTimeout(() => { fetchRecordings(); setAnalysingId(null); }, 2500);
    // };

    const handleAnalyse = async (id) => {
        setAnalysingId(id);
        try {
            await API.post(`/audio/${id}/analyse`);
            const poll = setInterval(async () => {
                try {
                    const r = await API.get(`/calls/${id}/status`);
                    const s = r.data.analysisStatus;
                    if (s === 'completed' || s === 'failed') {
                        clearInterval(poll);
                        setAnalysingId(null);
                        fetchRecordings();
                    }
                } catch { clearInterval(poll); setAnalysingId(null); }
            }, 4000);
        } catch {
            setAnalysingId(null);
        }
    };

    const filtered = recordings.filter(r => {
        const q = search.toLowerCase();
        return !q || r.title?.toLowerCase().includes(q) ||
            r.originalFileName?.toLowerCase().includes(q);
    });

    const fmtDuration = (s) => s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : '—';
    const fmtSize = (mb) => !mb ? '—' : mb < 1 ? `${Math.round(mb * 1024)} KB` : `${mb.toFixed(1)} MB`;

    return (
        <AppLayout navItems={COUNSELOR_NAV} panelLabel="My Panel">
            <div style={{ padding: '32px 40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1a1a1a', letterSpacing: '-0.02em', margin: '0 0 4px' }}>My Recordings</h1>
                        <p style={{ color: '#8a8480', fontSize: '14px', margin: 0 }}>{recordings.length} audio files</p>
                    </div>
                    <button onClick={fetchRecordings} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', background: 'white', border: '1px solid #e8e3da', borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#6b6560', fontFamily: 'inherit' }}>
                        <RefreshCw size={14} style={loading ? { animation: 'spin 1s linear infinite' } : {}} /> Refresh
                    </button>
                </div>

                {/* Search */}
                <div style={{ position: 'relative', marginBottom: '20px' }}>
                    <Search size={14} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search recordings…"
                        style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #e8e3da', borderRadius: '12px', fontSize: '13px', background: 'white', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                </div>

                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                        <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', color: '#6366f1' }} />
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 20px', background: 'white', borderRadius: '20px', border: '1px solid #e8e3da' }}>
                        <Mic size={36} style={{ color: '#d4d0cc', marginBottom: '12px' }} />
                        <p style={{ fontWeight: '700', color: '#1a1a1a', margin: '0 0 6px' }}>No recordings yet</p>
                        <p style={{ fontSize: '13px', color: '#aaa', margin: 0 }}>Upload your call recordings to get started.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {filtered.map(rec => {
                            const isPlaying = playingId === rec._id;
                            const isAnalysing = analysingId === rec._id;
                            const StatusIcon = STATUS_ICON[rec.status] || Clock;
                            const statusColor = STATUS_COLOR[rec.status] || '#d97706';
                            const canAnalyse = rec.status === 'pending' || rec.status === 'failed';

                            return (
                                <div key={rec._id} style={{ background: 'white', borderRadius: '16px', border: `1px solid ${isPlaying ? '#6366f1' : '#e8e3da'}`, padding: '18px 20px', transition: 'border-color .2s' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                                        {/* Play/Pause */}
                                        <button onClick={() => handlePlay(rec._id)} style={{
                                            width: '42px', height: '42px', borderRadius: '50%', border: 'none',
                                            background: isPlaying ? '#6366f1' : '#f0ece6', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                        }}>
                                            {isPlaying ? <Pause size={16} color="white" /> : <Play size={16} color="#6366f1" />}
                                        </button>

                                        {/* Info */}
                                        <div style={{ flex: 1, minWidth: '180px' }}>
                                            <div style={{ fontWeight: '700', fontSize: '14px', color: '#1a1a1a', marginBottom: '4px' }}>
                                                {rec.title || rec.originalFileName || 'Untitled'}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#aaa', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                                                <span>⏱ {fmtDuration(rec.durationSeconds)}</span>
                                                <span>💾 {fmtSize(rec.fileSizeMB)}</span>
                                                <span>📅 {new Date(rec.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        {/* Status */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <StatusIcon size={13} style={{ color: statusColor }} />
                                            <span style={{ fontSize: '12px', fontWeight: '700', color: statusColor }}>
                                                {rec.status?.charAt(0).toUpperCase() + rec.status?.slice(1)}
                                            </span>
                                        </div>

                                        {/* Actions */}
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            {canAnalyse && (
                                                <button onClick={() => handleAnalyse(rec._id)} disabled={isAnalysing} style={{
                                                    display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px',
                                                    borderRadius: '9px', border: 'none',
                                                    background: isAnalysing ? '#f0f0f0' : '#6366f1',
                                                    color: isAnalysing ? '#999' : 'white',
                                                    fontWeight: '700', fontSize: '12px', cursor: isAnalysing ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                                                }}>
                                                    {isAnalysing ? <><Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> …</> : <><Zap size={12} /> Analyse</>}
                                                </button>
                                            )}
                                            <button onClick={() => handleDelete(rec._id)} style={{
                                                display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px',
                                                borderRadius: '9px', border: '1px solid #fecaca', background: 'white',
                                                color: '#dc2626', fontWeight: '700', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit',
                                            }}>
                                                <Trash2 size={12} /> Delete
                                            </button>
                                        </div>
                                    </div>

                                    {/* Audio player */}
                                    {isPlaying && (
                                        <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #f0ece6' }}>
                                            <audio ref={audioRef} src={getAudioStreamUrl(rec._id)}
                                                controls autoPlay onEnded={() => setPlayingId(null)}
                                                style={{ width: '100%', height: '36px' }} />
                                        </div>
                                    )}

                                    {/* Notes */}
                                    {rec.notes && (
                                        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f0ece6', fontSize: '13px', color: '#6b6560' }}>
                                            📝 {rec.notes}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        </AppLayout>
    );
}
