// frontend/src/pages/admin/AdminLeadScoringPage.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../../components/Layout/AppLayout';
import API from '../../services/api';
import { LayoutDashboard, Users, Phone, Mic, FileText, Target, BarChart2, Search } from 'lucide-react';

const ADMIN_NAV = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/admin/calls', label: 'All Calls', icon: Phone },
    { path: '/admin/recordings', label: 'Recordings', icon: Mic },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/reports', label: 'Reports', icon: FileText },
    { path: '/admin/lead-scoring', label: 'Lead Scoring', icon: Target },
    { path: '/admin/search', label: 'Search', icon: Search },
];

const SENT_COLORS = { Positive: '#22c55e', Negative: '#ef4444', Neutral: '#f59e0b' };

function scoreStyle(score) {
    if (score >= 8) return { bg: '#f0fdf4', color: '#16a34a', label: 'Hot 🔥' };
    if (score >= 5) return { bg: '#fffbeb', color: '#d97706', label: 'Warm' };
    return { bg: '#fef2f2', color: '#dc2626', label: 'Cold' };
}

export default function AdminLeadScoringPage() {
    const [analyses, setAnalyses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [sortBy, setSortBy] = useState('leadScore');
    const [search, setSearch] = useState('');

    useEffect(() => {
        API.get('/analysis?status=completed&limit=200')
            .then(res => setAnalyses(res.data.analyses || []))
            .catch(() => setAnalyses([]))
            .finally(() => setLoading(false));
    }, []);

    const counts = {
        hot: analyses.filter(a => a.leadScore >= 8).length,
        warm: analyses.filter(a => a.leadScore >= 5 && a.leadScore < 8).length,
        cold: analyses.filter(a => a.leadScore < 5).length,
    };

    const filtered = analyses
        .filter(a => {
            if (filter === 'hot') return a.leadScore >= 8;
            if (filter === 'warm') return a.leadScore >= 5 && a.leadScore < 8;
            if (filter === 'cold') return a.leadScore < 5;
            return true;
        })
        .filter(a => {
            if (!search.trim()) return true;
            const q = search.toLowerCase();
            return (
                a.studentName?.toLowerCase().includes(q) ||
                a.counsellorName?.toLowerCase().includes(q) ||
                a.courseInterested?.toLowerCase().includes(q)
            );
        })
        .sort((a, b) => (b[sortBy] ?? 0) - (a[sortBy] ?? 0));

    const btnStyle = (active) => ({
        padding: '8px 16px', borderRadius: '10px', border: '1px solid',
        borderColor: active ? '#6366f1' : '#e8e3da',
        background: active ? '#eef2ff' : 'white',
        color: active ? '#6366f1' : '#6b6560',
        fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit',
    });

    return (
        <AppLayout navItems={ADMIN_NAV} panelLabel="Admin Panel">
            <div style={{ padding: '32px 40px', maxWidth: '1200px' }}>

                {/* Header */}
                <div style={{ marginBottom: '24px' }}>
                    <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#1a1a1a', margin: '0 0 4px' }}>Lead Scoring</h1>
                    <p style={{ color: '#8a8480', fontSize: '14px', margin: 0 }}>All leads ranked by AI score — Hot, Warm, Cold</p>
                </div>

                {/* Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '24px' }}>
                    {[
                        { label: '🔥 Hot Leads', count: counts.hot, sub: 'Score 8–10', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
                        { label: '🌡 Warm Leads', count: counts.warm, sub: 'Score 5–7', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
                        { label: '❄️ Cold Leads', count: counts.cold, sub: 'Score 1–4', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
                    ].map(({ label, count, sub, color, bg, border }) => (
                        <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: '16px', padding: '20px' }}>
                            <div style={{ fontSize: '32px', fontWeight: '800', color, letterSpacing: '-0.02em' }}>{count}</div>
                            <div style={{ fontWeight: '700', fontSize: '14px', color, marginTop: '2px' }}>{label}</div>
                            <div style={{ fontSize: '12px', color: '#8a8480', marginTop: '2px' }}>{sub}</div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        {[
                            { key: 'all', label: `All (${analyses.length})` },
                            { key: 'hot', label: `Hot (${counts.hot})` },
                            { key: 'warm', label: `Warm (${counts.warm})` },
                            { key: 'cold', label: `Cold (${counts.cold})` },
                        ].map(({ key, label }) => (
                            <button key={key} onClick={() => setFilter(key)} style={btnStyle(filter === key)}>{label}</button>
                        ))}
                    </div>

                    <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value)}
                        style={{ padding: '9px 12px', borderRadius: '10px', border: '1px solid #e8e3da', fontSize: '13px', fontWeight: '600', fontFamily: 'inherit', cursor: 'pointer' }}
                    >
                        <option value="leadScore">Sort: Lead Score</option>
                        <option value="closingProbability">Sort: Closing %</option>
                        <option value="communicationScore">Sort: Communication</option>
                        <option value="engagementScore">Sort: Engagement</option>
                    </select>

                    <input
                        placeholder="Search student, counsellor, course..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ flex: 1, minWidth: '200px', padding: '9px 14px', borderRadius: '10px', border: '1px solid #e8e3da', fontSize: '13px', fontFamily: 'inherit', outline: 'none' }}
                    />
                </div>

                {/* Table */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#aaa' }}>Loading...</div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#aaa' }}>No leads found</div>
                ) : (
                    <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e8e3da', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead>
                                <tr style={{ background: '#f8f7f4', borderBottom: '1px solid #e8e3da' }}>
                                    {['#', 'Student', 'Counsellor', 'Course', 'Lead Score', 'Closing %', 'Sentiment', 'Follow-up', ''].map(h => (
                                        <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#8a8480', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((a, i) => {
                                    const sc = scoreStyle(a.leadScore);
                                    return (
                                        <tr key={a._id} style={{ borderBottom: '1px solid #f8f7f4' }}>
                                            <td style={{ padding: '13px 14px', color: '#aaa', fontWeight: '700', fontSize: '12px' }}>#{i + 1}</td>
                                            <td style={{ padding: '13px 14px', fontWeight: '700', color: '#1a1a1a' }}>{a.studentName || '—'}</td>
                                            <td style={{ padding: '13px 14px', color: '#6b6560' }}>{a.counsellorName || '—'}</td>
                                            <td style={{ padding: '13px 14px', color: '#6b6560' }}>{a.courseInterested || '—'}</td>
                                            <td style={{ padding: '13px 14px' }}>
                                                <span style={{ background: sc.bg, color: sc.color, padding: '5px 12px', borderRadius: '20px', fontWeight: '800', fontSize: '13px', whiteSpace: 'nowrap' }}>
                                                    {a.leadScore}/10 — {sc.label}
                                                </span>
                                            </td>
                                            <td style={{ padding: '13px 14px', fontWeight: '700', color: '#1a1a1a' }}>
                                                {a.closingProbability != null ? `${a.closingProbability}%` : '—'}
                                            </td>
                                            <td style={{ padding: '13px 14px' }}>
                                                {a.sentiment
                                                    ? <span style={{ background: SENT_COLORS[a.sentiment] + '20', color: SENT_COLORS[a.sentiment], padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>{a.sentiment}</span>
                                                    : '—'}
                                            </td>
                                            <td style={{ padding: '13px 14px' }}>
                                                {a.followUpRequired
                                                    ? <span style={{ background: '#fffbeb', color: '#d97706', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
                                                        Yes{a.followUpDate ? ` · ${a.followUpDate}` : ''}
                                                    </span>
                                                    : <span style={{ color: '#ccc', fontSize: '12px' }}>No</span>}
                                            </td>
                                            <td style={{ padding: '13px 14px' }}>
                                                <Link to={`/calls/${a.audioRecordingId}`} style={{ color: '#6366f1', fontWeight: '700', textDecoration: 'none', fontSize: '12px' }}>View →</Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AppLayout>
        
    );
}