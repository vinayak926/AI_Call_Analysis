import React from 'react';
import { X, Flame, Calendar, AlertTriangle } from 'lucide-react';
import API from '../services/api';

const TYPE_CFG = {
    hot_lead:        { color: '#16a34a', border: '#bbf7d0', Icon: Flame,         bg: '#f0fdf4' },
    follow_up:       { color: '#2563eb', border: '#bfdbfe', Icon: Calendar,      bg: '#eff6ff' },
    poor_performance:{ color: '#dc2626', border: '#fecaca', Icon: AlertTriangle,  bg: '#fef2f2' },
};

function timeAgo(date) {
    const secs = Math.floor((Date.now() - new Date(date)) / 1000);
    if (secs < 60) return 'just now';
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationPanel({ notifications, onClose, onMarkRead, onMarkAllRead }) {
    return (
        <>
            {/* Backdrop */}
            <div onClick={onClose} style={{
                position: 'fixed', inset: 0, zIndex: 49,
                background: 'rgba(0,0,0,0.18)',
            }} />

            {/* Panel */}
            <div style={{
                position: 'fixed', top: 0, right: 0, bottom: 0, width: '360px',
                background: 'white', zIndex: 50,
                boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
                display: 'flex', flexDirection: 'column',
                fontFamily: "'DM Sans', system-ui, sans-serif",
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '20px 20px 16px', borderBottom: '1px solid #e8e3da',
                }}>
                    <span style={{ fontWeight: '800', fontSize: '15px', color: '#1a1a1a' }}>Notifications</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button onClick={onMarkAllRead} style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontSize: '12px', color: '#6366f1', fontWeight: '700', fontFamily: 'inherit',
                        }}>Mark all read</button>
                        <button onClick={onClose} style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: '#8a8480', padding: '2px',
                        }}><X size={18} /></button>
                    </div>
                </div>

                {/* List */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                        <div style={{ padding: '48px 20px', textAlign: 'center', color: '#aaa', fontSize: '13px' }}>
                            No notifications yet
                        </div>
                    ) : notifications.map(n => {
                        const cfg = TYPE_CFG[n.type] || TYPE_CFG.follow_up;
                        const { Icon } = cfg;
                        return (
                            <div key={n._id} onClick={() => !n.isRead && onMarkRead(n._id)}
                                style={{
                                    display: 'flex', gap: '12px', padding: '14px 20px',
                                    borderBottom: '1px solid #f0ece6', cursor: n.isRead ? 'default' : 'pointer',
                                    background: n.isRead ? 'white' : '#f8f7f4',
                                    borderLeft: `3px solid ${cfg.color}`,
                                }}>
                                <div style={{
                                    width: '32px', height: '32px', borderRadius: '8px',
                                    background: cfg.bg, display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', flexShrink: 0,
                                }}>
                                    <Icon size={15} color={cfg.color} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                        <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: '700', color: '#1a1a1a' }}>{n.title}</p>
                                        {!n.isRead && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#6366f1', flexShrink: 0, marginTop: '4px' }} />}
                                    </div>
                                    <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#6b6560', lineHeight: 1.4 }}>{n.message}</p>
                                    <p style={{ margin: 0, fontSize: '11px', color: '#aaa' }}>{timeAgo(n.createdAt)}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
