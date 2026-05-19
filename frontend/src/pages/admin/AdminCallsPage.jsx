// src/pages/admin/AdminCallsPage.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../../components/Layout/AppLayout';
import API from '../../services/api';
import {
    LayoutDashboard, Users, Phone, Mic, FileText,
    Search, RefreshCw, FileAudio, Clock, Filter,
} from 'lucide-react';

const ADMIN_NAV = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/admin/calls', label: 'All Calls', icon: Phone },
    { path: '/admin/recordings', label: 'Recordings', icon: Mic },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/reports', label: 'Reports', icon: FileText },
];

const STATUS_CFG = {
    pending: { label: 'Pending', color: '#d97706', bg: '#fffbeb' },
    processing: { label: 'Processing', color: '#2563eb', bg: '#eff6ff' },
    completed: { label: 'Completed', color: '#16a34a', bg: '#f0fdf4' },
    failed: { label: 'Failed', color: '#dc2626', bg: '#fef2f2' },
};
const SENT_COLORS = { Positive: '#16a34a', Negative: '#dc2626', Neutral: '#d97706' };

export default function AdminCallsPage() {
    const [allCalls, setAllCalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatus] = useState('all');
    const [counsellorFilter, setCounsellor] = useState('all');
    const [total, setTotal] = useState(0);

    const [debouncedSearch, setDebouncedSearch] = useState('');
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 400);
        return () => clearTimeout(t);
    }, [search]);

    const fetchCalls = async () => {
        setLoading(true);
        try {
            const callsRes = await API.get('/calls');
            const allCallsData = callsRes.data.calls || [];
            setAllCalls(allCallsData);
            setTotal(allCallsData.length);
        } catch (e) {
            console.error('Failed to load calls:', e);
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchCalls(); }, []);

    const counsellors = [...new Set(allCalls.map(c => c.uploadedBy?.fullName).filter(Boolean))];

    const filtered = allCalls.filter(c => {
        const matchCounsellor = counsellorFilter === 'all' || c.uploadedBy?.fullName === counsellorFilter;
        const matchStatus = statusFilter === 'all' || c.status === statusFilter;
        const q = debouncedSearch.toLowerCase();
        const matchSearch = !q ||
            c.originalFileName?.toLowerCase().includes(q) ||
            c.uploadedBy?.fullName?.toLowerCase().includes(q) ||
            c.studentName?.toLowerCase().includes(q) ||
            c.sentiment?.toLowerCase().includes(q);
        return matchCounsellor && matchStatus && matchSearch;
    });

    const counts = {
        all: allCalls.length,
        pending: allCalls.filter(c => c.status === 'pending').length,
        processing: allCalls.filter(c => c.status === 'processing').length,
        completed: allCalls.filter(c => c.status === 'completed').length,
        failed: allCalls.filter(c => c.status === 'failed').length,
    };
    
    return (
        <AppLayout navItems={ADMIN_NAV} panelLabel="Admin Panel">
            <div style={{ padding: '32px 40px' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1a1a1a', letterSpacing: '-0.02em', margin: '0 0 4px' }}>All Calls</h1>
                        <p style={{ color: '#8a8480', fontSize: '14px', margin: 0 }}>{allCalls.length} total across all counsellors</p>
                    </div>
                    <button onClick={fetchCalls} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', background: 'white', border: '1px solid #e8e3da', borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#6b6560', fontFamily: 'inherit' }}>
                        <RefreshCw size={14} style={loading ? { animation: 'spin 1s linear infinite' } : {}} /> Refresh
                    </button>
                </div>

                {/* Filters Row */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Search */}
                    <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                        <Search size={14} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search file, student, counsellor, sentiment…"
                            style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #e8e3da', borderRadius: '12px', fontSize: '13px', background: 'white', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                    {/* Counsellor filter */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Filter size={14} style={{ color: '#aaa' }} />
                        <select value={counsellorFilter} onChange={e => setCounsellor(e.target.value)}
                            style={{ padding: '10px 14px', border: '1px solid #e8e3da', borderRadius: '12px', fontSize: '13px', background: 'white', fontFamily: 'inherit', cursor: 'pointer', outline: 'none' }}>
                            <option value="all">All Counsellors</option>
                            {counsellors.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>

                {/* Status Tabs */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                    {['all', 'pending', 'processing', 'completed', 'failed'].map(s => (
                        <button key={s} onClick={() => setStatus(s)} style={{
                            padding: '7px 16px', borderRadius: '10px', border: '1px solid',
                            borderColor: statusFilter === s ? '#111' : '#e8e3da',
                            background: statusFilter === s ? '#111' : 'white',
                            color: statusFilter === s ? 'white' : '#6b6560',
                            fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
                        }}>{s.charAt(0).toUpperCase() + s.slice(1)} ({counts[s] ?? 0})</button>
                    ))}
                </div>

                {/* Table */}
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                        <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', color: '#6366f1' }} />
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 20px', background: 'white', borderRadius: '20px', border: '1px solid #e8e3da' }}>
                        <FileAudio size={36} style={{ color: '#d4d0cc', marginBottom: '12px' }} />
                        <p style={{ fontWeight: '700', color: '#1a1a1a', margin: '0 0 6px' }}>No calls found</p>
                        <p style={{ color: '#aaa', fontSize: '13px', margin: 0 }}>Try adjusting your filters</p>
                    </div>
                ) : (
                    <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e8e3da', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead>
                                <tr style={{ background: '#f8f7f4', borderBottom: '1px solid #e8e3da' }}>
                                    {['File', 'Counsellor', 'Date', 'Duration', 'Lead Score', 'Sentiment', 'Status', ''].map(h => (
                                        <th key={h} style={{ padding: '13px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((call, i) => {
                                    const st = STATUS_CFG[call.status] || STATUS_CFG.pending;
                                    return (
                                        <tr key={call._id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f0ece6' : 'none' }}>
                                            <td style={{ padding: '14px 16px' }}>
                                                <div style={{ fontWeight: '700', color: '#1a1a1a', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{call.originalFileName || call.title}</div>
                                                <div style={{ fontSize: '11px', color: '#aaa' }}>{call.fileSizeMB} MB</div>
                                            </td>
                                            <td style={{ padding: '14px 16px', color: '#6b6560', fontWeight: '600' }}>{call.uploadedBy?.fullName || '—'}</td>
                                            <td style={{ padding: '14px 16px', color: '#aaa', fontSize: '12px' }}>{new Date(call.createdAt).toLocaleDateString()}</td>
                                            <td style={{ padding: '14px 16px', color: '#6b6560' }}>
                                                {call.durationSeconds ? `${Math.floor(call.durationSeconds / 60)}:${String(call.durationSeconds % 60).padStart(2, '0')}` : '—'}
                                            </td>
                                            <td style={{ padding: '14px 16px' }}>
                                                {call.leadScore != null ? (
                                                    <span style={{ fontWeight: '800', fontSize: '15px', color: call.leadScore >= 7 ? '#16a34a' : call.leadScore >= 4 ? '#d97706' : '#dc2626' }}>{call.leadScore}</span>
                                                ) : '—'}
                                            </td>
                                            <td style={{ padding: '14px 16px' }}>
                                                {call.sentiment ? <span style={{ background: SENT_COLORS[call.sentiment] + '18', color: SENT_COLORS[call.sentiment], padding: '3px 10px', borderRadius: '50px', fontSize: '11px', fontWeight: '700' }}>{call.sentiment}</span> : '—'}
                                            </td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <span style={{ background: st.bg, color: st.color, padding: '3px 10px', borderRadius: '50px', fontSize: '11px', fontWeight: '700' }}>{st.label}</span>
                                            </td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <Link to={`/calls/${call._id}`} style={{ color: '#6366f1', fontWeight: '700', textDecoration: 'none', fontSize: '13px' }}>View →</Link>
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
