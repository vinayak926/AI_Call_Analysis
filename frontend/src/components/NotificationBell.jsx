import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import NotificationPanel from './NotificationPanel';

export default function NotificationBell() {
    const { user } = useAuth();
    const isAdmin = ['super_admin', 'company_admin'].includes(user?.role);

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [hovered, setHovered] = useState(false);

    const fetchNotifications = async () => {
        try {
            const res = await API.get('/notifications');
            setNotifications(res.data.notifications || []);
            setUnreadCount(res.data.unreadCount || 0);
        } catch { }
    };

    useEffect(() => {
        if (!isAdmin) return;
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [isAdmin]);

    const onMarkRead = async (id) => {
        try {
            await API.patch(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch { }
    };

    const onMarkAllRead = async () => {
        try {
            await API.patch('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch { }
    };

    if (!isAdmin) return null;

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                style={{
                    position: 'relative', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', width: '38px', height: '38px',
                    borderRadius: '10px', background: hovered ? '#f8f7f4' : 'white',
                    border: '1px solid #e8e3da', cursor: 'pointer', outline: 'none',
                    transition: 'background 0.15s',
                }}>
                <Bell size={17} color="#6b6560" />
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute', top: '-4px', right: '-4px',
                        background: '#dc2626', color: 'white', borderRadius: '999px',
                        minWidth: '16px', height: '16px', fontSize: '10px', fontWeight: '700',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
                    }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
            </button>

            {isOpen && (
                <NotificationPanel
                    notifications={notifications}
                    unreadCount={unreadCount}
                    onClose={() => setIsOpen(false)}
                    onMarkRead={onMarkRead}
                    onMarkAllRead={onMarkAllRead}
                />
            )}
        </>
    );
}
