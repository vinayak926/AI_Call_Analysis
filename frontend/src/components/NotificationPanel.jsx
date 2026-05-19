import React from 'react';
import { X, Bell } from 'lucide-react';

const TYPE_BORDER = {
    hot_lead: '#16a34a',
    follow_up: '#2563eb',
    poor_performance: '#dc2626',
};

function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + 'm ago';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    return Math.floor(hrs / 24) + 'd ago';
}

export default function NotificationPanel({ notifications, unreadCount, onClose, onMarkRead, onMarkAllRead }) {
    return (
        <>
            {/* Backdrop */}
            <div onClick={onClose} style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 99,
            }} />

            {/* Panel */}
            <div style={{
                position: 'fixed', right: 0, top: 0, bottom: 0, width: '380px',
                background: 'white', zIndex: 100,
                boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
                display: 'flex', flexDirection: 'column',
                fontFamily: "'DM Sans', system-ui, sans-serif",
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px 24px', borderBottom: '1px solid #e8e3da',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    flexShrink: 0,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: '800', fontSize: '16px', color: '#1a1a1a' }}>Notifications</span>
                        {unreadCount > 0 && (
                            <span style={{
                                background: '#dc2626', color: 'white', borderRadius: '999px',
                                minWidth: '20px', height: '20px', fontSize: '11px', fontWeight: '700',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px',
                            }}>{unreadCount}</span>
                        )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button onClick={onMarkAllRead} style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontSize: '12px', color: '#6366f1', fontWeight: '700', fontFamily: 'inherit',
                        }}>Mark all read</button>
                        <button onClick={onClose} style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: '#8a8480', padding: '2px', display: 'flex',
                        }}><X size={18} /></button>
                    </div>
                </div>

                {/* List */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '48px 24px', gap: '12px' }}>
                            <Bell size={32} color="#d4d0cc" />
                            <p style={{ fontWeight: '700', fontSize: '14px', color: '#1a1a1a', margin: 0 }}>No notifications yet</p>
                            <p style={{ fontSize: '12px', color: '#aaa', margin: 0, textAlign: 'center' }}>Alerts will appear here after call analysis</p>
                        </div>
                    ) : notifications.map(n => (
                        <div key={n._id}
                            onClick={() => !n.isRead && onMarkRead(n._id)}
                            style={{
                                padding: '16px 20px',
                                borderBottom: '1px solid #f0ece6',
                                borderLeft: `3px solid ${TYPE_BORDER[n.type] || '#e8e3da'}`,
                                background: n.isRead ? 'white' : '#fafaf8',
                                cursor: n.isRead ? 'default' : 'pointer',
                            }}>
                            <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: '700', color: '#1a1a1a' }}>{n.title}</p>
                            <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#8a8480', lineHeight: 1.4 }}>{n.message}</p>
                            <p style={{ margin: 0, fontSize: '11px', color: '#aaa' }}>{timeAgo(n.createdAt)}</p>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
