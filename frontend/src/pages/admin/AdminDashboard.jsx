// src/pages/admin/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import API from '../../services/api';
import {
  Users, Phone, TrendingUp, Calendar, BarChart3,
  ArrowUpRight, ArrowDownRight, Clock, UserCheck,
  Smile, Frown, Meh, AlertTriangle, Target,
  ChevronRight, RefreshCw
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area
} from 'recharts';

// ── Colour palette ────────────────────────────────────────
const SENTIMENT_COLORS = { Positive: '#22c55e', Negative: '#ef4444', Neutral: '#f59e0b' };
const SCORE_COLORS = ['#ef4444', '#ef4444', '#f59e0b', '#f59e0b', '#f59e0b', '#22c55e', '#22c55e', '#22c55e', '#16a34a', '#16a34a'];

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userStats, setUserStats] = useState({ total: 0, approved: 0, pending: 0 });
  const [calls, setCalls] = useState([]);
  const [analysisStats, setAnalysisStats] = useState(null);

  const fetchAll = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [usersRes, callsRes, analysisRes] = await Promise.all([
        API.get('/auth/users'),
        API.get('/calls'),
        API.get('/analysis/dashboard/stats').catch(() => ({ data: null })),
      ]);

      const users = usersRes.data.users || [];
      setUserStats({
        total: users.length,
        approved: users.filter(u => u.isApproved).length,
        pending: users.filter(u => !u.isApproved).length,
      });

      const allCalls = callsRes.data.calls || [];
      setCalls(allCalls);

      setAnalysisStats(analysisRes.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // ── Derived metrics ─────────────────────────────────────
  const totalCalls = calls.length;
  const completedCalls = calls.filter(c => c.status === 'completed');
  const pendingCalls = calls.filter(c => c.status === 'pending');
  const failedCalls = calls.filter(c => c.status === 'failed');

  // Calls this week
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const callsThisWeek = calls.filter(c => new Date(c.createdAt) >= weekAgo).length;

  // Average lead score (from completed calls)
  const avgLeadScore = completedCalls.length > 0
    ? (completedCalls.reduce((sum, c) => sum + (c.leadScore || 0), 0) / completedCalls.length).toFixed(1)
    : '—';

  // Sentiment counts (from completed calls)
  const sentimentCounts = { Positive: 0, Negative: 0, Neutral: 0 };
  completedCalls.forEach(c => {
    if (c.sentiment && sentimentCounts[c.sentiment] !== undefined) {
      sentimentCounts[c.sentiment]++;
    }
  });
  const sentimentData = Object.entries(sentimentCounts)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  const positivePct = completedCalls.length > 0
    ? Math.round((sentimentCounts.Positive / completedCalls.length) * 100)
    : 0;

  // Top 5 counsellors by avg lead score
  const counsellorMap = {};
  completedCalls.forEach(c => {
    const name = c.uploadedBy?.fullName || 'Unknown';
    if (!counsellorMap[name]) counsellorMap[name] = { totalScore: 0, count: 0, positive: 0 };
    counsellorMap[name].totalScore += (c.leadScore || 0);
    counsellorMap[name].count++;
    if (c.sentiment === 'Positive') counsellorMap[name].positive++;
  });
  const topCounsellors = Object.entries(counsellorMap)
    .map(([name, d]) => ({
      name,
      calls: d.count,
      avgScore: (d.totalScore / d.count).toFixed(1),
      positivePct: Math.round((d.positive / d.count) * 100),
    }))
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 5);

  // Lead score distribution
  const scoreDistribution = Array.from({ length: 10 }, (_, i) => ({
    score: `${i + 1}`,
    count: completedCalls.filter(c => c.leadScore === i + 1).length,
  }));

  // Daily call volume (last 7 days)
  const dailyVolume = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dateStr = d.toISOString().split('T')[0];
    const count = calls.filter(c => c.createdAt?.startsWith(dateStr)).length;
    dailyVolume.push({ name: dayStr, calls: count });
  }

  // Recent 5 calls
  const recentCalls = calls.slice(0, 5);

  // ── KPI Cards data ──────────────────────────────────────
  const kpiCards = [
    {
      label: 'Total Calls', value: totalCalls, icon: Phone,
      color: '#6366f1', bg: '#eef2ff',
      sub: `${completedCalls.length} analysed`,
    },
    {
      label: 'Total Users', value: userStats.total, icon: Users,
      color: '#8b5cf6', bg: '#f5f3ff',
      sub: `${userStats.pending} pending approval`,
    },
    {
      label: 'Avg Lead Score', value: avgLeadScore, icon: Target,
      color: '#22c55e', bg: '#f0fdf4',
      sub: `from ${completedCalls.length} calls`,
    },
    {
      label: 'Calls This Week', value: callsThisWeek, icon: Calendar,
      color: '#f59e0b', bg: '#fffbeb',
      sub: `${pendingCalls.length} pending`,
    },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
          <div style={{ textAlign: 'center' }}>
            <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', color: '#6366f1', marginBottom: '12px' }} />
            <p style={{ color: '#6b6560', fontSize: '14px' }}>Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div style={{ padding: '32px 40px', maxWidth: '1200px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1a1a1a', letterSpacing: '-0.02em', margin: '0 0 6px' }}>
              Admin Dashboard
            </h1>
            <p style={{ fontSize: '14px', color: '#6b6560', margin: 0 }}>
              Platform overview — calls, users, and AI analysis metrics.
            </p>
          </div>
          <button
            onClick={() => fetchAll(true)}
            disabled={refreshing}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px',
              borderRadius: '12px', background: '#111', color: 'white', border: 'none',
              cursor: 'pointer', fontSize: '13px', fontWeight: '700', opacity: refreshing ? 0.6 : 1,
            }}
          >
            <RefreshCw size={14} style={refreshing ? { animation: 'spin 1s linear infinite' } : {}} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* ── KPI Cards ────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
          {kpiCards.map(card => (
            <div key={card.label} style={{
              background: 'white', borderRadius: '20px', border: '1px solid #e8e3da',
              padding: '24px', display: 'flex', alignItems: 'center', gap: '18px',
              transition: 'box-shadow 0.2s', cursor: 'default',
            }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
            >
              <div style={{
                width: '52px', height: '52px', borderRadius: '14px', background: card.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <card.icon size={22} style={{ color: card.color }} />
              </div>
              <div>
                <div style={{ fontSize: '30px', fontWeight: '800', color: '#1a1a1a', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {card.value}
                </div>
                <div style={{ fontSize: '13px', color: '#8a8480', marginTop: '4px', fontWeight: '500' }}>{card.label}</div>
                <div style={{ fontSize: '11px', color: '#b0aca8', marginTop: '2px' }}>{card.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Row 2: Sentiment Pie + Lead Score Distribution ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginBottom: '28px' }}>
          {/* Sentiment Distribution */}
          <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e8e3da', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 4px' }}>Sentiment Distribution</h3>
            <p style={{ fontSize: '12px', color: '#8a8480', margin: '0 0 16px' }}>From {completedCalls.length} analysed calls</p>

            {sentimentData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={sentimentData}
                      cx="50%" cy="50%"
                      innerRadius={50} outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {sentimentData.map((entry) => (
                        <Cell key={entry.name} fill={SENTIMENT_COLORS[entry.name]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} calls`, name]} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '8px' }}>
                  {sentimentData.map(s => (
                    <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6b6560' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: SENTIMENT_COLORS[s.name] }} />
                      {s.name} ({s.value})
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#b0aca8', fontSize: '13px' }}>
                <Meh size={28} style={{ marginBottom: '8px', opacity: 0.4 }} />
                <p>No analysed calls yet</p>
              </div>
            )}
          </div>

          {/* Lead Score Distribution */}
          <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e8e3da', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 4px' }}>Lead Score Distribution</h3>
            <p style={{ fontSize: '12px', color: '#8a8480', margin: '0 0 16px' }}>Score frequency across all analysed calls</p>

            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ece6" />
                <XAxis dataKey="score" tick={{ fontSize: 12, fill: '#8a8480' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#8a8480' }} />
                <Tooltip formatter={(val) => [`${val} calls`, 'Count']} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {scoreDistribution.map((entry, i) => (
                    <Cell key={i} fill={SCORE_COLORS[i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Row 3: Daily Volume + Top Counsellors ──────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '28px' }}>
          {/* Daily Call Volume */}
          <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e8e3da', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 4px' }}>Call Volume — Last 7 Days</h3>
            <p style={{ fontSize: '12px', color: '#8a8480', margin: '0 0 16px' }}>Daily uploads</p>

            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={dailyVolume}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ece6" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#8a8480' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#8a8480' }} />
                <Tooltip />
                <Area type="monotone" dataKey="calls" stroke="#6366f1" fill="#eef2ff" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Top 5 Counsellors */}
          <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e8e3da', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 4px' }}>Top Counsellors</h3>
            <p style={{ fontSize: '12px', color: '#8a8480', margin: '0 0 16px' }}>By avg lead score</p>

            {topCounsellors.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {topCounsellors.map((c, i) => (
                  <div key={c.name} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 12px', borderRadius: '12px',
                    background: i === 0 ? '#fefce8' : '#fafaf9',
                  }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      background: i === 0 ? '#facc15' : '#e7e5e4',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', fontWeight: '800', color: i === 0 ? '#713f12' : '#78716c',
                    }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#8a8480' }}>
                        {c.calls} calls · {c.positivePct}% positive
                      </div>
                    </div>
                    <div style={{
                      fontSize: '16px', fontWeight: '800', color: parseFloat(c.avgScore) >= 7 ? '#16a34a' : parseFloat(c.avgScore) >= 4 ? '#d97706' : '#dc2626',
                    }}>
                      {c.avgScore}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px 0', color: '#b0aca8', fontSize: '13px' }}>
                <Users size={24} style={{ marginBottom: '8px', opacity: 0.4 }} />
                <p>No counsellor data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Row 4: Recent Calls Table + Quick Stats ───── */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
          {/* Recent Calls */}
          <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e8e3da', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a1a', margin: 0 }}>Recent Calls</h3>
              <Link to="/calls" style={{ fontSize: '13px', color: '#6366f1', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                View all <ChevronRight size={14} />
              </Link>
            </div>

            {recentCalls.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #f0ece6' }}>
                    {['File', 'Uploaded By', 'Lead Score', 'Sentiment', 'Status'].map(h => (
                      <th key={h} style={{
                        padding: '10px 12px', textAlign: 'left', fontSize: '11px',
                        fontWeight: '700', color: '#b0aca8', letterSpacing: '0.06em', textTransform: 'uppercase',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentCalls.map((call, i) => {
                    const statusStyles = {
                      pending: { bg: '#fffbeb', color: '#d97706' },
                      processing: { bg: '#eff6ff', color: '#2563eb' },
                      completed: { bg: '#f0fdf4', color: '#16a34a' },
                      failed: { bg: '#fef2f2', color: '#dc2626' },
                    };
                    const s = statusStyles[call.status] || statusStyles.pending;

                    return (
                      <tr key={call._id} style={{ borderBottom: i < recentCalls.length - 1 ? '1px solid #f8f7f4' : 'none' }}>
                        <td style={{ padding: '12px', fontSize: '13px', fontWeight: '600', color: '#1a1a1a', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <Link to={`/calls/${call._id}`} style={{ color: '#1a1a1a', textDecoration: 'none' }}>
                            {call.originalFileName}
                          </Link>
                        </td>
                        <td style={{ padding: '12px', fontSize: '12px', color: '#6b6560' }}>{call.uploadedBy?.fullName || '—'}</td>
                        <td style={{ padding: '12px', fontSize: '14px', fontWeight: '800', color: '#1a1a1a' }}>{call.leadScore ?? '—'}</td>
                        <td style={{ padding: '12px' }}>
                          {call.sentiment ? (
                            <span style={{
                              fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '50px',
                              background: SENTIMENT_COLORS[call.sentiment] + '18',
                              color: SENTIMENT_COLORS[call.sentiment],
                            }}>
                              {call.sentiment}
                            </span>
                          ) : '—'}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '50px',
                            background: s.bg, color: s.color,
                          }}>
                            {call.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#b0aca8', fontSize: '13px' }}>
                No calls uploaded yet.
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Processing Status */}
            <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e8e3da', padding: '24px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 16px' }}>Processing Status</h3>
              {[
                { label: 'Completed', count: completedCalls.length, color: '#22c55e', icon: '✅' },
                { label: 'Pending', count: pendingCalls.length, color: '#f59e0b', icon: '⏳' },
                { label: 'Failed', count: failedCalls.length, color: '#ef4444', icon: '❌' },
              ].map(item => (
                <div key={item.label} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 0', borderBottom: '1px solid #f8f7f4',
                }}>
                  <span style={{ fontSize: '13px', color: '#6b6560' }}>{item.icon} {item.label}</span>
                  <span style={{ fontSize: '16px', fontWeight: '800', color: item.color }}>{item.count}</span>
                </div>
              ))}
            </div>

            {/* Positive Rate Card */}
            <div style={{
              background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', borderRadius: '20px',
              border: '1px solid #bbf7d0', padding: '24px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Smile size={18} style={{ color: '#16a34a' }} />
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#166534' }}>Positive Rate</span>
              </div>
              <div style={{ fontSize: '36px', fontWeight: '800', color: '#166534', lineHeight: 1 }}>
                {positivePct}%
              </div>
              <div style={{ fontSize: '11px', color: '#4ade80', marginTop: '4px' }}>
                {sentimentCounts.Positive} of {completedCalls.length} calls
              </div>
            </div>

            {/* Pending Approvals */}
            {userStats.pending > 0 && (
              <div style={{
                background: '#fffbeb', borderRadius: '20px',
                border: '1px solid #fde68a', padding: '24px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <AlertTriangle size={16} style={{ color: '#d97706' }} />
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#92400e' }}>Pending Approvals</span>
                </div>
                <p style={{ fontSize: '13px', color: '#92400e', margin: '0 0 12px' }}>
                  {userStats.pending} user(s) waiting for approval
                </p>
                <Link to="/admin/users" style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '8px 16px', borderRadius: '10px', background: '#111',
                  color: 'white', fontWeight: '700', fontSize: '12px', textDecoration: 'none',
                }}>
                  <UserCheck size={13} /> Manage Users <ChevronRight size={12} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Spin animation for loading */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </AdminLayout>
  );
}