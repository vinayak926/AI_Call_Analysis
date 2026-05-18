// src/pages/counselor/CounselorCallsPage.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../../components/Layout/AppLayout';
import API from '../../services/api';
import {
    LayoutDashboard, Phone, Mic, Upload,
    Search, RefreshCw, FileAudio, Clock, Zap, Loader,
} from 'lucide-react';

const COUNSELOR_NAV = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/calls', label: 'My Calls', icon: Phone },
    { path: '/recordings', label: 'Recordings', icon: Mic },
    { path: '/upload', label: 'Upload', icon: Upload },
];

const STATUS_CFG = {
    pending: { label: 'Pending', color: '#d97706', bg: '#fffbeb' },
    processing: { label: 'Processing', color: '#2563eb', bg: '#eff6ff' },
    completed: { label: 'Completed', color: '#16a34a', bg: '#f0fdf4' },
    failed: { label: 'Failed', color: '#dc2626', bg: '#fef2f2' },
};
const SENT_COLORS = { Positive: '#16a34a', Negative: '#dc2626', Neutral: '#d97706' };

export default function CounselorCallsPage() {
    const [calls, setCalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatus] = useState('all');
    const [analysingId, setAnalysingId] = useState(null);

    const fetchCalls = async () => {
        setLoading(true);
        try {
            const res = await API.get('/calls');
            setCalls(res.data.calls || []);
        } catch { } finally { setLoading(false); }
    };

    useEffect(() => { fetchCalls(); }, []);

    const handleAnalyse = async (id) => {
        setAnalysingId(id);
        try { await API.post(`/audio/${id}/analyse`); }
        catch { }
        setTimeout(() => { fetchCalls(); setAnalysingId(null); }, 2500);
    };

    const filtered = calls.filter(c => {
        const matchStatus = statusFilter === 'all' || c.status === statusFilter;
        const q = search.toLowerCase();
        const matchSearch = !q || c.originalFileName?.toLowerCase().includes(q) ||
            c.sentiment?.toLowerCase().includes(q) || c.studentName?.toLowerCase().includes(q);
        return matchStatus && matchSearch;
    });

    const counts = {
        all: calls.length,
        pending: calls.filter(c => c.status === 'pending').length,
        completed: calls.filter(c => c.status === 'completed').length,
        failed: calls.filter(c => c.status === 'failed').length,
    };

    return (
        <AppLayout navItems={COUNSELOR_NAV} panelLabel="My Panel">
            <div style={{ padding: '32px 40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1a1a1a', letterSpacing: '-0.02em', margin: '0 0 4px' }}>My Calls</h1>
                        <p style={{ color: '#8a8480', fontSize: '14px', margin: 0 }}>{calls.length} total uploads</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={fetchCalls} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', background: 'white', border: '1px solid #e8e3da', borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#6b6560', fontFamily: 'inherit' }}>
                            <RefreshCw size={14} style={loading ? { animation: 'spin 1s linear infinite' } : {}} /> Refresh
                        </button>
                        <Link to="/upload" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', background: '#111', borderRadius: '12px', color: 'white', fontWeight: '700', fontSize: '13px', textDecoration: 'none' }}>
                            + Upload
                        </Link>
                    </div>
                </div>

                {/* Search */}
                <div style={{ position: 'relative', marginBottom: '16px' }}>
                    <Search size={14} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search by file name, student, sentiment…"
                        style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #e8e3da', borderRadius: '12px', fontSize: '13px', background: 'white', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                </div>

                {/* Status Tabs */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                    {['all', 'pending', 'completed', 'failed'].map(s => (
                        <button key={s} onClick={() => setStatus(s)} style={{
                            padding: '7px 14px', borderRadius: '10px', border: '1px solid',
                            borderColor: statusFilter === s ? '#111' : '#e8e3da',
                            background: statusFilter === s ? '#111' : 'white',
                            color: statusFilter === s ? 'white' : '#6b6560',
                            fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
                        }}>{s.charAt(0).toUpperCase() + s.slice(1)} ({counts[s] ?? 0})</button>
                    ))}
                </div>

                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                        <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', color: '#6366f1' }} />
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 20px', background: 'white', borderRadius: '20px', border: '1px solid #e8e3da' }}>
                        <FileAudio size={36} style={{ color: '#d4d0cc', marginBottom: '12px' }} />
                        <p style={{ fontWeight: '700', color: '#1a1a1a', margin: '0 0 6px' }}>
                            {search || statusFilter !== 'all' ? 'No calls match your filters' : 'No calls yet'}
                        </p>
                        {!search && statusFilter === 'all' && (
                            <Link to="/upload" style={{ color: '#6366f1', fontWeight: '700', textDecoration: 'none', fontSize: '13px' }}>+ Upload your first call →</Link>
                        )}
                    </div>
                ) : (
                    <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e8e3da', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead>
                                <tr style={{ background: '#f8f7f4', borderBottom: '1px solid #e8e3da' }}>
                                    {['File', 'Date', 'Duration', 'Lead Score', 'Sentiment', 'Status', 'Actions'].map(h => (
                                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((call, i) => {
                                    const st = STATUS_CFG[call.status] || STATUS_CFG.pending;
                                    const canAnalyse = call.status === 'pending' || call.status === 'failed';
                                    const isAnalysing = analysingId === call._id;
                                    return (
                                        <tr key={call._id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f0ece6' : 'none' }}>
                                            <td style={{ padding: '14px 16px' }}>
                                                <div style={{ fontWeight: '700', color: '#1a1a1a', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{call.originalFileName}</div>
                                                <div style={{ fontSize: '11px', color: '#aaa' }}>{call.fileSizeMB} MB</div>
                                            </td>
                                            <td style={{ padding: '14px 16px', color: '#aaa', fontSize: '12px' }}>{new Date(call.createdAt).toLocaleDateString()}</td>
                                            <td style={{ padding: '14px 16px', color: '#6b6560' }}>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                    <Clock size={11} style={{ opacity: 0.5 }} />
                                                    {call.durationSeconds ? `${Math.floor(call.durationSeconds / 60)}:${String(call.durationSeconds % 60).padStart(2, '0')}` : '—'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '14px 16px', fontWeight: '800', fontSize: '15px', color: call.leadScore >= 7 ? '#16a34a' : call.leadScore >= 4 ? '#d97706' : call.leadScore ? '#dc2626' : '#1a1a1a' }}>
                                                {call.leadScore ?? '—'}
                                            </td>
                                            <td style={{ padding: '14px 16px' }}>
                                                {call.sentiment ? <span style={{ background: SENT_COLORS[call.sentiment] + '18', color: SENT_COLORS[call.sentiment], padding: '3px 10px', borderRadius: '50px', fontSize: '11px', fontWeight: '700' }}>{call.sentiment}</span> : '—'}
                                            </td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <span style={{ background: st.bg, color: st.color, padding: '3px 10px', borderRadius: '50px', fontSize: '11px', fontWeight: '700' }}>{st.label}</span>
                                            </td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    <Link to={`/calls/${call._id}`} style={{ color: '#6366f1', fontWeight: '700', textDecoration: 'none', fontSize: '13px' }}>View →</Link>
                                                    {canAnalyse && (
                                                        <button onClick={() => handleAnalyse(call._id)} disabled={isAnalysing}
                                                            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '8px', border: 'none', background: isAnalysing ? '#f0f0f0' : '#6366f1', color: isAnalysing ? '#999' : 'white', fontWeight: '700', fontSize: '11px', cursor: isAnalysing ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                                                            {isAnalysing ? <><Loader size={11} style={{ animation: 'spin 1s linear infinite' }} /> Wait…</> : <><Zap size={11} /> Analyse</>}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        </AppLayout>
    );
}
