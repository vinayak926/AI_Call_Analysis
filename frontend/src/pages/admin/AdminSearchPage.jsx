// frontend/src/pages/admin/AdminSearchPage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../../components/Layout/AppLayout';
import API from '../../services/api';
import { LayoutDashboard, Users, Phone, Mic, FileText, Target, Search, X } from 'lucide-react';

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

function scoreColor(score) {
    if (score >= 8) return '#16a34a';
    if (score >= 5) return '#d97706';
    return '#dc2626';
}

export default function AdminSearchPage() {
    const [keyword, setKeyword] = useState('');
    const [sentiment, setSentiment] = useState('');
    const [interested, setInterested] = useState('');
    const [counsellor, setCounsellor] = useState('');
    const [course, setCourse] = useState('');
    const [results, setResults] = useState([]);
    const [searched, setSearched] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        setLoading(true);
        setSearched(true);
        try {
            const params = new URLSearchParams({ limit: '100' });
            if (keyword.trim()) params.set('keyword', keyword.trim());
            if (sentiment) params.set('sentiment', sentiment);
            if (interested) params.set('interested', interested);
            if (counsellor.trim()) params.set('counsellorName', counsellor.trim());
            if (course.trim()) params.set('courseInterested', course.trim());
            const res = await API.get(`/analysis?${params.toString()}`);
            setResults(res.data.analyses || []);
        } catch {
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const clearAll = () => {
        setKeyword(''); setSentiment(''); setInterested('');
        setCounsellor(''); setCourse('');
        setResults([]); setSearched(false);
    };

    const onKeyDown = (e) => { if (e.key === 'Enter') handleSearch(); };

    const inputStyle = {
        padding: '9px 14px', borderRadius: '10px', border: '1px solid #e8e3da',
        fontSize: '13px', fontFamily: 'inherit', outline: 'none',
    };
    const selectStyle = { ...inputStyle, cursor: 'pointer', background: 'white', fontWeight: '600', color: '#4b5563' };

    return (
        <AppLayout navItems={ADMIN_NAV} panelLabel="Admin Panel">
            <div style={{ padding: '32px 40px', maxWidth: '1200px' }}>

                {/* Header */}
                <div style={{ marginBottom: '24px' }}>
                    <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#1a1a1a', margin: '0 0 4px' }}>Search Calls</h1>
                    <p style={{ color: '#8a8480', fontSize: '14px', margin: 0 }}>Find calls by student, counsellor, course, or keywords</p>
                </div>

                {/* Search Panel */}
                <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e8e3da', padding: '24px', marginBottom: '20px' }}>

                    {/* Main search bar */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#bbb' }} />
                            <input
                                value={keyword}
                                onChange={e => setKeyword(e.target.value)}
                                onKeyDown={onKeyDown}
                                placeholder="Search by student name, concern keywords, summary..."
                                style={{ ...inputStyle, width: '100%', paddingLeft: '36px', boxSizing: 'border-box', fontSize: '14px' }}
                            />
                        </div>
                        <button
                            onClick={handleSearch}
                            style={{ padding: '9px 24px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}
                        >Search</button>
                        {searched && (
                            <button
                                onClick={clearAll}
                                style={{ padding: '9px 14px', background: 'white', color: '#6b6560', border: '1px solid #e8e3da', borderRadius: '10px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '4px' }}
                            ><X size={13} /> Clear</button>
                        )}
                    </div>

                    {/* Filter row */}
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <select value={sentiment} onChange={e => setSentiment(e.target.value)} style={selectStyle}>
                            <option value="">All Sentiments</option>
                            <option value="Positive">Positive</option>
                            <option value="Negative">Negative</option>
                            <option value="Neutral">Neutral</option>
                        </select>
                        <select value={interested} onChange={e => setInterested(e.target.value)} style={selectStyle}>
                            <option value="">All Interest</option>
                            <option value="true">Interested</option>
                            <option value="false">Not Interested</option>
                        </select>
                        <input value={counsellor} onChange={e => setCounsellor(e.target.value)} onKeyDown={onKeyDown} placeholder="Counsellor name..." style={inputStyle} />
                        <input value={course} onChange={e => setCourse(e.target.value)} onKeyDown={onKeyDown} placeholder="Course name..." style={inputStyle} />
                    </div>
                </div>

                {/* Results */}
                {loading && (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#aaa', fontSize: '14px' }}>Searching...</div>
                )}

                {!loading && searched && (
                    <>
                        <div style={{ marginBottom: '14px', fontSize: '13px', color: '#6b6560', fontWeight: '600' }}>
                            {results.length === 0 ? '❌ No results found' : `✅ ${results.length} result${results.length !== 1 ? 's' : ''} found`}
                        </div>

                        {results.length > 0 && (
                            <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e8e3da', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                    <thead>
                                        <tr style={{ background: '#f8f7f4', borderBottom: '1px solid #e8e3da' }}>
                                            {['Student', 'Counsellor', 'Course', 'City', 'Score', 'Sentiment', 'Interested', 'Concerns', ''].map(h => (
                                                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#8a8480', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.map((a, i) => (
                                            <tr key={a._id} style={{ borderBottom: i < results.length - 1 ? '1px solid #f8f7f4' : 'none' }}>
                                                <td style={{ padding: '13px 14px', fontWeight: '700', color: '#1a1a1a' }}>{a.studentName || '—'}</td>
                                                <td style={{ padding: '13px 14px', color: '#6b6560' }}>{a.counsellorName || '—'}</td>
                                                <td style={{ padding: '13px 14px', color: '#6b6560' }}>{a.courseInterested || '—'}</td>
                                                <td style={{ padding: '13px 14px', color: '#6b6560' }}>{a.city || '—'}</td>
                                                <td style={{ padding: '13px 14px' }}>
                                                    <span style={{ fontWeight: '800', fontSize: '14px', color: scoreColor(a.leadScore) }}>{a.leadScore ?? '—'}/10</span>
                                                </td>
                                                <td style={{ padding: '13px 14px' }}>
                                                    {a.sentiment
                                                        ? <span style={{ background: SENT_COLORS[a.sentiment] + '20', color: SENT_COLORS[a.sentiment], padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>{a.sentiment}</span>
                                                        : '—'}
                                                </td>
                                                <td style={{ padding: '13px 14px' }}>
                                                    <span style={{ fontWeight: '700', color: a.interested ? '#16a34a' : '#dc2626' }}>{a.interested ? '✓ Yes' : '✗ No'}</span>
                                                </td>
                                                <td style={{ padding: '13px 14px', maxWidth: '160px' }}>
                                                    {a.keyConcerns?.length
                                                        ? <span style={{ color: '#6b6560', fontSize: '12px' }}>{a.keyConcerns.slice(0, 2).join(', ')}{a.keyConcerns.length > 2 ? '…' : ''}</span>
                                                        : <span style={{ color: '#ccc' }}>—</span>}
                                                </td>
                                                <td style={{ padding: '13px 14px' }}>
                                                    <Link to={`/calls/${a.audioRecordingId}`} style={{ color: '#6366f1', fontWeight: '700', textDecoration: 'none', fontSize: '12px', whiteSpace: 'nowrap' }}>View →</Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}

                {!loading && !searched && (
                    <div style={{ textAlign: 'center', padding: '80px 20px', color: '#ccc' }}>
                        <Search size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                        <p style={{ fontSize: '14px', margin: 0, color: '#aaa' }}>Type a keyword or apply filters, then press Search</p>
                    </div>
                )}

            </div>
        </AppLayout>
    );
}