// src/components/Layout/TopBar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Phone, Upload, LayoutDashboard, LogOut, Mic } from 'lucide-react';

export default function TopBar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => { logout(); navigate('/login'); };

    return (
        <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px', position: 'sticky', top: 0, zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <span style={{ fontWeight: '800', fontSize: '16px', color: '#111' }}>CallIntel AI</span>
                <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#6b7280', textDecoration: 'none', fontWeight: '500' }}>
                    <LayoutDashboard size={15} /> Dashboard
                </Link>
                <Link to="/upload" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#6b7280', textDecoration: 'none', fontWeight: '500' }}>
                    <Upload size={15} /> Upload
                </Link>
                <Link to="/calls" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#6b7280', textDecoration: 'none', fontWeight: '500' }}>
                    <Phone size={15} /> My Calls
                </Link>
                <Link to="/recordings" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#6b7280', textDecoration: 'none', fontWeight: '500' }}>
                    <Mic size={15} /> Recordings
                </Link>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>{user?.fullName}</span>
                <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <LogOut size={15} /> Logout
                </button>
            </div>
        </div>
    );
}