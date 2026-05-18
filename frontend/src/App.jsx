// import React from 'react';
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import { AuthProvider } from './context/AuthContext';
// import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';


// import LandingPage from './pages/LandingPage';
// import Login from './pages/Login';
// import Register from './pages/Register';
// import Dashboard from './pages/Dashboard';
// import UploadPage from './pages/UploadPage';
// import CallsPage from './pages/CallsPage';
// import CallDetailPage from './pages/CallDetailPage';
// import RecordingsPage from './pages/RecordingsPage';        
// import UploadAudioPage from './pages/UploadAudioPage';
// import AdminDashboard from './pages/admin/AdminDashboard';
// import UsersPage from './pages/admin/UsersPage';

// function App() {
//   return (
//     <AuthProvider>
//       <Router>
//         <Routes>
//           {/* Public routes */}
//           <Route path="/" element={<LandingPage />} />
//           <Route path="/login" element={<Login />} />
//           <Route path="/register" element={<Register />} />

//           {/* Protected — login required */}
//           <Route path="/dashboard" element={
//             <ProtectedRoute><Dashboard /></ProtectedRoute>
//           } />
//           <Route path="/upload" element={
//             <ProtectedRoute><UploadPage /></ProtectedRoute>
//           } />
//           <Route path="/calls" element={
//             <ProtectedRoute><CallsPage /></ProtectedRoute>
//           } />
//           <Route path="/calls/:id" element={
//             <ProtectedRoute><CallDetailPage /></ProtectedRoute>
//           } />
//           <Route path="/recordings" element={<ProtectedRoute><RecordingsPage /></ProtectedRoute>} />       
//           <Route path="/upload-audio" element={<ProtectedRoute><UploadAudioPage /></ProtectedRoute>} />

//           {/* Admin only routes */}
//           <Route path="/admin" element={
//             <AdminRoute><AdminDashboard /></AdminRoute>
//           } />
//           <Route path="/admin/users" element={
//             <AdminRoute><UsersPage /></AdminRoute>
//           } />
//         </Routes>
//       </Router>
//     </AuthProvider>
//   );
// }

// export default App;

// src/App.jsx
// ─────────────────────────────────────────────────────────────────
// Role-based routing:
//   super_admin / company_admin  →  /admin/* routes
//   counselor                    →  /dashboard, /calls, /recordings, /upload
//
// After login, AuthContext.login() returns the user object with .role.
// Login.jsx (see below) redirects:
//   admin roles  → /admin
//   counselor    → /dashboard
// ─────────────────────────────────────────────────────────────────
// src/App.jsx
// ─────────────────────────────────────────────────────────────────
// Role-based routing:
//   super_admin / company_admin  →  /admin/* routes
//   counselor                    →  /dashboard, /calls, /recordings, /upload
//
// After login, AuthContext.login() returns the user object with .role.
// Login.jsx (see below) redirects:
//   admin roles  → /admin
//   counselor    → /dashboard
// ─────────────────────────────────────────────────────────────────
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Auth pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCallsPage from './pages/admin/AdminCallsPage';
import AdminRecordingsPage from './pages/admin/AdminRecordingsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';

// Counselor pages
import CounselorDashboard from './pages/counselor/CounselorDashboard';
import CounselorCallsPage from './pages/counselor/CounselorCallsPage';
import CounselorRecordingsPage from './pages/counselor/CounselorRecordingsPage';
import CounselorUploadPage from './pages/counselor/CounselorUploadPage';

// Shared detail page (both roles can view individual call detail)
import CallDetailPage from './pages/CallDetailPage';

import { useAuth } from './context/AuthContext';

// ── Route guards ──────────────────────────────────────────────────
const isAdmin = (role) => ['super_admin', 'company_admin'].includes(role);

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function CounselorRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  if (!user) return <Navigate to="/login" replace />;
  // Admin can still access counselor pages if they navigate directly
  return children;
}

// Smart root redirect based on role
function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  if (!user) return <Navigate to="/" replace />;
  return <Navigate to={isAdmin(user.role) ? '/admin' : '/dashboard'} replace />;
}

function Splash() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8f7f4', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #e8e3da', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: '#8a8480', fontSize: '14px', margin: 0 }}>Loading…</p>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Smart redirect after login */}
      <Route path="/home" element={<ProtectedRoute><RootRedirect /></ProtectedRoute>} />

      {/* ── ADMIN PANEL ────────────────────────────── */}
      <Route path="/admin" element={
        <AdminRoute><AdminDashboard /></AdminRoute>
      } />
      <Route path="/admin/calls" element={
        <AdminRoute><AdminCallsPage /></AdminRoute>
      } />
      <Route path="/admin/recordings" element={
        <AdminRoute><AdminRecordingsPage /></AdminRoute>
      } />
      <Route path="/admin/users" element={
        <AdminRoute><AdminUsersPage /></AdminRoute>
      } />
      <Route path="/admin/reports" element={
        <AdminRoute><AdminReportsPage /></AdminRoute>
      } />

      {/* ── COUNSELOR PANEL ────────────────────────── */}
      <Route path="/dashboard" element={
        <CounselorRoute><CounselorDashboard /></CounselorRoute>
      } />
      <Route path="/calls" element={
        <CounselorRoute><CounselorCallsPage /></CounselorRoute>
      } />
      <Route path="/recordings" element={
        <CounselorRoute><CounselorRecordingsPage /></CounselorRoute>
      } />
      <Route path="/upload" element={
        <CounselorRoute><CounselorUploadPage /></CounselorRoute>
      } />

      {/* ── SHARED ─────────────────────────────────── */}
      <Route path="/calls/:id" element={
        <ProtectedRoute><CallDetailPage /></ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
