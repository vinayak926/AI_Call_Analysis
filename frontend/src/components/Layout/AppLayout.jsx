// src/components/Layout/AppLayout.jsx
// Shared layout wrapper for BOTH admin and counselor panels.
// Uses zero Tailwind responsive classes (Tailwind v4 issue fix).
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, X, LogOut, ChevronRight, Bell } from 'lucide-react';
import API from '../../services/api';
import NotificationPanel from '../NotificationPanel';

const LogoMark = () => (
    <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
        <path d="M4 6 L14 22 L24 6" stroke="white" strokeWidth="3.5"
            strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
);

export default function AppLayout({ children, navItems, panelLabel = 'Analytics' }) {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);
    const isAdmin = ['super_admin', 'company_admin'].includes(user?.role);

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [panelOpen, setPanelOpen] = useState(false);

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

    const handleMarkRead = async (id) => {
        try {
            await API.patch(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch { }
    };

    const handleMarkAllRead = async () => {
        try {
            await API.patch('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch { }
    };

    const handleLogout = () => { logout(); navigate('/login'); };

    const isActive = (path, exact = false) =>
        exact ? location.pathname === path : location.pathname === path ||
            (path.length > 1 && location.pathname.startsWith(path));

    const linkStyle = (active) => ({
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '11px 14px', borderRadius: '12px', textDecoration: 'none',
        background: active ? '#222' : 'transparent',
        color: active ? 'white' : '#888',
        fontSize: '14px', fontWeight: '600', transition: 'all 0.15s',
    });

    const SidebarContent = ({ onLinkClick }) => (
        <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px', paddingLeft: '8px' }}>
                <LogoMark />
                <div>
                    <div style={{ color: 'white', fontWeight: '800', fontSize: '14px', letterSpacing: '-0.01em' }}>CallIntel AI</div>
                    <div style={{ color: '#666', fontSize: '10px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{panelLabel}</div>
                </div>
            </div>

            {/* Notification Bell — admin only */}
            {isAdmin && (
                <button onClick={() => { setPanelOpen(true); onLinkClick(); }} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    width: '100%', padding: '11px 14px', borderRadius: '12px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#888', fontSize: '14px', fontWeight: '600', fontFamily: 'inherit',
                    marginBottom: '8px', position: 'relative',
                }}>
                    <div style={{ position: 'relative' }}>
                        <Bell size={17} />
                        {unreadCount > 0 && (
                            <span style={{
                                position: 'absolute', top: '-6px', right: '-7px',
                                background: '#dc2626', color: 'white',
                                borderRadius: '50%', width: '16px', height: '16px',
                                fontSize: '9px', fontWeight: '800',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                        )}
                    </div>
                    Notifications
                </button>
            )}
            <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {navItems.map((item) => {
                    const active = isActive(item.path, item.exact);
                    return (
                        <Link key={item.path} to={item.path}
                            onClick={onLinkClick}
                            style={linkStyle(active)}>
                            <item.icon size={17} />
                            {item.label}
                            {active && <ChevronRight size={13} style={{ marginLeft: 'auto', opacity: 0.4 }} />}
                        </Link>
                    );
                })}
            </nav>
            <div style={{ borderTop: '1px solid #222', paddingTop: '20px' }}>
                <div style={{ paddingLeft: '14px', marginBottom: '12px' }}>
                    <div style={{ color: 'white', fontSize: '13px', fontWeight: '700' }}>{user?.fullName}</div>
                    <div style={{ color: '#666', fontSize: '11px', marginTop: '2px', textTransform: 'capitalize' }}>
                        {user?.role?.replace(/_/g, ' ')}
                    </div>
                </div>
                <button onClick={handleLogout} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    width: '100%', padding: '11px 14px', borderRadius: '12px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#888', fontSize: '14px', fontWeight: '600', fontFamily: 'inherit',
                }}>
                    <LogOut size={17} /> Logout
                </button>
            </div>
        </>
    );

    return (
        <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            <style>{`
        .cal-sidebar { display:none; }
        .cal-topbar  { display:flex; }
        @media(min-width:768px){
          .cal-sidebar { display:flex; }
          .cal-topbar  { display:none; }
        }
        .cal-main { margin-left:0; }
        @media(min-width:768px){ .cal-main { margin-left:240px; } }
      `}</style>

            {/* Desktop Sidebar */}
            <aside className="cal-sidebar" style={{
                width: '240px', background: '#111', flexDirection: 'column',
                padding: '28px 20px', flexShrink: 0,
                position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 40,
            }}>
                <SidebarContent onLinkClick={() => { }} />
            </aside>

            {/* Mobile Top Bar */}
            <div className="cal-topbar" style={{
                background: '#111', padding: '14px 16px', alignItems: 'center',
                justifyContent: 'space-between', position: 'fixed', top: 0,
                left: 0, right: 0, zIndex: 40,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <LogoMark />
                    <span style={{ color: 'white', fontWeight: '800', fontSize: '14px' }}>CallIntel AI</span>
                </div>
                <button onClick={() => setMobileOpen(!mobileOpen)}
                    style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '4px' }}>
                    {mobileOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
            </div>

            {/* Mobile Drawer */}
            {mobileOpen && (
                <div style={{
                    position: 'fixed', top: '52px', left: 0, right: 0, bottom: 0,
                    background: '#111', zIndex: 39, padding: '16px',
                    display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto',
                }}>
                    <SidebarContent onLinkClick={() => setMobileOpen(false)} />
                </div>
            )}

            {/* Main Content */}
            <main className="cal-main" style={{ flex: 1, background: '#f8f7f4', minHeight: '100vh', overflowX: 'hidden' }}>
                {children}
            </main>

            {/* Notification Panel */}
            {panelOpen && (
                <NotificationPanel
                    notifications={notifications}
                    onClose={() => setPanelOpen(false)}
                    onMarkRead={handleMarkRead}
                    onMarkAllRead={handleMarkAllRead}
                />
            )}
        </div>
    );
}
