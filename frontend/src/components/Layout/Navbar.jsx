// // src/components/Layout/Navbar.jsx
// import React, { useState } from 'react';
// import { Link, useLocation, useNavigate } from 'react-router-dom';
// import { useAuth } from '../../context/AuthContext';
// import {
//   LayoutDashboard, Mic, Upload, Phone, LogOut,
//   Menu, X, ChevronRight
// } from 'lucide-react';

// const navItems = [
//   { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
//   { path: '/recordings', label: 'Recordings', icon: Mic },
//   { path: '/upload-audio', label: 'Upload Audio', icon: Upload },
//   { path: '/calls', label: 'Calls', icon: Phone },
// ];

// export default function Navbar() {
//   const { user, logout } = useAuth();
//   const location = useLocation();
//   const navigate = useNavigate();
//   const [mobileOpen, setMobileOpen] = useState(false);

//   const handleLogout = () => {
//     logout();
//     navigate('/login');
//   };

//   if (!user) return null;

//   return (
//     <>
//       {/* ── Desktop Sidebar ──────────────────────────── */}
//       <aside style={{
//         width: '240px', background: '#0f172a', display: 'flex',
//         flexDirection: 'column', padding: '24px 16px', flexShrink: 0,
//         position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 40,
//       }}
//         className="hidden md:flex"
//       >
//         {/* Logo */}
//         <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 12px', marginBottom: '36px' }}>
//           <div style={{
//             width: '32px', height: '32px', borderRadius: '10px',
//             background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
//             display: 'flex', alignItems: 'center', justifyContent: 'center',
//           }}>
//             <Phone size={16} color="white" />
//           </div>
//           <div>
//             <div style={{ color: 'white', fontWeight: '800', fontSize: '15px', letterSpacing: '-0.01em' }}>CallIntel AI</div>
//             <div style={{ color: '#64748b', fontSize: '10px', fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Analytics</div>
//           </div>
//         </div>

//         {/* Nav Links */}
//         <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
//           {navItems.map((item) => {
//             const active = location.pathname === item.path;
//             return (
//               <Link key={item.path} to={item.path} style={{
//                 display: 'flex', alignItems: 'center', gap: '12px',
//                 padding: '11px 14px', borderRadius: '12px', textDecoration: 'none',
//                 background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
//                 color: active ? '#a5b4fc' : '#94a3b8',
//                 fontSize: '14px', fontWeight: '600',
//                 transition: 'all 0.15s',
//               }}>
//                 <item.icon size={18} />
//                 {item.label}
//                 {active && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
//               </Link>
//             );
//           })}
//         </nav>

//         {/* User + Logout */}
//         <div style={{ borderTop: '1px solid #1e293b', paddingTop: '20px' }}>
//           <div style={{ padding: '0 14px', marginBottom: '12px' }}>
//             <div style={{ color: 'white', fontSize: '13px', fontWeight: '700' }}>{user?.fullName}</div>
//             <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px', textTransform: 'capitalize' }}>
//               {user?.role?.replace('_', ' ')}
//             </div>
//           </div>
//           <button onClick={handleLogout} style={{
//             display: 'flex', alignItems: 'center', gap: '12px',
//             width: '100%', padding: '11px 14px', borderRadius: '12px',
//             background: 'none', border: 'none', cursor: 'pointer',
//             color: '#94a3b8', fontSize: '14px', fontWeight: '600',
//           }}>
//             <LogOut size={17} />
//             Logout
//           </button>
//         </div>
//       </aside>

//       {/* ── Mobile Top Bar ────────────────────────────── */}
//       <div className="md:hidden" style={{
//         background: '#0f172a', padding: '12px 16px',
//         display: 'flex', alignItems: 'center', justifyContent: 'space-between',
//         position: 'sticky', top: 0, zIndex: 40,
//       }}>
//         <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
//           <div style={{
//             width: '28px', height: '28px', borderRadius: '8px',
//             background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
//             display: 'flex', alignItems: 'center', justifyContent: 'center',
//           }}>
//             <Phone size={14} color="white" />
//           </div>
//           <span style={{ color: 'white', fontWeight: '800', fontSize: '15px' }}>CallIntel AI</span>
//         </div>
//         <button onClick={() => setMobileOpen(!mobileOpen)} style={{
//           background: 'none', border: 'none', color: 'white', cursor: 'pointer',
//         }}>
//           {mobileOpen ? <X size={22} /> : <Menu size={22} />}
//         </button>
//       </div>

//       {/* ── Mobile Menu Drawer ────────────────────────── */}
//       {mobileOpen && (
//         <div className="md:hidden" style={{
//           position: 'fixed', top: '52px', left: 0, right: 0, bottom: 0,
//           background: '#0f172a', zIndex: 39, padding: '16px',
//           display: 'flex', flexDirection: 'column', gap: '4px',
//         }}>
//           {navItems.map((item) => {
//             const active = location.pathname === item.path;
//             return (
//               <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)} style={{
//                 display: 'flex', alignItems: 'center', gap: '12px',
//                 padding: '14px', borderRadius: '12px', textDecoration: 'none',
//                 background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
//                 color: active ? '#a5b4fc' : '#94a3b8',
//                 fontSize: '15px', fontWeight: '600',
//               }}>
//                 <item.icon size={18} />
//                 {item.label}
//               </Link>
//             );
//           })}
//           <div style={{ flex: 1 }} />
//           <div style={{ borderTop: '1px solid #1e293b', paddingTop: '16px' }}>
//             <div style={{ color: 'white', fontSize: '14px', fontWeight: '700', marginBottom: '4px', padding: '0 14px' }}>{user?.fullName}</div>
//             <button onClick={() => { handleLogout(); setMobileOpen(false); }} style={{
//               display: 'flex', alignItems: 'center', gap: '12px',
//               width: '100%', padding: '14px', borderRadius: '12px',
//               background: 'none', border: 'none', cursor: 'pointer',
//               color: '#94a3b8', fontSize: '15px', fontWeight: '600',
//             }}>
//               <LogOut size={17} />
//               Logout
//             </button>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }
// src/components/Layout/Navbar.jsx
// src/components/Layout/Navbar.jsx
// ─────────────────────────────────────────────────────────────────
// ROOT CAUSE FIX: Project uses Tailwind v4 (@tailwindcss/vite ^4.3)
// with `@import "tailwindcss"` but NO source/content config, so
// classes like `hidden md:flex` and `md:ml-[240px]` are NEVER
// generated. The sidebar was invisible on desktop and the mobile
// drawer was always shown (covering the whole page).
//
// Fix: use ZERO Tailwind responsive classes. Instead, inject a
// <style> block with real @media queries, and use className hooks
// that those rules target. Pure CSS — works regardless of Tailwind.
// ─────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Upload, Phone, Mic,
  LogOut, Menu, X, ChevronRight,
} from 'lucide-react';

// V-mark logo — same as AdminLayout
const LogoMark = () => (
  <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
    <path d="M4 6 L14 22 L24 6"
      stroke="white" strokeWidth="3.5"
      strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/upload', label: 'Upload Calls', icon: Upload },
  { path: '/calls', label: 'Calls', icon: Phone },
  { path: '/recordings', label: 'Recordings', icon: Mic },
];

const linkStyle = (active) => ({
  display: 'flex', alignItems: 'center', gap: '12px',
  padding: '11px 14px', borderRadius: '12px', textDecoration: 'none',
  background: active ? '#222' : 'transparent',
  color: active ? 'white' : '#888',
  fontSize: '14px', fontWeight: '600', transition: 'all 0.15s',
});

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const isActive = (path) =>
    location.pathname === path ||
    (path !== '/dashboard' && location.pathname.startsWith(path));

  if (!user) return null;

  return (
    <>
      {/* Pure CSS media query — no Tailwind needed */}
      <style>{`
        .callintel-sidebar   { display: none !important; }
        .callintel-mobilebar { display: flex !important; }
        @media (min-width: 768px) {
          .callintel-sidebar   { display: flex !important; }
          .callintel-mobilebar { display: none !important; }
        }
      `}</style>

      {/* ── DESKTOP SIDEBAR (≥ 768px) ── */}
      <aside className="callintel-sidebar" style={{
        width: '240px', background: '#111',
        flexDirection: 'column', padding: '28px 20px',
        flexShrink: 0, position: 'fixed',
        top: 0, left: 0, bottom: 0, zIndex: 40,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px', paddingLeft: '8px' }}>
          <LogoMark />
          <div>
            <div style={{ color: 'white', fontWeight: '800', fontSize: '14px', letterSpacing: '-0.01em' }}>CallIntel AI</div>
            <div style={{ color: '#666', fontSize: '10px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Analytics</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link key={item.path} to={item.path} style={linkStyle(active)}>
                <item.icon size={17} />
                {item.label}
                {active && <ChevronRight size={13} style={{ marginLeft: 'auto', opacity: 0.4 }} />}
              </Link>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div style={{ borderTop: '1px solid #222', paddingTop: '20px' }}>
          <div style={{ paddingLeft: '14px', marginBottom: '12px' }}>
            <div style={{ color: 'white', fontSize: '13px', fontWeight: '700' }}>{user?.fullName}</div>
            <div style={{ color: '#666', fontSize: '11px', marginTop: '2px', textTransform: 'capitalize' }}>
              {user?.role?.replace('_', ' ')}
            </div>
          </div>
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            width: '100%', padding: '11px 14px', borderRadius: '12px',
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#888', fontSize: '14px', fontWeight: '600', fontFamily: 'inherit',
          }}>
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </aside>

      {/* ── MOBILE TOP BAR (< 768px) ── */}
      <div className="callintel-mobilebar" style={{
        background: '#111', padding: '14px 16px',
        alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 40, width: '100%',
        boxSizing: 'border-box',
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

      {/* ── MOBILE DRAWER ── */}
      {mobileOpen && (
        <div className="callintel-mobilebar" style={{
          position: 'fixed', top: '52px', left: 0, right: 0, bottom: 0,
          background: '#111', zIndex: 39, padding: '16px',
          flexDirection: 'column', gap: '4px',
        }}>
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link key={item.path} to={item.path}
                onClick={() => setMobileOpen(false)}
                style={{ ...linkStyle(active), fontSize: '15px', padding: '14px' }}>
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
          <div style={{ flex: 1 }} />
          <div style={{ borderTop: '1px solid #222', paddingTop: '16px' }}>
            <div style={{ color: 'white', fontSize: '14px', fontWeight: '700', marginBottom: '4px', padding: '0 14px' }}>
              {user?.fullName}
            </div>
            <button onClick={() => { handleLogout(); setMobileOpen(false); }} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              width: '100%', padding: '14px', borderRadius: '12px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#888', fontSize: '15px', fontWeight: '600', fontFamily: 'inherit',
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