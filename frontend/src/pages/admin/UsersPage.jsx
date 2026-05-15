// src/pages/admin/UsersPage.jsx
import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import API from '../../services/api';
import { CheckCircle, Clock, UserCheck } from 'lucide-react';

const ROLES = ['counselor', 'company_admin', 'super_admin'];

const roleBadge = (role) => {
  const map = {
    counselor: { bg: '#eff6ff', color: '#2563eb', label: 'Counselor' },
    company_admin: { bg: '#f0fdf4', color: '#16a34a', label: 'Company Admin' },
    super_admin: { bg: '#fef3c7', color: '#d97706', label: 'Super Admin' },
  };
  const s = map[role] || map.counselor;
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '50px', letterSpacing: '0.04em' }}>
      {s.label}
    </span>
  );
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  const fetchUsers = async () => {
    try {
      const res = await API.get('/auth/users');
      setUsers(res.data.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const approveUser = async (id) => {
    setActionId(id);
    try {
      await API.patch(`/auth/approve/${id}`);
      fetchUsers();
    } catch (err) {
      alert('Approve failed');
    } finally {
      setActionId(null);
    }
  };

  const changeRole = async (id, role) => {
    try {
      await API.patch(`/auth/role/${id}`, { role });
      fetchUsers();
    } catch (err) {
      alert('Role change failed');
    }
  };

  return (
    <AdminLayout>
      <div style={{ padding: '40px 48px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1a1a1a', letterSpacing: '-0.02em', margin: '0 0 6px' }}>Users</h1>
          <p style={{ fontSize: '14px', color: '#6b6560', margin: 0 }}>Registered users ko approve karo aur roles manage karo.</p>
        </div>

        {loading ? (
          <p style={{ color: '#aaa' }}>Loading...</p>
        ) : (
          <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e8e3da', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f7f4', borderBottom: '1px solid #e8e3da' }}>
                  {['Name', 'Email', 'Phone', 'Company', 'Role', 'Status', 'Actions'].map((h) => (
                    <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#aaa', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => (
                  <tr key={user._id} style={{ borderBottom: i < users.length - 1 ? '1px solid #f0ece6' : 'none' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: '700', fontSize: '14px', color: '#1a1a1a' }}>{user.fullName}</div>
                      <div style={{ fontSize: '12px', color: '#aaa', marginTop: '2px' }}>{user.position}</div>
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '13px', color: '#6b6560' }}>{user.email}</td>
                    <td style={{ padding: '16px 20px', fontSize: '13px', color: '#6b6560' }}>{user.phone}</td>
                    <td style={{ padding: '16px 20px', fontSize: '13px', color: '#6b6560' }}>{user.company}</td>
                    <td style={{ padding: '16px 20px' }}>
                      <select
                        value={user.role}
                        onChange={(e) => changeRole(user._id, e.target.value)}
                        style={{ fontSize: '12px', border: '1px solid #e0dad0', borderRadius: '8px', padding: '5px 8px', background: 'white', fontFamily: 'inherit', cursor: 'pointer' }}
                      >
                        {ROLES.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      {user.isApproved ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#f0fdf4', color: '#16a34a', fontSize: '12px', fontWeight: '700', padding: '4px 12px', borderRadius: '50px' }}>
                          <CheckCircle size={12} /> Approved
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#fffbeb', color: '#d97706', fontSize: '12px', fontWeight: '700', padding: '4px 12px', borderRadius: '50px' }}>
                          <Clock size={12} /> Pending
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      {!user.isApproved && (
                        <button
                          onClick={() => approveUser(user._id)}
                          disabled={actionId === user._id}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', background: '#111', color: 'white', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '700', fontFamily: 'inherit', opacity: actionId === user._id ? 0.6 : 1 }}
                        >
                          <UserCheck size={13} />
                          {actionId === user._id ? 'Approving...' : 'Approve'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div style={{ padding: '48px', textAlign: 'center', color: '#aaa', fontSize: '14px' }}>Koi user nahi mila.</div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}