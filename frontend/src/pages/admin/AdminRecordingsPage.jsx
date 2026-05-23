// src/pages/admin/AdminRecordingsPage.jsx
import React, { useEffect, useState, useRef } from 'react';
import AppLayout from '../../components/Layout/AppLayout';
import API from '../../services/api';
import { getAudioStreamUrl } from '../../services/api';
import {
    LayoutDashboard, Users, Phone, Mic, FileText, Target,
    Search, RefreshCw, Play, Pause, Trash2, Filter,
    Clock, CheckCircle, AlertTriangle, Loader,
} from 'lucide-react';
import NotificationBell from '../../components/NotificationBell';

const ADMIN_NAV = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/admin/calls', label: 'All Calls', icon: Phone },
    { path: '/admin/recordings', label: 'Recordings', icon: Mic },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/reports', label: 'Reports', icon: FileText },
    { path: '/admin/lead-scoring', label: 'Lead Scoring', icon: Target },   
    { path: '/admin/search', label: 'Search', icon: Search },
];

const STATUS_ICON = {
    pending: Clock, processing: Loader, analysed: CheckCircle,
    completed: CheckCircle, failed: AlertTriangle,
};
const STATUS_COLOR = {
    pending: '#d97706', processing: '#2563eb',
    analysed: '#16a34a', completed: '#16a34a', failed: '#dc2626',
};

export default function AdminRecordingsPage() {
    const [recordings, setRecordings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [personFilter, setPerson] = useState('all');
    const [playingId, setPlayingId] = useState(null);
    const audioRef = useRef(null);

    const fetchRecordings = async () => {
        setLoading(true);
        try {
            // Admin hits the /audio endpoint which returns all recordings (backend filters by role)
            const res = await API.get('/audio');
            setRecordings(res.data.recordings || []);
        } catch { } finally { setLoading(false); }
    };

    useEffect(() => { fetchRecordings(); }, []);

    const persons = [...new Set(recordings.map(r => r.uploadedBy?.fullName).filter(Boolean))];

    const filtered = recordings.filter(r => {
        const matchPerson = personFilter === 'all' || r.uploadedBy?.fullName === personFilter;
        const q = search.toLowerCase();
        const matchSearch = !q ||
            r.title?.toLowerCase().includes(q) ||
            r.originalFileName?.toLowerCase().includes(q) ||
            r.uploadedBy?.fullName?.toLowerCase().includes(q);
        return matchPerson && matchSearch;
    });

    const handlePlay = (id) => {
        if (playingId === id) {
            audioRef.current?.pause();
            setPlayingId(null);
        } else {
            setPlayingId(id);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this recording? This cannot be undone.')) return;
        try {
            await API.delete(`/audio/${id}`);
            setRecordings(prev => prev.filter(r => r._id !== id));
            if (playingId === id) setPlayingId(null);
        } catch { alert('Delete failed.'); }
    };

    const fmtDuration = (s) => s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : '—';
    const fmtSize = (mb) => !mb ? '—' : mb < 1 ? `${Math.round(mb * 1024)} KB` : `${mb.toFixed(1)} MB`;

    return (
        <AppLayout navItems={ADMIN_NAV} panelLabel="Admin Panel">
            <div style={{ padding: '32px 40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1a1a1a', letterSpacing: '-0.02em', margin: '0 0 4px' }}>All Recordings</h1>
                        <p style={{ color: '#8a8480', fontSize: '14px', margin: 0 }}>{recordings.length} audio files across all counsellors</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <NotificationBell />
                        <button onClick={fetchRecordings} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', background: 'white', border: '1px solid #e8e3da', borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#6b6560', fontFamily: 'inherit' }}>
                            <RefreshCw size={14} style={loading ? { animation: 'spin 1s linear infinite' } : {}} /> Refresh
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                        <Search size={14} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search recordings…"
                            style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #e8e3da', borderRadius: '12px', fontSize: '13px', background: 'white', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Filter size={14} style={{ color: '#aaa' }} />
                        <select value={personFilter} onChange={e => setPerson(e.target.value)}
                            style={{ padding: '10px 14px', border: '1px solid #e8e3da', borderRadius: '12px', fontSize: '13px', background: 'white', fontFamily: 'inherit', cursor: 'pointer', outline: 'none' }}>
                            <option value="all">All Counsellors</option>
                            {persons.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                        <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', color: '#6366f1' }} />
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 20px', background: 'white', borderRadius: '20px', border: '1px solid #e8e3da' }}>
                        <Mic size={36} style={{ color: '#d4d0cc', marginBottom: '12px' }} />
                        <p style={{ fontWeight: '700', color: '#1a1a1a', margin: '0 0 6px' }}>No recordings found</p>
                        <p style={{ color: '#aaa', fontSize: '13px', margin: 0 }}>Try adjusting your filters</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {filtered.map(rec => {
                            const isPlaying = playingId === rec._id;
                            const StatusIcon = STATUS_ICON[rec.status] || Clock;
                            const statusColor = STATUS_COLOR[rec.status] || '#d97706';

                            return (
                                <div key={rec._id} style={{ background: 'white', borderRadius: '16px', border: '1px solid #e8e3da', padding: '18px 20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                                        {/* Play button */}
                                        <button onClick={() => handlePlay(rec._id)} style={{
                                            width: '40px', height: '40px', borderRadius: '50%', border: 'none',
                                            background: isPlaying ? '#6366f1' : '#f0ece6', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                        }}>
                                            {isPlaying
                                                ? <Pause size={16} color="white" />
                                                : <Play size={16} color="#6366f1" />
                                            }
                                        </button>

                                        {/* Info */}
                                        <div style={{ flex: 1, minWidth: '160px' }}>
                                            <div style={{ fontWeight: '700', fontSize: '14px', color: '#1a1a1a', marginBottom: '3px' }}>
                                                {rec.title || rec.originalFileName || 'Untitled'}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#aaa', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                                <span>👤 {rec.uploadedBy?.fullName || '—'}</span>
                                                <span>⏱ {fmtDuration(rec.durationSeconds)}</span>
                                                <span>💾 {fmtSize(rec.fileSizeMB)}</span>
                                                <span>📅 {new Date(rec.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        {/* Status */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                            <StatusIcon size={13} style={{ color: statusColor }} />
                                            <span style={{ fontSize: '12px', fontWeight: '700', color: statusColor }}>
                                                {rec.status?.charAt(0).toUpperCase() + rec.status?.slice(1)}
                                            </span>
                                        </div>

                                        {/* Delete */}
                                        <button onClick={() => handleDelete(rec._id)} style={{
                                            padding: '7px 12px', borderRadius: '10px', border: '1px solid #fecaca',
                                            background: 'white', color: '#dc2626', cursor: 'pointer', fontFamily: 'inherit',
                                            display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: '600',
                                        }}>
                                            <Trash2 size={13} /> Delete
                                        </button>
                                    </div>

                                    {/* Audio player */}
                                    {isPlaying && (
                                        <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #f0ece6' }}>
                                            <audio
                                                ref={audioRef}
                                                src={getAudioStreamUrl(rec._id)}
                                                controls
                                                autoPlay
                                                onEnded={() => setPlayingId(null)}
                                                style={{ width: '100%', height: '36px' }}
                                            />
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
