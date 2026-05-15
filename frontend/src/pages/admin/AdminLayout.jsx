// src/pages/admin/AdminLayout.jsx
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, LogOut, Phone } from 'lucide-react';

const LogoMark = () => (
  <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
    <path d="M4 6 L14 22 L24 6" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/users', label: 'Users', icon: Users },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Sidebar */}
      <div style={{ width: '240px', background: '#111', display: 'flex', flexDirection: 'column', padding: '28px 20px', flexShrink: 0 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px', paddingLeft: '8px' }}>
          <LogoMark />
          <div>
            <div style={{ color: 'white', fontWeight: '800', fontSize: '14px', letterSpacing: '-0.01em' }}>CallIntel AI</div>
            <div style={{ color: '#666', fontSize: '10px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Admin Panel</div>
          </div>
        </div>

        {/* Nav Links */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '11px 14px', borderRadius: '12px', textDecoration: 'none',
                background: active ? '#222' : 'transparent',
                color: active ? 'white' : '#888',
                fontSize: '14px', fontWeight: '600',
                transition: 'all 0.15s',
              }}>
                <item.icon size={17} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div style={{ borderTop: '1px solid #222', paddingTop: '20px' }}>
          <div style={{ paddingLeft: '14px', marginBottom: '12px' }}>
            <div style={{ color: 'white', fontSize: '13px', fontWeight: '700' }}>{user?.fullName}</div>
            <div style={{ color: '#666', fontSize: '11px', marginTop: '2px' }}>{user?.role?.replace('_', ' ')}</div>
          </div>
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            width: '100%', padding: '11px 14px', borderRadius: '12px',
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#888', fontSize: '14px', fontWeight: '600',
            transition: 'color 0.15s',
          }}>
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, background: '#f8f7f4', overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  );
}