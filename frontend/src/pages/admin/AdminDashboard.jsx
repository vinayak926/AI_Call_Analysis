// src/pages/admin/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../../components/Layout/AppLayout';
import API from '../../services/api';
import {
  LayoutDashboard, Users, Phone, Mic, BarChart2, FileText,
  TrendingUp, Clock, UserCheck, Smile, RefreshCw, Target,
  ChevronRight, AlertTriangle,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import NotificationBell from '../../components/NotificationBell';

const ADMIN_NAV = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/admin/calls', label: 'All Calls', icon: Phone },
  { path: '/admin/recordings', label: 'Recordings', icon: Mic },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/reports', label: 'Reports', icon: FileText },
];

const SENT_COLORS = { Positive: '#22c55e', Negative: '#ef4444', Neutral: '#f59e0b' };

const KPICard = ({ label, value, sub, icon: Icon, color, bg }) => (
  <div style={{
    background: 'white', borderRadius: '20px', border: '1px solid #e8e3da',
    padding: '22px', transition: 'box-shadow 0.2s',
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '14px' }}>
      <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} style={{ color }} />
      </div>
      <span style={{ fontSize: '11px', color: '#aaa', background: '#f8f7f4', padding: '3px 8px', borderRadius: '6px' }}>{sub}</span>
    </div>
    <div style={{ fontSize: '30px', fontWeight: '800', color: '#1a1a1a', letterSpacing: '-0.02em' }}>{value}</div>
    <div style={{ fontSize: '13px', color: '#8a8480', marginTop: '2px' }}>{label}</div>
  </div>
);

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [calls, setCalls] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [callsRes, usersRes] = await Promise.all([
        API.get('/calls'),
        API.get('/auth/users'),
      ]);
      setCalls(callsRes.data.calls || []);
      setUsers(usersRes.data.users || []);
    } catch (e) { setError('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  // ── Derived stats ─────────────────────────────────────────────
  const completed = calls.filter(c => c.status === 'completed');
  const pending = calls.filter(c => c.status === 'pending');
  const failed = calls.filter(c => c.status === 'failed');

  const avgLead = completed.length
    ? (completed.reduce((s, c) => s + (c.leadScore || 0), 0) / completed.length).toFixed(1)
    : '—';

  const sentCounts = { Positive: 0, Negative: 0, Neutral: 0 };
  completed.forEach(c => { if (c.sentiment && sentCounts[c.sentiment] !== undefined) sentCounts[c.sentiment]++; });
  const sentPie = Object.entries(sentCounts).map(([name, value]) => ({ name, value }));

  // Daily volume last 14 days
  const dailyVol = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (13 - i));
    const ds = d.toISOString().split('T')[0];
    return {
      name: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      calls: calls.filter(c => c.createdAt?.startsWith(ds)).length,
      analysed: calls.filter(c => c.createdAt?.startsWith(ds) && c.status === 'completed').length,
    };
  });

  // Lead score distribution
  const scoreBuckets = [
    { name: '1-3', count: completed.filter(c => c.leadScore >= 1 && c.leadScore <= 3).length },
    { name: '4-5', count: completed.filter(c => c.leadScore >= 4 && c.leadScore <= 5).length },
    { name: '6-7', count: completed.filter(c => c.leadScore >= 6 && c.leadScore <= 7).length },
    { name: '8-10', count: completed.filter(c => c.leadScore >= 8 && c.leadScore <= 10).length },
  ];

  // Top counsellors
  const counsellorMap = {};
  calls.forEach(c => {
    const name = c.uploadedBy?.fullName || 'Unknown';
    if (!counsellorMap[name]) counsellorMap[name] = { name, total: 0, completed: 0, avgScore: [] };
    counsellorMap[name].total++;
    if (c.status === 'completed') {
      counsellorMap[name].completed++;
      if (c.leadScore) counsellorMap[name].avgScore.push(c.leadScore);
    }
  });
  const topCounsellors = Object.values(counsellorMap)
    .map(c => ({ ...c, avg: c.avgScore.length ? (c.avgScore.reduce((a, b) => a + b, 0) / c.avgScore.length).toFixed(1) : '—' }))
    .sort((a, b) => b.completed - a.completed)
    .slice(0, 5);

  const statusBadge = (status) => {
    const map = { pending: ['#fffbeb', '#d97706'], processing: ['#eff6ff', '#2563eb'], completed: ['#f0fdf4', '#16a34a'], failed: ['#fef2f2', '#dc2626'] };
    const [bg, color] = map[status] || map.pending;
    return <span style={{ background: bg, color, padding: '3px 10px', borderRadius: '50px', fontSize: '11px', fontWeight: '700' }}>{status}</span>;
  };

  return (
    <AppLayout navItems={ADMIN_NAV} panelLabel="Admin Panel">
      <div style={{ padding: '32px 40px', maxWidth: '1200px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#1a1a1a', letterSpacing: '-0.02em', margin: '0 0 4px' }}>Admin Dashboard</h1>
            <p style={{ color: '#8a8480', fontSize: '14px', margin: 0 }}>System-wide analytics & performance</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <NotificationBell />
            <button onClick={fetchAll} disabled={loading} style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px',
              background: 'white', border: '1px solid #e8e3da', borderRadius: '12px',
              cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#6b6560', fontFamily: 'inherit',
            }}>
              <RefreshCw size={14} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', color: '#6366f1' }} />
          </div>
        ) : error ? (
          <div style={{ color: '#dc2626', padding: '20px' }}>{error}</div>
        ) : (
          <>
            {/* KPI Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '16px', marginBottom: '28px' }}>
              <KPICard label="Total Calls" value={calls.length} sub="all time" icon={Phone} color="#6366f1" bg="#eef2ff" />
              <KPICard label="Analysed" value={completed.length} sub={`${calls.length ? Math.round(completed.length / calls.length * 100) : 0}%`} icon={TrendingUp} color="#22c55e" bg="#f0fdf4" />
              <KPICard label="Avg Lead Score" value={avgLead} sub="out of 10" icon={Target} color="#f59e0b" bg="#fffbeb" />
              <KPICard label="Pending" value={pending.length} sub="in queue" icon={Clock} color="#8b5cf6" bg="#f5f3ff" />
              <KPICard label="Total Users" value={users.length} sub={`${users.filter(u => u.isApproved).length} approved`} icon={Users} color="#06b6d4" bg="#ecfeff" />
              <KPICard label="Failed" value={failed.length} sub="need attention" icon={AlertTriangle} color="#dc2626" bg="#fef2f2" />
            </div>

            {/* Charts Row 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>
              {/* Volume chart */}
              <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e8e3da', padding: '24px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 4px' }}>Call Volume — Last 14 Days</h3>
                <p style={{ fontSize: '12px', color: '#8a8480', margin: '0 0 16px' }}>Uploads vs Analysed</p>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={dailyVol}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0ece6" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#8a8480' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#8a8480' }} />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="calls" name="Uploaded" stroke="#6366f1" fill="#eef2ff" strokeWidth={2} />
                    <Area type="monotone" dataKey="analysed" name="Analysed" stroke="#22c55e" fill="#f0fdf4" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Sentiment pie */}
              <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e8e3da', padding: '24px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 4px' }}>Sentiment Split</h3>
                <p style={{ fontSize: '12px', color: '#8a8480', margin: '0 0 8px' }}>From analysed calls</p>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={sentPie} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {sentPie.map((entry) => (
                        <Cell key={entry.name} fill={SENT_COLORS[entry.name] || '#ccc'} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Charts Row 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              {/* Lead score distribution */}
              <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e8e3da', padding: '24px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 16px' }}>Lead Score Distribution</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={scoreBuckets}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0ece6" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#8a8480' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#8a8480' }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Calls" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Top counsellors */}
              <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e8e3da', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a1a', margin: 0 }}>Top Counsellors</h3>
                  <Link to="/admin/users" style={{ fontSize: '12px', color: '#6366f1', fontWeight: '600', textDecoration: 'none' }}>Manage →</Link>
                </div>
                {topCounsellors.length === 0 ? (
                  <p style={{ color: '#aaa', fontSize: '13px' }}>No data yet</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {topCounsellors.map((c, i) => (
                      <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: i === 0 ? '#fbbf24' : '#e8e3da', color: i === 0 ? '#92400e' : '#888', fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: '700', fontSize: '13px', color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                          <div style={{ fontSize: '11px', color: '#aaa' }}>{c.completed} analysed · {c.total} total</div>
                        </div>
                        <span style={{ fontWeight: '800', fontSize: '14px', color: '#6366f1', flexShrink: 0 }}>{c.avg}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent calls */}
            <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e8e3da', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a1a', margin: 0 }}>Recent Calls</h3>
                <Link to="/admin/calls" style={{ fontSize: '12px', color: '#6366f1', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  View all <ChevronRight size={13} />
                </Link>
              </div>
              {calls.slice(0, 6).length === 0 ? (
                <p style={{ color: '#aaa', fontSize: '13px', textAlign: 'center', padding: '24px' }}>No calls yet</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #f0ece6' }}>
                      {['File', 'Counsellor', 'Lead Score', 'Sentiment', 'Status', ''].map(h => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {calls.slice(0, 6).map((call, i) => (
                      <tr key={call._id} style={{ borderBottom: i < 5 ? '1px solid #f8f7f4' : 'none' }}>
                        <td style={{ padding: '13px 12px', fontWeight: '600', color: '#1a1a1a', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{call.originalFileName}</td>
                        <td style={{ padding: '13px 12px', color: '#6b6560' }}>{call.uploadedBy?.fullName || '—'}</td>
                        <td style={{ padding: '13px 12px', fontWeight: '800', color: '#1a1a1a' }}>{call.leadScore ?? '—'}</td>
                        <td style={{ padding: '13px 12px' }}>
                          {call.sentiment ? <span style={{ background: SENT_COLORS[call.sentiment] + '20', color: SENT_COLORS[call.sentiment], padding: '3px 10px', borderRadius: '50px', fontSize: '11px', fontWeight: '700' }}>{call.sentiment}</span> : '—'}
                        </td>
                        <td style={{ padding: '13px 12px' }}>{statusBadge(call.status)}</td>
                        <td style={{ padding: '13px 12px' }}>
                          <Link to={`/calls/${call._id}`} style={{ color: '#6366f1', fontWeight: '700', textDecoration: 'none' }}>View →</Link>
                        </td>
                      </tr>
                    ))}
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
