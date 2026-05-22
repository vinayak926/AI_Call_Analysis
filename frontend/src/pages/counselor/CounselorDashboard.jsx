// src/pages/counselor/CounselorDashboard.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../../components/Layout/AppLayout';
import API from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard, Phone, Mic, Upload,
    TrendingUp, Clock, Target, RefreshCw,
    ChevronRight, Smile, Frown, Meh,
} from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const COUNSELOR_NAV = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/calls', label: 'My Calls', icon: Phone },
    { path: '/recordings', label: 'Recordings', icon: Mic },
    { path: '/upload', label: 'Upload', icon: Upload },
];

const SENT_COLORS = { Positive: '#22c55e', Negative: '#ef4444', Neutral: '#f59e0b' };
const SENT_BG = { Positive: '#f0fdf4', Negative: '#fef2f2', Neutral: '#fffbeb' };

const KPICard = ({ label, value, sub, icon: Icon, color, bg }) => (
    <div style={{ background: 'white', borderRadius: '18px', border: '1px solid #e8e3da', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={17} style={{ color }} />
            </div>
            {sub && <span style={{ fontSize: '11px', color: '#aaa', background: '#f8f7f4', padding: '3px 8px', borderRadius: '6px' }}>{sub}</span>}
        </div>
        <div style={{ fontSize: '28px', fontWeight: '800', color: '#1a1a1a', letterSpacing: '-0.02em' }}>{value}</div>
        <div style={{ fontSize: '13px', color: '#8a8480', marginTop: '2px' }}>{label}</div>
    </div>
);

export default function CounselorDashboard() {
    const { user } = useAuth();
    const [calls, setCalls] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await API.get('/calls'); // backend filters by logged-in user
                setCalls(res.data.calls || []);
            } catch { }
            finally { setLoading(false); }
        })();
    }, []);

    const completed = calls.filter(c => c.status === 'completed');
    const pending = calls.filter(c => c.status === 'pending');
    const followUps = completed.filter(c => c.followUpRequired === true);

    const avgLead = completed.length
        ? (completed.reduce((s, c) => s + (c.leadScore || 0), 0) / completed.length).toFixed(1)
        : '—';

    const sentCounts = { Positive: 0, Negative: 0, Neutral: 0 };
    completed.forEach(c => { if (c.sentiment && sentCounts[c.sentiment] !== undefined) sentCounts[c.sentiment]++; });

    // Daily last 10 days
    const daily = Array.from({ length: 10 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (9 - i));
        const ds = d.toISOString().split('T')[0];
        return {
            name: d.toLocaleDateString('en-US', { weekday: 'short' }),
            calls: calls.filter(c => c.createdAt?.startsWith(ds)).length,
        };
    });

    // Lead score buckets
    const buckets = [
        { name: '1-3', count: completed.filter(c => c.leadScore >= 1 && c.leadScore <= 3).length },
        { name: '4-6', count: completed.filter(c => c.leadScore >= 4 && c.leadScore <= 6).length },
        { name: '7-8', count: completed.filter(c => c.leadScore >= 7 && c.leadScore <= 8).length },
        { name: '9-10', count: completed.filter(c => c.leadScore >= 9).length },
    ];

    const recent = [...calls].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

    const STATUS_CFG = {
        pending: { label: 'Pending', color: '#d97706', bg: '#fffbeb' },
        processing: { label: 'Processing', color: '#2563eb', bg: '#eff6ff' },
        completed: { label: 'Completed', color: '#16a34a', bg: '#f0fdf4' },
        failed: { label: 'Failed', color: '#dc2626', bg: '#fef2f2' },
    };

    return (
        <AppLayout navItems={COUNSELOR_NAV} panelLabel="My Panel">
            <div style={{ padding: '32px 40px', maxWidth: '1100px' }}>
                {/* Header */}
                <div style={{ marginBottom: '28px' }}>
                    <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#1a1a1a', letterSpacing: '-0.02em', margin: '0 0 4px' }}>
                        Welcome back, {user?.fullName?.split(' ')[0]} 👋
                    </h1>
                    <p style={{ color: '#8a8480', fontSize: '14px', margin: 0 }}>Here's your performance summary</p>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                        <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', color: '#6366f1' }} />
                    </div>
                ) : (
                    <>
                        {/* KPIs */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '14px', marginBottom: '24px' }}>
                            <KPICard label="Total Calls" value={calls.length} sub="all time" icon={Phone} color="#6366f1" bg="#eef2ff" />
                            <KPICard label="Analysed" value={completed.length} sub={`${calls.length ? Math.round(completed.length / calls.length * 100) : 0}%`} icon={TrendingUp} color="#22c55e" bg="#f0fdf4" />
                            <KPICard label="Avg Lead Score" value={avgLead} sub="out of 10" icon={Target} color="#f59e0b" bg="#fffbeb" />
                            <KPICard label="Pending" value={pending.length} sub="to process" icon={Clock} color="#8b5cf6" bg="#f5f3ff" />
                            <KPICard label="Follow-ups Due" value={followUps.length} sub="need callback" icon={Phone} color="#ef4444" bg="#fef2f2" />
                        </div>

                        {/* Sentiment row */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px', marginBottom: '24px' }}>
                            {[['Positive', Smile], ['Neutral', Meh], ['Negative', Frown]].map(([s, Icon]) => (
                                <div key={s} style={{ background: SENT_BG[s], border: `1px solid ${SENT_COLORS[s]}30`, borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <Icon size={22} style={{ color: SENT_COLORS[s] }} />
                                    <div>
                                        <div style={{ fontSize: '22px', fontWeight: '800', color: SENT_COLORS[s] }}>{sentCounts[s]}</div>
                                        <div style={{ fontSize: '12px', color: '#6b6560', fontWeight: '600' }}>{s} calls</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Charts */}
                        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '20px', marginBottom: '24px' }}>
                            <div style={{ background: 'white', borderRadius: '18px', border: '1px solid #e8e3da', padding: '22px' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 16px' }}>My Calls — Last 10 Days</h3>
                                <ResponsiveContainer width="100%" height={180}>
                                    <AreaChart data={daily}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0ece6" />
                                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#8a8480' }} />
                                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#8a8480' }} />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="calls" stroke="#6366f1" fill="#eef2ff" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            <div style={{ background: 'white', borderRadius: '18px', border: '1px solid #e8e3da', padding: '22px' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 16px' }}>Lead Score Distribution</h3>
                                <ResponsiveContainer width="100%" height={180}>
                                    <BarChart data={buckets}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0ece6" />
                                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#8a8480' }} />
                                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#8a8480' }} />
                                        <Tooltip />
                                        <Bar dataKey="count" fill="#6366f1" radius={[5, 5, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Lead Score Leaderboard */}
                        <div style={{ background: 'white', borderRadius: '18px', border: '1px solid #e8e3da', padding: '22px', marginBottom: '24px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a1a', margin: 0 }}>🏆 My Top Leads by Score</h3>
                            <Link to="/calls" style={{ fontSize: '12px', color: '#6366f1', fontWeight: '700', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>View all <ChevronRight size={13} /></Link>
                          </div>
                          {completed.length === 0 ? (
                            <p style={{ color: '#aaa', fontSize: '13px', margin: 0, textAlign: 'center', padding: '20px 0' }}>No analysed calls yet</p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              {[...completed]
                                .sort((a, b) => (b.leadScore || 0) - (a.leadScore || 0))
                                .slice(0, 5)
                                .map((c, i) => {
                                  const score = c.leadScore || 0;
                                  const barColor = score >= 8 ? '#22c55e' : score >= 5 ? '#f59e0b' : '#ef4444';
                                  const badgeBg = score >= 8 ? '#f0fdf4' : score >= 5 ? '#fffbeb' : '#fef2f2';
                                  return (
                                    <div key={c._id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                      <span style={{
                                        width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                                        background: i === 0 ? '#fbbf24' : i === 1 ? '#9ca3af' : i === 2 ? '#b45309' : '#f0ece6',
                                        color: i < 3 ? 'white' : '#6b6560',
                                        fontSize: '11px', fontWeight: '800',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      }}>{i + 1}</span>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: '600', fontSize: '13px', color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                          {c.studentName || c.originalFileName || 'Unknown'}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>
                                          {c.courseInterested || '—'} · {c.sentiment || '—'}
                                        </div>
                                        <div style={{ marginTop: '5px', height: '5px', borderRadius: '3px', background: '#f0ece6', overflow: 'hidden' }}>
                                          <div style={{ height: '100%', width: `${score * 10}%`, background: barColor, borderRadius: '3px', transition: 'width 0.5s ease' }} />
                                        </div>
                                      </div>
                                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
                                        <span style={{ background: badgeBg, color: barColor, fontWeight: '800', fontSize: '16px', padding: '4px 10px', borderRadius: '10px' }}>{score}</span>
                                        <span style={{ fontSize: '9px', color: '#aaa', fontWeight: '600' }}>/ 10</span>
                                      </div>
                                      <Link to={`/calls/${c._id}`} style={{ color: '#6366f1', fontWeight: '700', textDecoration: 'none', fontSize: '12px', flexShrink: 0 }}>View →</Link>
                                    </div>
                                  );
                                })}
                            </div>
                          )}
                        </div>

                        {/* Recent calls */}
                        <div style={{ background: 'white', borderRadius: '18px', border: '1px solid #e8e3da', padding: '22px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a1a', margin: 0 }}>Recent Calls</h3>
                                <Link to="/calls" style={{ fontSize: '12px', color: '#6366f1', fontWeight: '700', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>View all <ChevronRight size={13} /></Link>
                            </div>
                            {recent.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '32px', color: '#aaa' }}>
                                    <p style={{ margin: '0 0 12px' }}>No calls yet</p>
                                    <Link to="/upload" style={{ color: '#6366f1', fontWeight: '700', textDecoration: 'none', fontSize: '13px' }}>+ Upload your first call →</Link>
                                </div>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid #f0ece6' }}>
                                            {['File', 'Date', 'Lead Score', 'Sentiment', 'Status', ''].map(h => (
                                                <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recent.map((c, i) => {
                                            const st = STATUS_CFG[c.status] || STATUS_CFG.pending;
                                            return (
                                                <tr key={c._id} style={{ borderBottom: i < recent.length - 1 ? '1px solid #f8f7f4' : 'none' }}>
                                                    <td style={{ padding: '11px 12px', fontWeight: '600', color: '#1a1a1a', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.originalFileName}</td>
                                                    <td style={{ padding: '11px 12px', color: '#aaa', fontSize: '12px' }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                                                    <td style={{ padding: '11px 12px', fontWeight: '800', color: '#1a1a1a' }}>{c.leadScore ?? '—'}</td>
                                                    <td style={{ padding: '11px 12px' }}>
                                                        {c.sentiment ? <span style={{ background: SENT_BG[c.sentiment], color: SENT_COLORS[c.sentiment], padding: '3px 9px', borderRadius: '50px', fontSize: '11px', fontWeight: '700' }}>{c.sentiment}</span> : '—'}
                                                    </td>
                                                    <td style={{ padding: '11px 12px' }}>
                                                        <span style={{ background: st.bg, color: st.color, padding: '3px 9px', borderRadius: '50px', fontSize: '11px', fontWeight: '700' }}>{st.label}</span>
                                                    </td>
                                                    <td style={{ padding: '11px 12px' }}>
                                                        <Link to={`/calls/${c._id}`} style={{ color: '#6366f1', fontWeight: '700', textDecoration: 'none' }}>View →</Link>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </>
                )}
            </div>
            <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        </AppLayout>
    );
}
