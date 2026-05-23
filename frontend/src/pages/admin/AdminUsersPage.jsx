// src/pages/admin/AdminUsersPage.jsx
import React, { useEffect, useState } from 'react';
import AppLayout from '../../components/Layout/AppLayout';
import API from '../../services/api';
import {
  LayoutDashboard, Users, Phone, Mic, FileText, Target,
  UserCheck, Trash2, UserPlus, X, CheckCircle, Clock,
  RefreshCw, Search, Pencil,
} from 'lucide-react';
import NotificationBell from '../../components/NotificationBell';

const ADMIN_NAV = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/admin/calls', label: 'All Calls', icon: Phone },
  { path: '/admin/recordings', label: 'Recordings', icon: Mic },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/reports', label: 'Reports', icon: FileText },
  { path: '/admin/lead-scoring', label: 'Lead Scoring', icon: Target },   // ← ADD
  { path: '/admin/search', label: 'Search', icon: Search },
];

const ROLES = ['counselor', 'company_admin', 'super_admin'];

const ROLE_BADGE = {
  counselor: { bg: '#eff6ff', color: '#2563eb', label: 'Counsellor' },
  company_admin: { bg: '#f0fdf4', color: '#16a34a', label: 'Company Admin' },
  super_admin: { bg: '#fef3c7', color: '#d97706', label: 'Super Admin' },
};

// ── Shared input field ────────────────────────────────────────────
const Field = ({ label, value, onChange, type = 'text', placeholder = '', disabled = false }) => (
  <div style={{ marginBottom: '14px' }}>
    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b6560', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {label}
    </label>
    <input
      type={type} value={value} placeholder={placeholder} disabled={disabled}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%', padding: '10px 14px', border: '1px solid #e8e3da',
        borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit',
        outline: 'none', boxSizing: 'border-box',
        background: disabled ? '#f8f7f4' : 'white',
        color: disabled ? '#aaa' : '#1a1a1a',
      }}
    />
  </div>
);

// ── Modal shell ───────────────────────────────────────────────────
const Modal = ({ title, onClose, children }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
    <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '500px', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontWeight: '800', fontSize: '18px', color: '#1a1a1a', margin: 0 }}>{title}</h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: '2px' }}>
          <X size={20} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

// ── Add User Modal ────────────────────────────────────────────────
function AddUserModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ fullName: '', email: '', password: '', phone: '', company: '', position: '', role: 'counselor' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = key => val => setForm(p => ({ ...p, [key]: val }));

  const handleSubmit = async () => {
    if (!form.fullName || !form.email || !form.password) { setError('Name, email and password are required.'); return; }
    setSaving(true);
    try { await API.post('/auth/register', { ...form }); onSuccess(); onClose(); }
    catch (e) { setError(e.response?.data?.message || 'Failed to create user.'); }
    finally { setSaving(false); }
  };

  return (
    <Modal title="Add New User" onClose={onClose}>
      <Field label="Full Name" value={form.fullName} onChange={set('fullName')} placeholder="Rahul Sharma" />
      <Field label="Email" value={form.email} onChange={set('email')} type="email" placeholder="rahul@company.com" />
      <Field label="Password" value={form.password} onChange={set('password')} type="password" placeholder="Min 8 characters" />
      <Field label="Phone" value={form.phone} onChange={set('phone')} placeholder="9876543210" />
      <Field label="Company" value={form.company} onChange={set('company')} placeholder="HiLearn Academy" />
      <Field label="Position" value={form.position} onChange={set('position')} placeholder="Sales Counsellor" />
      <div style={{ marginBottom: '14px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b6560', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Role</label>
        <select value={form.role} onChange={e => set('role')(e.target.value)}
          style={{ width: '100%', padding: '10px 14px', border: '1px solid #e8e3da', borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}>
          {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
        </select>
      </div>
      {error && <p style={{ color: '#dc2626', fontSize: '13px', margin: '0 0 14px' }}>{error}</p>}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid #e8e3da', background: 'white', color: '#6b6560', fontWeight: '600', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
        <button onClick={handleSubmit} disabled={saving} style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: '#111', color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Creating…' : 'Create User'}
        </button>
      </div>
    </Modal>
  );
}

// ── Edit User Modal (NEW) ─────────────────────────────────────────
function EditUserModal({ user, onClose, onSuccess }) {
  const [form, setForm] = useState({
    fullName: user.fullName || '',
    phone: user.phone || '',
    company: user.company || '',
    position: user.position || '',
    role: user.role || 'counselor',
    isApproved: user.isApproved ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [changePwd, setChangePwd] = useState(false);
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const set = key => val => setForm(p => ({ ...p, [key]: val }));

  const handleSubmit = async () => {
    if (!form.fullName.trim()) { setError('Full name is required.'); return; }
    if (changePwd) {
      if (newPwd.length < 8) { setError('New password must be at least 8 characters.'); return; }
      if (newPwd !== confirmPwd) { setError('Passwords do not match.'); return; }
    }
    setSaving(true);
    try {
      if (form.role !== user.role)
        await API.patch(`/auth/role/${user._id}`, { role: form.role });
      if (form.isApproved && !user.isApproved)
        await API.patch(`/auth/approve/${user._id}`);
      await API.patch(`/auth/users/${user._id}`, {
        fullName: form.fullName, phone: form.phone,
        company: form.company, position: form.position,
        ...(changePwd && newPwd ? { password: newPwd } : {}),
      });
      onSuccess(); onClose();
    } catch (e) {
      setError(e.response?.data?.message || 'Update failed. Please try again.');
    } finally { setSaving(false); }
  };

  const isSuperAdmin = user.role === 'super_admin';

  return (
    <Modal title="Edit User" onClose={onClose}>
      {/* Email read-only */}
      <Field label="Email (read-only)" value={user.email} onChange={() => { }} disabled />
      <Field label="Full Name" value={form.fullName} onChange={set('fullName')} placeholder="Rahul Sharma" />
      <Field label="Phone" value={form.phone} onChange={set('phone')} placeholder="9876543210" />
      <Field label="Company" value={form.company} onChange={set('company')} placeholder="HiLearn Academy" />
      <Field label="Position" value={form.position} onChange={set('position')} placeholder="Sales Counsellor" />

      {/* ── Change Password Section ── */}
      <div style={{ marginBottom: '14px' }}>
        <button type="button" onClick={() => { setChangePwd(!changePwd); setNewPwd(''); setConfirmPwd(''); setError(''); }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: changePwd ? '#fef2f2' : '#f8f7f4', border: `1px solid ${changePwd ? '#fca5a5' : '#e8e3da'}`, borderRadius: '10px', padding: '10px 16px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', fontWeight: '700', color: changePwd ? '#dc2626' : '#6b6560', width: '100%', textAlign: 'left' }}>
          🔒 {changePwd ? 'Cancel Password Change' : 'Change Password'}
        </button>
      </div>

      {changePwd && (
        <div style={{ background: '#fef9f0', border: '1px solid #fed7aa', borderRadius: '14px', padding: '16px', marginBottom: '14px' }}>
          <p style={{ fontSize: '12px', color: '#92400e', fontWeight: '600', margin: '0 0 12px' }}>
            ⚠️ Enter a new password for this user. Minimum 8 characters.
          </p>
          {/* New password */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b6560', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPwd ? 'text' : 'password'}
                value={newPwd}
                onChange={e => setNewPwd(e.target.value)}
                placeholder="Min 8 characters"
                style={{ width: '100%', padding: '10px 42px 10px 14px', border: '1px solid #e8e3da', borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
              />
              <button type="button" onClick={() => setShowPwd(!showPwd)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: '2px', fontSize: '13px' }}>
                {showPwd ? '🙈' : '👁'}
              </button>
            </div>
            {newPwd.length > 0 && newPwd.length < 8 && (
              <p style={{ fontSize: '11px', color: '#dc2626', margin: '4px 0 0' }}>Too short — need at least 8 characters</p>
            )}
          </div>
          {/* Confirm password */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b6560', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Confirm New Password</label>
            <input
              type={showPwd ? 'text' : 'password'}
              value={confirmPwd}
              onChange={e => setConfirmPwd(e.target.value)}
              placeholder="Repeat new password"
              style={{ width: '100%', padding: '10px 14px', border: `1px solid ${confirmPwd && confirmPwd !== newPwd ? '#fca5a5' : '#e8e3da'}`, borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
            />
            {confirmPwd && confirmPwd !== newPwd && (
              <p style={{ fontSize: '11px', color: '#dc2626', margin: '4px 0 0' }}>Passwords do not match</p>
            )}
            {confirmPwd && confirmPwd === newPwd && newPwd.length >= 8 && (
              <p style={{ fontSize: '11px', color: '#16a34a', margin: '4px 0 0' }}>✓ Passwords match</p>
            )}
          </div>
        </div>
      )}

      {/* Role */}
      <div style={{ marginBottom: '14px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b6560', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Role</label>
        <select value={form.role} disabled={isSuperAdmin} onChange={e => set('role')(e.target.value)}
          style={{ width: '100%', padding: '10px 14px', border: '1px solid #e8e3da', borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: isSuperAdmin ? '#f8f7f4' : 'white', color: isSuperAdmin ? '#aaa' : '#1a1a1a' }}>
          {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
        </select>
        {isSuperAdmin && <p style={{ fontSize: '11px', color: '#aaa', margin: '4px 0 0' }}>Super admin role cannot be changed.</p>}
      </div>

      {/* Approve toggle — only shown if not yet approved */}
      {!user.isApproved && (
        <div style={{ marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '12px 16px', cursor: 'pointer' }}
          onClick={() => set('isApproved')(!form.isApproved)}>
          <input type="checkbox" checked={form.isApproved} readOnly
            style={{ width: '16px', height: '16px', accentColor: '#22c55e', cursor: 'pointer' }} />
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#92400e' }}>Approve this user's account</span>
        </div>
      )}
      {user.isApproved && (
        <div style={{ marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '12px', padding: '12px 16px' }}>
          <CheckCircle size={15} style={{ color: '#16a34a' }} />
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#15803d' }}>Account is approved</span>
        </div>
      )}

      {error && <p style={{ color: '#dc2626', fontSize: '13px', margin: '0 0 14px' }}>{error}</p>}

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid #e8e3da', background: 'white', color: '#6b6560', fontWeight: '600', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
        <button onClick={handleSubmit} disabled={saving}
          style={{ padding: '10px 22px', borderRadius: '10px', border: 'none', background: '#6366f1', color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving…' : '✓ Save Changes'}
        </button>
      </div>
    </Modal>
  );
}

// ── Main Page ─────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionId, setActionId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editUser, setEditUser] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try { const res = await API.get('/auth/users'); setUsers(res.data.users || []); }
    catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleApprove = async (id) => {
    setActionId(id);
    try { await API.patch(`/auth/approve/${id}`); fetchUsers(); }
    catch { alert('Approve failed'); } finally { setActionId(null); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try { await API.delete(`/auth/users/${id}`); fetchUsers(); }
    catch (e) { alert(e.response?.data?.message || 'Delete failed.'); }
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return !q || u.fullName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) || u.company?.toLowerCase().includes(q);
  });

  const stats = { total: users.length, approved: users.filter(u => u.isApproved).length, pending: users.filter(u => !u.isApproved).length };

  return (
    <AppLayout navItems={ADMIN_NAV} panelLabel="Admin Panel">
      {showAdd && <AddUserModal onClose={() => setShowAdd(false)} onSuccess={fetchUsers} />}
      {editUser && <EditUserModal onClose={() => setEditUser(null)} onSuccess={fetchUsers} user={editUser} />}

      <div style={{ padding: '32px 40px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1a1a1a', letterSpacing: '-0.02em', margin: '0 0 4px' }}>Users</h1>
            <p style={{ color: '#8a8480', fontSize: '14px', margin: 0 }}>{stats.total} total · {stats.approved} approved · {stats.pending} pending approval</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <NotificationBell />
            <button onClick={fetchUsers} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', background: 'white', border: '1px solid #e8e3da', borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#6b6560', fontFamily: 'inherit' }}>
              <RefreshCw size={14} style={loading ? { animation: 'spin 1s linear infinite' } : {}} /> Refresh
            </button>
            <button onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', background: '#111', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', color: 'white', fontFamily: 'inherit' }}>
              <UserPlus size={15} /> Add User
            </button>
          </div>
        </div>

        {/* Pending banner */}
        {stats.pending > 0 && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '14px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock size={16} style={{ color: '#d97706', flexShrink: 0 }} />
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#92400e' }}>{stats.pending} user{stats.pending > 1 ? 's' : ''} waiting for approval</span>
          </div>
        )}

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <Search size={14} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, company…"
            style={{ width: '100%', padding: '11px 12px 11px 36px', border: '1px solid #e8e3da', borderRadius: '12px', fontSize: '13px', background: 'white', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', color: '#6366f1' }} />
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e8e3da', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8f7f4', borderBottom: '1px solid #e8e3da' }}>
                  {['Name', 'Email', 'Phone', 'Company', 'Role', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '13px 18px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((user, i) => {
                  const rb = ROLE_BADGE[user.role] || ROLE_BADGE.counselor;
                  return (
                    <tr key={user._id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f0ece6' : 'none', background: !user.isApproved ? '#fffdf5' : 'white' }}>
                      <td style={{ padding: '16px 18px' }}>
                        <div style={{ fontWeight: '700', fontSize: '14px', color: '#1a1a1a' }}>{user.fullName}</div>
                        <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>{user.position || '—'}</div>
                      </td>
                      <td style={{ padding: '16px 18px', color: '#6b6560' }}>{user.email}</td>
                      <td style={{ padding: '16px 18px', color: '#6b6560' }}>{user.phone || '—'}</td>
                      <td style={{ padding: '16px 18px', color: '#6b6560' }}>{user.company || '—'}</td>
                      <td style={{ padding: '16px 18px' }}>
                        <span style={{ background: rb.bg, color: rb.color, padding: '4px 12px', borderRadius: '50px', fontSize: '11px', fontWeight: '700' }}>{rb.label}</span>
                      </td>
                      <td style={{ padding: '16px 18px' }}>
                        {user.isApproved
                          ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#f0fdf4', color: '#16a34a', fontSize: '11px', fontWeight: '700', padding: '4px 12px', borderRadius: '50px' }}><CheckCircle size={12} /> Approved</span>
                          : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#fffbeb', color: '#d97706', fontSize: '11px', fontWeight: '700', padding: '4px 12px', borderRadius: '50px' }}><Clock size={12} /> Pending</span>
                        }
                      </td>
                      <td style={{ padding: '16px 18px' }}>
                        <div style={{ display: 'flex', gap: '7px', alignItems: 'center', flexWrap: 'wrap' }}>

                          {/* EDIT — opens EditUserModal */}
                          <button onClick={() => setEditUser(user)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '7px 13px', borderRadius: '10px', background: 'white', color: '#6366f1', border: '1px solid #c7d2fe', cursor: 'pointer', fontSize: '12px', fontWeight: '700', fontFamily: 'inherit' }}>
                            <Pencil size={13} /> Edit
                          </button>

                          {/* APPROVE — only if pending */}
                          {!user.isApproved && (
                            <button onClick={() => handleApprove(user._id)} disabled={actionId === user._id}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '7px 13px', borderRadius: '10px', background: '#111', color: 'white', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '700', fontFamily: 'inherit', opacity: actionId === user._id ? 0.6 : 1 }}>
                              <UserCheck size={13} /> {actionId === user._id ? 'Approving…' : 'Approve'}
                            </button>
                          )}

                          {/* DELETE */}
                          {user.role !== 'super_admin' && (
                            <button onClick={() => handleDelete(user._id, user.fullName)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '7px 13px', borderRadius: '10px', background: 'white', color: '#dc2626', border: '1px solid #fecaca', cursor: 'pointer', fontSize: '12px', fontWeight: '700', fontFamily: 'inherit' }}>
                              <Trash2 size={13} /> Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div style={{ padding: '48px', textAlign: 'center', color: '#aaa', fontSize: '14px' }}>No users found.</div>
            )}
          </div>
        )}
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </AppLayout>
  );
}