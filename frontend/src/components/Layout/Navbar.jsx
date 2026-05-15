// src/components/Layout/Navbar.jsx
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Mic, Upload, Phone, LogOut,
  Menu, X, ChevronRight
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/recordings', label: 'Recordings', icon: Mic },
  { path: '/upload-audio', label: 'Upload Audio', icon: Upload },
  { path: '/calls', label: 'Calls', icon: Phone },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <>
      {/* ── Desktop Sidebar ──────────────────────────── */}
      <aside style={{
        width: '240px', background: '#0f172a', display: 'flex',
        flexDirection: 'column', padding: '24px 16px', flexShrink: 0,
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 40,
      }}
        className="hidden md:flex"
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 12px', marginBottom: '36px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Phone size={16} color="white" />
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: '800', fontSize: '15px', letterSpacing: '-0.01em' }}>CallIntel AI</div>
            <div style={{ color: '#64748b', fontSize: '10px', fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Analytics</div>
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
                background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
                color: active ? '#a5b4fc' : '#94a3b8',
                fontSize: '14px', fontWeight: '600',
                transition: 'all 0.15s',
              }}>
                <item.icon size={18} />
                {item.label}
                {active && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
              </Link>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div style={{ borderTop: '1px solid #1e293b', paddingTop: '20px' }}>
          <div style={{ padding: '0 14px', marginBottom: '12px' }}>
            <div style={{ color: 'white', fontSize: '13px', fontWeight: '700' }}>{user?.fullName}</div>
            <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px', textTransform: 'capitalize' }}>
              {user?.role?.replace('_', ' ')}
            </div>
          </div>
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            width: '100%', padding: '11px 14px', borderRadius: '12px',
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#94a3b8', fontSize: '14px', fontWeight: '600',
          }}>
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Mobile Top Bar ────────────────────────────── */}
      <div className="md:hidden" style={{
        background: '#0f172a', padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 40,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Phone size={14} color="white" />
          </div>
          <span style={{ color: 'white', fontWeight: '800', fontSize: '15px' }}>CallIntel AI</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} style={{
          background: 'none', border: 'none', color: 'white', cursor: 'pointer',
        }}>
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* ── Mobile Menu Drawer ────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden" style={{
          position: 'fixed', top: '52px', left: 0, right: 0, bottom: 0,
          background: '#0f172a', zIndex: 39, padding: '16px',
          display: 'flex', flexDirection: 'column', gap: '4px',
        }}>
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '14px', borderRadius: '12px', textDecoration: 'none',
                background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
                color: active ? '#a5b4fc' : '#94a3b8',
                fontSize: '15px', fontWeight: '600',
              }}>
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
          <div style={{ flex: 1 }} />
          <div style={{ borderTop: '1px solid #1e293b', paddingTop: '16px' }}>
            <div style={{ color: 'white', fontSize: '14px', fontWeight: '700', marginBottom: '4px', padding: '0 14px' }}>{user?.fullName}</div>
            <button onClick={() => { handleLogout(); setMobileOpen(false); }} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              width: '100%', padding: '14px', borderRadius: '12px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#94a3b8', fontSize: '15px', fontWeight: '600',
            }}>
              <LogOut size={17} />
              Logout
            </button>
          </div>
        </div>
      )}
    </>
  );
}
