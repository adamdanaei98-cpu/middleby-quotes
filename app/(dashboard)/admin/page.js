// app/(dashboard)/admin/page.js
'use client';
import { useAuth } from '@/components/AuthProvider';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { C } from '@/lib/transform';

const ROLE_OPTIONS = [
  { value: 'salesperson', label: 'Salesperson' },
  { value: 'reviewer', label: 'Reviewer' },
  { value: 'manager', label: 'Manager' },
  { value: 'supervisor', label: 'Supervisor' },
];

export default function AdminPage() {
  const { user, canAdmin } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState('prototype');
  const [users, setUsers] = useState([]);
  const [dbCompanies, setDbCompanies] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'salesperson', isAdmin: false, primaryCompanyId: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!canAdmin) { router.push('/builder'); return; }
    async function load() {
      try {
        const [usersRes, catRes] = await Promise.all([fetch('/api/users'), fetch('/api/catalog')]);
        if (usersRes.ok) { const d = await usersRes.json(); setUsers(d.users || []); }
        if (catRes.ok) { const d = await catRes.json(); setDbCompanies(d.companies || []); }
      } catch (e) { console.error(e); }
      setLoadingUsers(false);
    }
    load();
  }, [canAdmin, router]);

  const handleAddUser = async () => {
    setError(''); setSuccess('');
    if (!newUser.name || !newUser.email || !newUser.password) { setError('Name, email, and password required'); return; }
    try {
      const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newUser) });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setUsers(prev => [...prev, data.user]);
      setNewUser({ name: '', email: '', password: '', role: 'salesperson', isAdmin: false, primaryCompanyId: '' });
      setShowAddUser(false);
      setSuccess('User created'); setTimeout(() => setSuccess(''), 3000);
    } catch { setError('Network error'); }
  };

  const handleUpdateUser = async (updates) => {
    setError('');
    try {
      const res = await fetch('/api/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setUsers(prev => prev.map(u => u.id === data.user.id ? data.user : u));
      setEditUser(null);
      setSuccess('User updated'); setTimeout(() => setSuccess(''), 3000);
    } catch { setError('Network error'); }
  };

  if (!canAdmin) return null;

  const TB = ({ id, l }) => <button onClick={() => setTab(id)} style={{ padding: '7px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: tab === id ? '#003250' : 'transparent', color: tab === id ? '#fff' : '#8b919e' }}>{l}</button>;
  const iStyle = { width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #e2e4e9', fontSize: 12, boxSizing: 'border-box' };
  const lStyle = { fontSize: 10, fontWeight: 700, color: '#8b919e', marginBottom: 3, display: 'block' };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: 20 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 2, background: '#fff', padding: 4, borderRadius: 10, border: '1px solid #e2e4e9' }}>
          <TB id="prototype" l="Catalog & Companies" />
          <TB id="users" l="Users" />
        </div>
      </div>

      {success && <div style={{ padding: '8px 16px', background: '#dcfce7', color: '#16a34a', borderRadius: 8, fontSize: 12, fontWeight: 600, marginBottom: 16 }}>{success}</div>}
      {error && <div style={{ padding: '8px 16px', background: '#fef2f2', color: '#dc2626', borderRadius: 8, fontSize: 12, fontWeight: 600, marginBottom: 16 }}>{error}</div>}

      {/* Full prototype embedded */}
      {tab === 'prototype' && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e4e9', overflow: 'hidden' }}>
          <iframe src="/quotecraft.html" style={{ width: '100%', height: 'calc(100vh - 140px)', border: 'none' }} />
        </div>
      )}

      {/* Users tab */}
      {tab === 'users' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#003250', margin: 0 }}>Users & Accounts</h2>
              <p style={{ fontSize: 12, color: '#8b919e', margin: '4px 0 0' }}>{users.length} users</p>
            </div>
            <button onClick={() => setShowAddUser(true)} style={{ padding: '8px 18px', background: '#003250', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+ Add User</button>
          </div>

          {showAddUser && (
            <div className="modal-overlay" onClick={() => setShowAddUser(false)}>
              <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#003250', marginBottom: 16 }}>Add New User</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div><label style={lStyle}>NAME</label><input value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} placeholder="Full name" style={iStyle} /></div>
                  <div><label style={lStyle}>EMAIL</label><input value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} placeholder="email@middleby.com" style={iStyle} /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div><label style={lStyle}>PASSWORD</label><input type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} placeholder="Password" style={iStyle} /></div>
                  <div><label style={lStyle}>ROLE</label><select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} style={iStyle}>{ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}</select></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div><label style={lStyle}>PRIMARY COMPANY</label><select value={newUser.primaryCompanyId} onChange={e => setNewUser({ ...newUser, primaryCompanyId: e.target.value })} style={iStyle}><option value="">None (Corporate)</option>{dbCompanies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                  <div style={{ display: 'flex', alignItems: 'end', paddingBottom: 4 }}><label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}><input type="checkbox" checked={newUser.isAdmin} onChange={e => setNewUser({ ...newUser, isAdmin: e.target.checked })} /> Admin privileges</label></div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button onClick={handleAddUser} style={{ flex: 1, padding: 10, background: '#003250', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Create User</button>
                  <button onClick={() => setShowAddUser(false)} style={{ padding: '10px 20px', background: '#f3f4f6', color: '#8b919e', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {editUser && (
            <div className="modal-overlay" onClick={() => setEditUser(null)}>
              <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#003250', marginBottom: 16 }}>Edit: {editUser.name}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div><label style={lStyle}>NAME</label><input defaultValue={editUser.name} id="ed-name" style={iStyle} /></div>
                  <div><label style={lStyle}>EMAIL</label><input defaultValue={editUser.email} id="ed-email" style={iStyle} /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div><label style={lStyle}>NEW PASSWORD (blank=keep)</label><input type="password" id="ed-pw" style={iStyle} /></div>
                  <div><label style={lStyle}>ROLE</label><select defaultValue={editUser.role} id="ed-role" style={iStyle}>{ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}</select></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div><label style={lStyle}>PRIMARY COMPANY</label><select defaultValue={editUser.primaryCompanyId || ''} id="ed-co" style={iStyle}><option value="">None (Corporate)</option>{dbCompanies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'end', paddingBottom: 4 }}>
                    <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}><input type="checkbox" defaultChecked={editUser.isAdmin} id="ed-admin" /> Admin</label>
                    <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}><input type="checkbox" defaultChecked={editUser.active} id="ed-active" /> Active</label>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button onClick={() => { const pw = document.getElementById('ed-pw').value; handleUpdateUser({ id: editUser.id, name: document.getElementById('ed-name').value, email: document.getElementById('ed-email').value, role: document.getElementById('ed-role').value, isAdmin: document.getElementById('ed-admin').checked, primaryCompanyId: document.getElementById('ed-co').value || null, active: document.getElementById('ed-active').checked, ...(pw ? { password: pw } : {}) }); }} style={{ flex: 1, padding: 10, background: '#003250', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Save</button>
                  <button onClick={() => setEditUser(null)} style={{ padding: '10px 20px', background: '#f3f4f6', color: '#8b919e', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e4e9', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr style={{ background: '#f8f9fb' }}>
                {['Name', 'Email', 'Role', 'Admin', 'Company', 'Status', ''].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 9, fontWeight: 700, color: '#8b919e', borderBottom: '1px solid #e2e4e9' }}>{h}</th>)}
              </tr></thead>
              <tbody>{users.map(u => {
                const co = dbCompanies.find(c => c.id === u.primaryCompanyId);
                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#003250' }}>{u.name}</td>
                    <td style={{ padding: '10px 14px', color: '#555' }}>{u.email}</td>
                    <td style={{ padding: '10px 14px' }}><span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: u.role === 'supervisor' ? '#dbeafe' : u.role === 'manager' ? '#dcfce7' : u.role === 'reviewer' ? '#fef9c3' : '#f3f4f6', color: u.role === 'supervisor' ? '#2563eb' : u.role === 'manager' ? '#16a34a' : u.role === 'reviewer' ? '#a16207' : '#6b7085' }}>{ROLE_OPTIONS.find(r => r.value === u.role)?.label}</span></td>
                    <td style={{ padding: '10px 14px' }}>{u.isAdmin && <span style={{ fontSize: 10, fontWeight: 600, color: '#E12C3E', background: '#fef2f2', padding: '2px 8px', borderRadius: 10 }}>Admin</span>}</td>
                    <td style={{ padding: '10px 14px', fontSize: 11 }}>{co ? <span style={{ color: co.color, fontWeight: 600 }}>{co.name}</span> : 'Corporate'}</td>
                    <td style={{ padding: '10px 14px' }}><span style={{ fontSize: 10, fontWeight: 600, color: u.active ? '#16a34a' : '#dc2626' }}>{u.active ? 'Active' : 'Inactive'}</span></td>
                    <td style={{ padding: '10px 14px' }}><button onClick={() => setEditUser(u)} style={{ padding: '4px 10px', borderRadius: 5, border: '1px solid #e2e4e9', background: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>Edit</button></td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
