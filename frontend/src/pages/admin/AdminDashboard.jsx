// src/pages/admin/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import API from "../../services/api";
import { Users, UserCheck, UserX, Clock } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await API.get('/auth/users');
        const users = res.data.users;
        setStats({
          total: users.length,
          approved: users.filter((u) => u.isApproved).length,
          pending: users.filter((u) => !u.isApproved).length,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    { label: 'Total Users', value: stats.total, icon: Users, color: '#2563eb', bg: '#eff6ff' },
    { label: 'Approved', value: stats.approved, icon: UserCheck, color: '#16a34a', bg: '#f0fdf4' },
    { label: 'Pending Approval', value: stats.pending, icon: Clock, color: '#d97706', bg: '#fffbeb' },
  ];

  return (
    <AdminLayout>
      <div style={{ padding: '40px 48px' }}>
        <div style={{ marginBottom: '36px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1a1a1a', letterSpacing: '-0.02em', margin: '0 0 6px' }}>Admin Dashboard</h1>
          <p style={{ fontSize: '14px', color: '#6b6560', margin: 0 }}>Platform overview — users aur approvals manage karo.</p>
        </div>

        {loading ? (
          <p style={{ color: '#aaa' }}>Loading...</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
            {cards.map((card) => (
              <div key={card.label} style={{ background: 'white', borderRadius: '20px', border: '1px solid #e8e3da', padding: '28px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <card.icon size={22} style={{ color: card.color }} />
                </div>
                <div>
                  <div style={{ fontSize: '32px', fontWeight: '800', color: '#1a1a1a', letterSpacing: '-0.02em', lineHeight: 1 }}>{card.value}</div>
                  <div style={{ fontSize: '13px', color: '#8a8480', marginTop: '4px', fontWeight: '500' }}>{card.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick link */}
        <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e8e3da', padding: '28px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 8px' }}>Pending approvals</h3>
          <p style={{ fontSize: '14px', color: '#6b6560', margin: '0 0 16px' }}>
            {stats.pending > 0 ? `${stats.pending} user(s) approval ka wait kar rahe hain.` : 'Sab users approved hain. ✅'}
          </p>
          {stats.pending > 0 && (
            <a href="/admin/users" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', background: '#111', color: 'white', fontWeight: '700', fontSize: '13px', textDecoration: 'none', letterSpacing: '0.04em' }}>
              Users Manage Karo →
            </a>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}