import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';


import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import UploadPage from './pages/UploadPage';
import CallsPage from './pages/CallsPage';
import CallDetailPage from './pages/CallDetailPage';
import RecordingsPage from './pages/RecordingsPage';        
import UploadAudioPage from './pages/UploadAudioPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import UsersPage from './pages/admin/UsersPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected — login required */}
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/upload" element={
            <ProtectedRoute><UploadPage /></ProtectedRoute>
          } />
          <Route path="/calls" element={
            <ProtectedRoute><CallsPage /></ProtectedRoute>
          } />
          <Route path="/calls/:id" element={
            <ProtectedRoute><CallDetailPage /></ProtectedRoute>
          } />
          <Route path="/recordings" element={<ProtectedRoute><RecordingsPage /></ProtectedRoute>} />       
          <Route path="/upload-audio" element={<ProtectedRoute><UploadAudioPage /></ProtectedRoute>} />

          {/* Admin only routes */}
          <Route path="/admin" element={
            <AdminRoute><AdminDashboard /></AdminRoute>
          } />
          <Route path="/admin/users" element={
            <AdminRoute><UsersPage /></AdminRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;