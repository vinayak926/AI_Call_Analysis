// src/pages/admin/AdminReportsPage.jsx
import React, { useEffect, useState } from 'react';
import AppLayout from '../../components/Layout/AppLayout';
import API from '../../services/api';
import {
    LayoutDashboard, Users, Phone, Mic, FileText,
    Download, RefreshCw, Filter, FileSpreadsheet,
    BarChart2, Calendar, User,
} from 'lucide-react';
import NotificationBell from '../../components/NotificationBell';

const ADMIN_NAV = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/admin/calls', label: 'All Calls', icon: Phone },
    { path: '/admin/recordings', label: 'Recordings', icon: Mic },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/reports', label: 'Reports', icon: FileText },
];

// ── Pure-JS PDF generator (no external lib needed) ────────────────
function generatePDF(calls, title, counsellorName) {
    // Build HTML string → open in new tab → browser print to PDF
    const rows = calls.map(c => `
    <tr>
      <td>${c.originalFileName || ''}</td>
      <td>${c.uploadedBy?.fullName || '—'}</td>
      <td>${new Date(c.createdAt).toLocaleDateString()}</td>
      <td>${c.durationSeconds ? `${Math.floor(c.durationSeconds / 60)}m ${c.durationSeconds % 60}s` : '—'}</td>
      <td>${c.leadScore ?? '—'}</td>
      <td>${c.sentiment || '—'}</td>
      <td>${c.status || ''}</td>
      <td>${c.studentName || '—'}</td>
      <td>${c.courseInterested || '—'}</td>
      <td>${c.callSummary ? c.callSummary.slice(0, 80) + '…' : '—'}</td>
    </tr>`).join('');

    const html = `<!DOCTYPE html><html><head><title>${title}</title>
  <style>
    body{font-family:Arial,sans-serif;font-size:11px;margin:24px;color:#1a1a1a}
    h1{font-size:18px;margin-bottom:4px}
    p{color:#666;margin:0 0 16px;font-size:12px}
    table{width:100%;border-collapse:collapse}
    th{background:#111;color:white;padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.05em}
    td{padding:7px 10px;border-bottom:1px solid #f0ece6}
    tr:nth-child(even) td{background:#fafaf8}
  </style></head><body>
  <h1>${title}</h1>
  <p>Generated: ${new Date().toLocaleString()}${counsellorName ? ` · Counsellor: ${counsellorName}` : ' · All Counsellors'} · ${calls.length} records</p>
  <table>
    <thead><tr>
      <th>File</th><th>Counsellor</th><th>Date</th><th>Duration</th>
      <th>Lead Score</th><th>Sentiment</th><th>Status</th>
      <th>Student</th><th>Course</th><th>Summary</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <script>window.onload=()=>window.print()</script>
  </body></html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
}

// ── CSV/Excel generator ───────────────────────────────────────────
function generateCSV(calls, filename) {
    const headers = ['File', 'Counsellor', 'Date', 'Duration (s)', 'Lead Score', 'Sentiment', 'Status', 'Student', 'Course Interest', 'City', 'Follow-up Date', 'Summary'];
    const rows = calls.map(c => [
        `"${c.originalFileName || ''}"`,
        `"${c.uploadedBy?.fullName || ''}"`,
        new Date(c.createdAt).toLocaleDateString(),
        c.durationSeconds || '',
        c.leadScore ?? '',
        c.sentiment || '',
        c.status || '',
        `"${c.studentName || ''}"`,
        `"${c.courseInterested || ''}"`,
        `"${c.City || ''}"`,
        c.followUpDate || '',
        `"${(c.callSummary || '').replace(/"/g, "'")}"`,
    ].join(','));

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
}

// ── Score summary helper ──────────────────────────────────────────
function scoreSummary(calls) {
    const done = calls.filter(c => c.status === 'completed');
    if (!done.length) return null;
    const avg = (arr) => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : '—';
    return {
        total: calls.length,
        analysed: done.length,
        avgLead: avg(done.map(c => c.leadScore).filter(Boolean)),
        positive: done.filter(c => c.sentiment === 'Positive').length,
        negative: done.filter(c => c.sentiment === 'Negative').length,
        neutral: done.filter(c => c.sentiment === 'Neutral').length,
        avgConf: avg(done.map(c => c.counsellorConfidenceScore).filter(Boolean)),
        avgComm: avg(done.map(c => c.communicationScore).filter(Boolean)),
    };
}

export default function AdminReportsPage() {
    const [calls, setCalls] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [counsellor, setCounsellor] = useState('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [generating, setGenerating] = useState(false);
    const [sheetsExporting, setSheetsExporting] = useState(false);
    const [sheetsMsg, setSheetsMsg] = useState(null);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [cRes, uRes] = await Promise.all([API.get('/calls'), API.get('/auth/users')]);
            setCalls(cRes.data.calls || []);
            setUsers(uRes.data.users || []);
        } catch { } finally { setLoading(false); }
    };

    useEffect(() => { fetchAll(); }, []);

    const counsellors = [...new Set(calls.map(c => c.uploadedBy?.fullName).filter(Boolean))];

    // Apply current filters
    const filteredCalls = calls.filter(c => {
        const matchC = counsellor === 'all' || c.uploadedBy?.fullName === counsellor;
        const date = new Date(c.createdAt);
        const matchFrom = !dateFrom || date >= new Date(dateFrom);
        const matchTo = !dateTo || date <= new Date(dateTo + 'T23:59:59');
        return matchC && matchFrom && matchTo;
    });

    const summary = scoreSummary(filteredCalls);
    const counsellorLabel = counsellor === 'all' ? 'All Counsellors' : counsellor;
    const filenameSuffix = `${counsellor === 'all' ? 'all' : counsellor.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`;

    const handlePDF = () => {
        setGenerating(true);
        setTimeout(() => {
            generatePDF(filteredCalls, `CallIntel Report — ${counsellorLabel}`, counsellor === 'all' ? '' : counsellor);
            setGenerating(false);
        }, 100);
    };
    const handleExcel = () => {
        setGenerating(true);
        setTimeout(() => {
            generateCSV(filteredCalls, `callintel_report_${filenameSuffix}.csv`);
            setGenerating(false);
        }, 100);
    };

    const handleMasterExcel = async () => {
        setGenerating(true);
        try {
            const res = await API.get('/analysis/report/download-excel', {
                responseType: 'blob',
            });
            const url = URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = `sales_call_report_${new Date().toISOString().slice(0, 10)}.xlsx`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            alert('No Excel report found yet. Analyse at least one call first.');
        } finally {
            setGenerating(false);
        }
    };

    const exportToGoogleSheets = async () => {
        setSheetsExporting(true);
        setSheetsMsg(null);
        try {
            const res = await API.post('/analysis/export/google-sheets');
            setSheetsMsg(`✅ ${res.data.exported} records exported to Google Sheets!`);
        } catch (err) {
            setSheetsMsg(`❌ ${err.response?.data?.message || 'Export failed'}`);
        } finally {
            setSheetsExporting(false);
            setTimeout(() => setSheetsMsg(null), 5000);
        }
    };

    const SummaryCard = ({ label, value, color }) => (
        <div style={{ background: 'white', border: '1px solid #e8e3da', borderRadius: '14px', padding: '18px 22px', textAlign: 'center' }}>
            <div style={{ fontSize: '26px', fontWeight: '800', color: color || '#1a1a1a', letterSpacing: '-0.02em' }}>{value ?? '—'}</div>
            <div style={{ fontSize: '12px', color: '#8a8480', marginTop: '4px' }}>{label}</div>
        </div>
    );

    return (
        <AppLayout navItems={ADMIN_NAV} panelLabel="Admin Panel">
            <div style={{ padding: '32px 40px', maxWidth: '1100px' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1a1a1a', letterSpacing: '-0.02em', margin: '0 0 4px' }}>Reports</h1>
                        <p style={{ color: '#8a8480', fontSize: '14px', margin: 0 }}>Download full or per-counsellor reports in PDF & Excel</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <NotificationBell />
                        <button onClick={fetchAll} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', background: 'white', border: '1px solid #e8e3da', borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#6b6560', fontFamily: 'inherit' }}>
                            <RefreshCw size={14} style={loading ? { animation: 'spin 1s linear infinite' } : {}} /> Refresh
                        </button>
                    </div>
                </div>

                {/* Filter Panel */}
                <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e8e3da', padding: '24px', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Filter size={16} /> Filter Report
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: '16px', alignItems: 'end' }}>
                        {/* Counsellor */}
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#6b6560', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                <User size={12} style={{ display: 'inline', marginRight: '4px' }} />Counsellor
                            </label>
                            <select value={counsellor} onChange={e => setCounsellor(e.target.value)}
                                style={{ width: '100%', padding: '10px 14px', border: '1px solid #e8e3da', borderRadius: '10px', fontSize: '13px', fontFamily: 'inherit', outline: 'none' }}>
                                <option value="all">All Counsellors</option>
                                {counsellors.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        {/* Date From */}
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#6b6560', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />From Date
                            </label>
                            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                                style={{ width: '100%', padding: '10px 14px', border: '1px solid #e8e3da', borderRadius: '10px', fontSize: '13px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                        {/* Date To */}
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#6b6560', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />To Date
                            </label>
                            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                                style={{ width: '100%', padding: '10px 14px', border: '1px solid #e8e3da', borderRadius: '10px', fontSize: '13px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                        {/* Reset */}
                        <button onClick={() => { setCounsellor('all'); setDateFrom(''); setDateTo(''); }}
                            style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid #e8e3da', background: '#f8f7f4', color: '#6b6560', fontWeight: '600', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
                            Reset Filters
                        </button>
                    </div>
                </div>

                {/* Summary Stats */}
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                        <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', color: '#6366f1' }} />
                    </div>
                ) : (
                    <>
                        <div style={{ marginBottom: '20px' }}>
                            <p style={{ fontSize: '13px', color: '#8a8480', margin: '0 0 12px' }}>
                                Showing <strong style={{ color: '#1a1a1a' }}>{filteredCalls.length}</strong> calls for <strong style={{ color: '#1a1a1a' }}>{counsellorLabel}</strong>
                                {(dateFrom || dateTo) && ` · ${dateFrom || '…'} → ${dateTo || '…'}`}
                            </p>
                            {summary && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: '12px', marginBottom: '20px' }}>
                                    <SummaryCard label="Total Calls" value={summary.total} />
                                    <SummaryCard label="Analysed" value={summary.analysed} color="#22c55e" />
                                    <SummaryCard label="Avg Lead Score" value={summary.avgLead} color="#6366f1" />
                                    <SummaryCard label="Positive" value={summary.positive} color="#22c55e" />
                                    <SummaryCard label="Negative" value={summary.negative} color="#ef4444" />
                                    <SummaryCard label="Neutral" value={summary.neutral} color="#f59e0b" />
                                    <SummaryCard label="Avg Confidence" value={summary.avgConf} />
                                    <SummaryCard label="Avg Communication" value={summary.avgComm} />
                                </div>
                            )}
                        </div>

                        {/* Download Buttons */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                            {/* PDF */}
                            <button onClick={handlePDF} disabled={generating || filteredCalls.length === 0}
                                style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '22px', background: 'white', border: '1px solid #e8e3da', borderRadius: '18px', cursor: filteredCalls.length === 0 ? 'not-allowed' : 'pointer', textAlign: 'left', opacity: filteredCalls.length === 0 ? 0.5 : 1, transition: 'box-shadow .2s', fontFamily: 'inherit' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <FileText size={22} style={{ color: '#dc2626' }} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: '800', fontSize: '15px', color: '#1a1a1a', marginBottom: '4px' }}>Download PDF Report</div>
                                    <div style={{ fontSize: '12px', color: '#8a8480' }}>Print-ready full report with summary table</div>
                                    <div style={{ fontSize: '11px', color: '#6366f1', fontWeight: '600', marginTop: '6px' }}>{filteredCalls.length} records · {counsellorLabel}</div>
                                </div>
                                <Download size={18} style={{ color: '#dc2626', marginLeft: 'auto' }} />
                            </button>

                            {/* Excel/CSV */}
                            <button onClick={handleExcel} disabled={generating || filteredCalls.length === 0}
                                style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '22px', background: 'white', border: '1px solid #e8e3da', borderRadius: '18px', cursor: filteredCalls.length === 0 ? 'not-allowed' : 'pointer', textAlign: 'left', opacity: filteredCalls.length === 0 ? 0.5 : 1, transition: 'box-shadow .2s', fontFamily: 'inherit' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <FileSpreadsheet size={22} style={{ color: '#16a34a' }} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: '800', fontSize: '15px', color: '#1a1a1a', marginBottom: '4px' }}>Download Excel / CSV</div>
                                    <div style={{ fontSize: '12px', color: '#8a8480' }}>Spreadsheet with all fields, opens in Excel</div>
                                    <div style={{ fontSize: '11px', color: '#6366f1', fontWeight: '600', marginTop: '6px' }}>{filteredCalls.length} records · {counsellorLabel}</div>
                                </div>
                                <Download size={18} style={{ color: '#16a34a', marginLeft: 'auto' }} />
                            </button>

                            {/* Master Excel */}
                            <button onClick={handleMasterExcel} disabled={generating}
                                style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '22px', background: 'white', border: '2px solid #bbf7d0', borderRadius: '18px', cursor: 'pointer', textAlign: 'left', transition: 'box-shadow .2s', fontFamily: 'inherit' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <FileSpreadsheet size={22} style={{ color: '#15803d' }} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: '800', fontSize: '15px', color: '#1a1a1a', marginBottom: '4px' }}>Master Excel Report</div>
                                    <div style={{ fontSize: '12px', color: '#8a8480' }}>Auto-generated .xlsx — updated after every analysis</div>
                                    <div style={{ fontSize: '11px', color: '#15803d', fontWeight: '600', marginTop: '6px' }}>Server file · All time · colour-coded</div>
                                </div>
                                <Download size={18} style={{ color: '#15803d', marginLeft: 'auto' }} />
                            </button>
                        </div>

                        {/* Google Sheets Export */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                            <button onClick={exportToGoogleSheets} disabled={sheetsExporting} style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '10px 18px', background: sheetsExporting ? '#f0ece6' : '#0f9d58',
                                color: 'white', border: 'none', borderRadius: '12px',
                                cursor: sheetsExporting ? 'not-allowed' : 'pointer',
                                fontSize: '13px', fontWeight: '700', fontFamily: 'inherit',
                            }}>
                                {sheetsExporting ? '⏳ Exporting...' : '📊 Export to Google Sheets'}
                            </button>
                            {sheetsMsg && (
                                <div style={{
                                    padding: '10px 16px', borderRadius: '10px',
                                    background: sheetsMsg.startsWith('✅') ? '#f0fdf4' : '#fef2f2',
                                    color: sheetsMsg.startsWith('✅') ? '#16a34a' : '#dc2626',
                                    fontSize: '13px', fontWeight: '600',
                                }}>{sheetsMsg}</div>
                            )}
                        </div>

                        {/* Per-Counsellor Quick Download Section */}
                        <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e8e3da', padding: '24px' }}>
                            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <BarChart2 size={16} /> Per-Counsellor Quick Reports
                            </h3>
                            {counsellors.length === 0 ? (
                                <p style={{ color: '#aaa', fontSize: '13px' }}>No counsellor data yet.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {counsellors.map(name => {
                                        const cCalls = calls.filter(c => c.uploadedBy?.fullName === name);
                                        const done = cCalls.filter(c => c.status === 'completed');
                                        const avgL = done.length ? (done.reduce((s, c) => s + (c.leadScore || 0), 0) / done.length).toFixed(1) : '—';
                                        return (
                                            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 16px', background: '#f8f7f4', borderRadius: '12px', flexWrap: 'wrap' }}>
                                                <div style={{ flex: 1, minWidth: '160px' }}>
                                                    <div style={{ fontWeight: '700', fontSize: '14px', color: '#1a1a1a' }}>{name}</div>
                                                    <div style={{ fontSize: '12px', color: '#aaa', marginTop: '2px' }}>{cCalls.length} calls · {done.length} analysed · Avg Score: {avgL}</div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button onClick={() => { generatePDF(cCalls, `Report — ${name}`, name); }}
                                                        style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 13px', borderRadius: '9px', border: '1px solid #fecaca', background: 'white', color: '#dc2626', fontWeight: '700', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                                                        <FileText size={13} /> PDF
                                                    </button>
                                                    <button onClick={() => generateCSV(cCalls, `callintel_${name.replace(/\s+/g, '_')}.csv`)}
                                                        style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 13px', borderRadius: '9px', border: '1px solid #bbf7d0', background: 'white', color: '#16a34a', fontWeight: '700', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                                                        <FileSpreadsheet size={13} /> Excel
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
            <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        </AppLayout>
    );
}
