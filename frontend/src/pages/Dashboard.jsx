// // src/pages/Dashboard.jsx
// import React, { useEffect, useState } from 'react';
// import { Link } from 'react-router-dom';
// import {
//   Phone, TrendingUp, AlertCircle, Smile, Meh, Frown,
//   Clock, ChevronRight, RefreshCw, Target, Upload
// } from 'lucide-react';
// import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// import API from '../services/api';
// import Navbar from '../components/Layout/Navbar';

// const SENTIMENT_COLORS = { Positive: '#22c55e', Negative: '#ef4444', Neutral: '#f59e0b' };

// const Dashboard = () => {
//   const [calls, setCalls] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const fetchCalls = async () => {
//     try {
//       const res = await API.get('/calls');
//       setCalls(res.data.calls || []);
//     } catch (err) {
//       setError('Failed to load dashboard data.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => { fetchCalls(); }, []);

//   // ── Derived metrics ─────────────────────────────────
//   const totalCalls = calls.length;
//   const completedCalls = calls.filter(c => c.status === 'completed');
//   const pendingCalls = calls.filter(c => c.status === 'pending');

//   const avgLeadScore = completedCalls.length > 0
//     ? (completedCalls.reduce((sum, c) => sum + (c.leadScore || 0), 0) / completedCalls.length).toFixed(1)
//     : '—';

//   const sentimentCounts = { Positive: 0, Negative: 0, Neutral: 0 };
//   completedCalls.forEach(c => {
//     if (c.sentiment && sentimentCounts[c.sentiment] !== undefined) sentimentCounts[c.sentiment]++;
//   });
//   const positivePct = completedCalls.length > 0
//     ? Math.round((sentimentCounts.Positive / completedCalls.length) * 100)
//     : 0;

//   // Daily volume (last 7 days)
//   const dailyVolume = [];
//   for (let i = 6; i >= 0; i--) {
//     const d = new Date();
//     d.setDate(d.getDate() - i);
//     const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });
//     const dateStr = d.toISOString().split('T')[0];
//     const count = calls.filter(c => c.createdAt?.startsWith(dateStr)).length;
//     dailyVolume.push({ name: dayStr, calls: count });
//   }

//   const recentCalls = calls.slice(0, 5);

//   // Quality signals from completed calls
//   const avgComm = completedCalls.length > 0
//     ? Math.round(completedCalls.reduce((s, c) => s + (c.scores?.communication || 0), 0) / completedCalls.length * 10)
//     : 0;
//   const avgEng = completedCalls.length > 0
//     ? Math.round(completedCalls.reduce((s, c) => s + (c.scores?.engagement || 0), 0) / completedCalls.length * 10)
//     : 0;
//   const avgConf = completedCalls.length > 0
//     ? Math.round(completedCalls.reduce((s, c) => s + (c.scores?.confidence || 0), 0) / completedCalls.length * 10)
//     : 0;

//   const statusBadge = (status) => {
//     const map = {
//       pending: { bg: '#fffbeb', color: '#d97706' },
//       processing: { bg: '#eff6ff', color: '#2563eb' },
//       completed: { bg: '#f0fdf4', color: '#16a34a' },
//       failed: { bg: '#fef2f2', color: '#dc2626' },
//     };
//     const s = map[status] || map.pending;
//     return (
//       <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: '50px', fontSize: '11px', fontWeight: '700' }}>
//         {status}
//       </span>
//     );
//   };

//   return (
//     <div style={{ display: 'flex', minHeight: '100vh' }}>
//       <Navbar />
//       <div className="md:ml-[240px]" style={{ flex: 1, background: '#f8f7f4', minHeight: '100vh' }}>
//         {/* Top Bar */}
//         <div style={{ background: 'white', borderBottom: '1px solid #e8e3da', padding: '20px 40px', position: 'sticky', top: 0, zIndex: 10 }}>
//           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//             <div>
//               <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1a1a1a', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Call Quality Dashboard</h1>
//               <p style={{ fontSize: '13px', color: '#8a8480', margin: 0 }}>Real-time analytics & performance</p>
//             </div>
//             <Link to="/upload-audio" style={{
//               display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px',
//               borderRadius: '12px', background: '#111', color: 'white', fontWeight: '700',
//               fontSize: '13px', textDecoration: 'none',
//             }}>
//               <Upload size={14} /> Upload Audio
//             </Link>
//           </div>
//         </div>

//         {loading ? (
//           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
//             <div style={{ textAlign: 'center' }}>
//               <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', color: '#6366f1', marginBottom: '12px' }} />
//               <p style={{ color: '#6b6560', fontSize: '14px' }}>Loading dashboard...</p>
//             </div>
//           </div>
//         ) : error ? (
//           <div style={{ padding: '40px', textAlign: 'center', color: '#dc2626' }}>{error}</div>
//         ) : (
//           <div style={{ padding: '28px 40px', maxWidth: '1100px' }}>
//             {/* KPI Cards */}
//             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
//               {[
//                 { label: 'Calls Analysed', value: completedCalls.length, icon: Phone, color: '#6366f1', bg: '#eef2ff', change: `${totalCalls} total` },
//                 { label: 'Avg Lead Score', value: avgLeadScore, icon: Target, color: '#22c55e', bg: '#f0fdf4', change: 'out of 10' },
//                 { label: 'Positive Sentiment', value: `${positivePct}%`, icon: Smile, color: '#f59e0b', bg: '#fffbeb', change: `${sentimentCounts.Positive} calls` },
//                 { label: 'Pending Analysis', value: pendingCalls.length, icon: Clock, color: '#8b5cf6', bg: '#f5f3ff', change: 'in queue' },
//               ].map(card => (
//                 <div key={card.label} style={{
//                   background: 'white', borderRadius: '20px', border: '1px solid #e8e3da', padding: '22px',
//                   transition: 'box-shadow 0.2s',
//                 }}
//                   onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)'}
//                   onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
//                 >
//                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
//                     <div style={{
//                       width: '40px', height: '40px', borderRadius: '12px', background: card.bg,
//                       display: 'flex', alignItems: 'center', justifyContent: 'center',
//                     }}>
//                       <card.icon size={18} style={{ color: card.color }} />
//                     </div>
//                     <span style={{ fontSize: '11px', color: '#8a8480', background: '#f8f7f4', padding: '3px 8px', borderRadius: '6px' }}>
//                       {card.change}
//                     </span>
//                   </div>
//                   <div style={{ fontSize: '28px', fontWeight: '800', color: '#1a1a1a', letterSpacing: '-0.02em' }}>{card.value}</div>
//                   <div style={{ fontSize: '13px', color: '#8a8480', marginTop: '2px' }}>{card.label}</div>
//                 </div>
//               ))}
//             </div>

//             {/* Charts Row */}
//             <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '28px' }}>
//               {/* Quality Trends Chart */}
//               <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e8e3da', padding: '24px' }}>
//                 <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 4px' }}>Call Volume — Last 7 Days</h3>
//                 <p style={{ fontSize: '12px', color: '#8a8480', margin: '0 0 16px' }}>Daily uploads trend</p>
//                 <ResponsiveContainer width="100%" height={240}>
//                   <AreaChart data={dailyVolume}>
//                     <CartesianGrid strokeDasharray="3 3" stroke="#f0ece6" />
//                     <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#8a8480' }} />
//                     <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#8a8480' }} />
//                     <Tooltip />
//                     <Area type="monotone" dataKey="calls" stroke="#6366f1" fill="#eef2ff" strokeWidth={2} />
//                   </AreaChart>
//                 </ResponsiveContainer>
//               </div>

//               {/* Quality Signals */}
//               <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e8e3da', padding: '24px' }}>
//                 <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 4px' }}>Quality Signals</h3>
//                 <p style={{ fontSize: '12px', color: '#8a8480', margin: '0 0 20px' }}>Average scores from analysed calls</p>
//                 <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
//                   {[
//                     { label: 'Positive sentiment', value: `${positivePct}%`, pct: positivePct, good: positivePct >= 60 },
//                     { label: 'Communication', value: `${avgComm}%`, pct: avgComm, good: avgComm >= 60 },
//                     { label: 'Engagement', value: `${avgEng}%`, pct: avgEng, good: avgEng >= 60 },
//                     { label: 'Confidence', value: `${avgConf}%`, pct: avgConf, good: avgConf >= 60 },
//                   ].map(sig => (
//                     <div key={sig.label}>
//                       <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
//                         <span style={{ color: '#6b6560' }}>{sig.label}</span>
//                         <span style={{ fontWeight: '700', color: '#1a1a1a' }}>{sig.value}</span>
//                       </div>
//                       <div style={{ width: '100%', background: '#f0ece6', borderRadius: '50px', height: '6px' }}>
//                         <div style={{
//                           width: `${Math.min(sig.pct, 100)}%`, height: '6px', borderRadius: '50px',
//                           background: sig.good ? '#22c55e' : '#f59e0b',
//                           transition: 'width 0.5s ease',
//                         }} />
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>

//             {/* Recent Calls Table */}
//             <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e8e3da', padding: '24px' }}>
//               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
//                 <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a1a', margin: 0 }}>Recent Calls</h3>
//                 <Link to="/calls" style={{ fontSize: '13px', color: '#6366f1', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
//                   View all <ChevronRight size={14} />
//                 </Link>
//               </div>

//               {recentCalls.length > 0 ? (
//                 <table style={{ width: '100%', borderCollapse: 'collapse' }}>
//                   <thead>
//                     <tr style={{ borderBottom: '1px solid #f0ece6' }}>
//                       {['File Name', 'Lead Score', 'Sentiment', 'Status', 'Action'].map(h => (
//                         <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#b0aca8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</th>
//                       ))}
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {recentCalls.map((call, i) => (
//                       <tr key={call._id} style={{ borderBottom: i < recentCalls.length - 1 ? '1px solid #f8f7f4' : 'none' }}>
//                         <td style={{ padding: '14px 12px', fontSize: '13px', fontWeight: '600', color: '#1a1a1a', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
//                           {call.originalFileName}
//                         </td>
//                         <td style={{ padding: '14px 12px', fontSize: '14px', fontWeight: '800', color: '#1a1a1a' }}>{call.leadScore ?? '—'}</td>
//                         <td style={{ padding: '14px 12px' }}>
//                           {call.sentiment ? (
//                             <span style={{
//                               fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '50px',
//                               background: SENTIMENT_COLORS[call.sentiment] + '18',
//                               color: SENTIMENT_COLORS[call.sentiment],
//                             }}>
//                               {call.sentiment}
//                             </span>
//                           ) : '—'}
//                         </td>
//                         <td style={{ padding: '14px 12px' }}>{statusBadge(call.status)}</td>
//                         <td style={{ padding: '14px 12px' }}>
//                           <Link to={`/calls/${call._id}`} style={{ color: '#6366f1', fontSize: '13px', fontWeight: '700', textDecoration: 'none' }}>
//                             View →
//                           </Link>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               ) : (
//                 <div style={{ textAlign: 'center', padding: '48px 0', color: '#b0aca8' }}>
//                   <Phone size={28} style={{ marginBottom: '8px', opacity: 0.3 }} />
//                   <p style={{ fontSize: '13px' }}>No calls yet. Upload your first recording!</p>
//                 </div>
//               )}
//             </div>
//           </div>
//         )}

//         <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
//       </div>
//     </div>
//   );
// };

// export default Dashboard;

// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Phone, TrendingUp, AlertCircle, Smile, Meh, Frown,
  Clock, ChevronRight, RefreshCw, Target, Upload
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import API from '../services/api';
import Navbar from '../components/Layout/Navbar';

const SENTIMENT_COLORS = { Positive: '#22c55e', Negative: '#ef4444', Neutral: '#f59e0b' };

const Dashboard = () => {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCalls = async () => {
    try {
      const res = await API.get('/calls');
      setCalls(res.data.calls || []);
    } catch (err) {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCalls(); }, []);

  // ── Derived metrics ─────────────────────────────────
  const totalCalls = calls.length;
  const completedCalls = calls.filter(c => c.status === 'completed');
  const pendingCalls = calls.filter(c => c.status === 'pending');

  const avgLeadScore = completedCalls.length > 0
    ? (completedCalls.reduce((sum, c) => sum + (c.leadScore || 0), 0) / completedCalls.length).toFixed(1)
    : '—';

  const sentimentCounts = { Positive: 0, Negative: 0, Neutral: 0 };
  completedCalls.forEach(c => {
    if (c.sentiment && sentimentCounts[c.sentiment] !== undefined) sentimentCounts[c.sentiment]++;
  });
  const positivePct = completedCalls.length > 0
    ? Math.round((sentimentCounts.Positive / completedCalls.length) * 100)
    : 0;

  // Daily volume (last 7 days)
  const dailyVolume = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dateStr = d.toISOString().split('T')[0];
    const count = calls.filter(c => c.createdAt?.startsWith(dateStr)).length;
    dailyVolume.push({ name: dayStr, calls: count });
  }

  const recentCalls = calls.slice(0, 5);

  // Quality signals from completed calls
  const avgComm = completedCalls.length > 0
    ? Math.round(completedCalls.reduce((s, c) => s + (c.scores?.communication || 0), 0) / completedCalls.length * 10)
    : 0;
  const avgEng = completedCalls.length > 0
    ? Math.round(completedCalls.reduce((s, c) => s + (c.scores?.engagement || 0), 0) / completedCalls.length * 10)
    : 0;
  const avgConf = completedCalls.length > 0
    ? Math.round(completedCalls.reduce((s, c) => s + (c.scores?.confidence || 0), 0) / completedCalls.length * 10)
    : 0;

  const statusBadge = (status) => {
    const map = {
      pending: { bg: '#fffbeb', color: '#d97706' },
      processing: { bg: '#eff6ff', color: '#2563eb' },
      completed: { bg: '#f0fdf4', color: '#16a34a' },
      failed: { bg: '#fef2f2', color: '#dc2626' },
    };
    const s = map[status] || map.pending;
    return (
      <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: '50px', fontSize: '11px', fontWeight: '700' }}>
        {status}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Navbar />
      <div className="sidebar-content" style={{ flex: 1, background: '#f8f7f4', minHeight: '100vh' }}>
        {/* Top Bar */}
        <div style={{ background: 'white', borderBottom: '1px solid #e8e3da', padding: '20px 40px', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1a1a1a', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Call Quality Dashboard</h1>
              <p style={{ fontSize: '13px', color: '#8a8480', margin: 0 }}>Real-time analytics & performance</p>
            </div>
            <Link to="/upload-audio" style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px',
              borderRadius: '12px', background: '#111', color: 'white', fontWeight: '700',
              fontSize: '13px', textDecoration: 'none',
            }}>
              <Upload size={14} /> Upload Audio
            </Link>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <div style={{ textAlign: 'center' }}>
              <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', color: '#6366f1', marginBottom: '12px' }} />
              <p style={{ color: '#6b6560', fontSize: '14px' }}>Loading dashboard...</p>
            </div>
          </div>
        ) : error ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#dc2626' }}>{error}</div>
        ) : (
          <div style={{ padding: '28px 40px', maxWidth: '1100px' }}>
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
              {[
                { label: 'Calls Analysed', value: completedCalls.length, icon: Phone, color: '#6366f1', bg: '#eef2ff', change: `${totalCalls} total` },
                { label: 'Avg Lead Score', value: avgLeadScore, icon: Target, color: '#22c55e', bg: '#f0fdf4', change: 'out of 10' },
                { label: 'Positive Sentiment', value: `${positivePct}%`, icon: Smile, color: '#f59e0b', bg: '#fffbeb', change: `${sentimentCounts.Positive} calls` },
                { label: 'Pending Analysis', value: pendingCalls.length, icon: Clock, color: '#8b5cf6', bg: '#f5f3ff', change: 'in queue' },
              ].map(card => (
                <div key={card.label} style={{
                  background: 'white', borderRadius: '20px', border: '1px solid #e8e3da', padding: '22px',
                  transition: 'box-shadow 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '12px', background: card.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <card.icon size={18} style={{ color: card.color }} />
                    </div>
                    <span style={{ fontSize: '11px', color: '#8a8480', background: '#f8f7f4', padding: '3px 8px', borderRadius: '6px' }}>
                      {card.change}
                    </span>
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: '#1a1a1a', letterSpacing: '-0.02em' }}>{card.value}</div>
                  <div style={{ fontSize: '13px', color: '#8a8480', marginTop: '2px' }}>{card.label}</div>
                </div>
              ))}
            </div>

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '28px' }}>
              {/* Quality Trends Chart */}
              <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e8e3da', padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 4px' }}>Call Volume — Last 7 Days</h3>
                <p style={{ fontSize: '12px', color: '#8a8480', margin: '0 0 16px' }}>Daily uploads trend</p>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={dailyVolume}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0ece6" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#8a8480' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#8a8480' }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="calls" stroke="#6366f1" fill="#eef2ff" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Quality Signals */}
              <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e8e3da', padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 4px' }}>Quality Signals</h3>
                <p style={{ fontSize: '12px', color: '#8a8480', margin: '0 0 20px' }}>Average scores from analysed calls</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {[
                    { label: 'Positive sentiment', value: `${positivePct}%`, pct: positivePct, good: positivePct >= 60 },
                    { label: 'Communication', value: `${avgComm}%`, pct: avgComm, good: avgComm >= 60 },
                    { label: 'Engagement', value: `${avgEng}%`, pct: avgEng, good: avgEng >= 60 },
                    { label: 'Confidence', value: `${avgConf}%`, pct: avgConf, good: avgConf >= 60 },
                  ].map(sig => (
                    <div key={sig.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                        <span style={{ color: '#6b6560' }}>{sig.label}</span>
                        <span style={{ fontWeight: '700', color: '#1a1a1a' }}>{sig.value}</span>
                      </div>
                      <div style={{ width: '100%', background: '#f0ece6', borderRadius: '50px', height: '6px' }}>
                        <div style={{
                          width: `${Math.min(sig.pct, 100)}%`, height: '6px', borderRadius: '50px',
                          background: sig.good ? '#22c55e' : '#f59e0b',
                          transition: 'width 0.5s ease',
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Calls Table */}
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
                      {['File Name', 'Lead Score', 'Sentiment', 'Status', 'Action'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#b0aca8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentCalls.map((call, i) => (
                      <tr key={call._id} style={{ borderBottom: i < recentCalls.length - 1 ? '1px solid #f8f7f4' : 'none' }}>
                        <td style={{ padding: '14px 12px', fontSize: '13px', fontWeight: '600', color: '#1a1a1a', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {call.originalFileName}
                        </td>
                        <td style={{ padding: '14px 12px', fontSize: '14px', fontWeight: '800', color: '#1a1a1a' }}>{call.leadScore ?? '—'}</td>
                        <td style={{ padding: '14px 12px' }}>
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
                        <td style={{ padding: '14px 12px' }}>{statusBadge(call.status)}</td>
                        <td style={{ padding: '14px 12px' }}>
                          <Link to={`/calls/${call._id}`} style={{ color: '#6366f1', fontSize: '13px', fontWeight: '700', textDecoration: 'none' }}>
                            View →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#b0aca8' }}>
                  <Phone size={28} style={{ marginBottom: '8px', opacity: 0.3 }} />
                  <p style={{ fontSize: '13px' }}>No calls yet. Upload your first recording!</p>
                </div>
              )}
            </div>
          </div>
        )}

        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
};

export default Dashboard;