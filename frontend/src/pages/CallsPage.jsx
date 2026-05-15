// src/pages/CallsPage.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Clock, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import API from '../services/api';

const statusConfig = {
    pending: { label: 'Pending', color: '#d97706', bg: '#fffbeb' },
    processing: { label: 'Processing', color: '#2563eb', bg: '#eff6ff' },
    completed: { label: 'Completed', color: '#16a34a', bg: '#f0fdf4' },
    failed: { label: 'Failed', color: '#dc2626', bg: '#fef2f2' },
};

export default function CallsPage() {
    const [calls, setCalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCalls = async () => {
            try {
                const res = await API.get('/calls');
                setCalls(res.data.calls);
            } catch (err) {
                setError('Failed to load calls.');
            } finally {
                setLoading(false);
            }
        };
        fetchCalls();
    }, []);

    if (loading) return <div style={{ padding: '32px', color: '#aaa' }}>Loading calls...</div>;
    if (error) return <div style={{ padding: '32px', color: '#dc2626' }}>{error}</div>;

    return (
        <div style={{ minHeight: '100vh', background: '#f8f7f4', padding: '40px 48px' }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1a1a1a', letterSpacing: '-0.02em', margin: '0 0 4px' }}>Call Records</h1>
                        <p style={{ fontSize: '14px', color: '#6b6560', margin: 0 }}>{calls.length} total recordings</p>
                    </div>
                    <Link to="/upload" style={{ padding: '10px 20px', background: '#111', color: 'white', borderRadius: '12px', fontWeight: '700', fontSize: '13px', textDecoration: 'none' }}>
                        + Upload New
                    </Link>
                </div>

                {calls.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 0', color: '#aaa' }}>
                        <Phone size={36} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
                        <p>No calls uploaded yet.</p>
                    </div>
                ) : (
                    <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e8e3da', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f8f7f4', borderBottom: '1px solid #e8e3da' }}>
                                    {['File Name', 'Uploaded By', 'Duration', 'Lead Score', 'Sentiment', 'Status', 'Action'].map(h => (
                                        <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#aaa', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {calls.map((call, i) => {
                                    const s = statusConfig[call.status] || statusConfig.pending;
                                    return (
                                        <tr key={call._id} style={{ borderBottom: i < calls.length - 1 ? '1px solid #f0ece6' : 'none' }}>
                                            <td style={{ padding: '16px 20px', fontSize: '14px', fontWeight: '600', color: '#1a1a1a', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{call.originalFileName}</td>
                                            <td style={{ padding: '16px 20px', fontSize: '13px', color: '#6b6560' }}>{call.uploadedBy?.fullName || '—'}</td>
                                            <td style={{ padding: '16px 20px', fontSize: '13px', color: '#6b6560' }}>
                                                {call.durationSeconds ? `${Math.floor(call.durationSeconds / 60)}m ${call.durationSeconds % 60}s` : '—'}
                                            </td>
                                            <td style={{ padding: '16px 20px', fontSize: '13px', fontWeight: '700', color: '#1a1a1a' }}>{call.leadScore ?? '—'}</td>
                                            <td style={{ padding: '16px 20px', fontSize: '13px', color: '#6b6560' }}>{call.sentiment ?? '—'}</td>
                                            <td style={{ padding: '16px 20px' }}>
                                                <span style={{ background: s.bg, color: s.color, padding: '4px 12px', borderRadius: '50px', fontSize: '12px', fontWeight: '700' }}>
                                                    {s.label}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px 20px' }}>
                                                <Link to={`/calls/${call._id}`} style={{ color: '#1a1a1a', fontSize: '13px', fontWeight: '700', textDecoration: 'none' }}>
                                                    View →
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
