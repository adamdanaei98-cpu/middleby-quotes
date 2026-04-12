// app/(dashboard)/admin/page.js
'use client';
import { useAuth } from '@/components/AuthProvider';
import { useQuote } from '@/components/QuoteProvider';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fP, C } from '@/lib/transform';

const ROLE_OPTIONS = [
  { value: 'salesperson', label: 'Salesperson' },
  { value: 'reviewer', label: 'Reviewer' },
  { value: 'manager', label: 'Manager' },
  { value: 'supervisor', label: 'Supervisor' },
];

export default function AdminPage() {
  const { user, canAdmin } = useAuth();
  const { companies, customers, loading: quoteLoading } = useQuote();
  const router = useRouter();
  const [tab, setTab] = useState('users');
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
    if (!newUser.name || !newUser.email || !newUser.password) { setError('Name, email, and password are required'); return; }
    try {
      const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newUser) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to create user'); return; }
      setUsers(prev => [...prev, data.user]);
      setNewUser({ name: '', email: '', password: '', role: 'salesperson', isAdmin: false, primaryCompanyId: '' });
      setShowAddUser(false);
      setSuccess('User created successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) { setError('Network error'); }
  };

  const handleUpdateUser = async (updates) => {
    setError('');
    try {
      const res = await fetch('/api/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to update'); return; }
      setUsers(prev => prev.map(u => u.id === data.user.id ? data.user : u));
      setEditUser(null);
      setSuccess('User updated');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) { setError('Network error'); }
  };

  if (!canAdmin) return null;
  if (loadingUsers || quoteLoading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 56px)' }}><div style={{ fontSize: 16, color: C.muted }}>Loading...</div></div>;

  const TB = ({ id, l }) => <button onClick={() => setTab(id)} style={{ padding: '7px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: tab === id ? '#003250' : 'transparent', color: tab === id ? '#fff' : '#8b919e' }}>{l}</button>;
  const inputStyle = { width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #e2e4e9', fontSize: 12, boxSizing: 'border-box' };
  const labelStyle = { fontSize: 10, fontWeight: 700, color: '#8b919e', marginBottom: 3, display: 'block' };

  return (
    <div style={{ maxWidth: 1320, margin: '0 auto', padding: 20 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 2, background: '#fff', padding: 4, borderRadius: 10, border: '1px solid #e2e4e9' }}>
          <TB id="users" l="Users" />
          <TB id="catalog" l="Catalog" />
          <TB id="companies" l="Companies" />
          <TB id="customers" l="Customers" />
        </div>
      </div>

      {success && <div style={{ padding: '8px 16px', background: '#dcfce7', color: '#16a34a', borderRadius: 8, fontSize: 12, fontWeight: 600, marginBottom: 16 }}>{success}</div>}
      {error && <div style={{ padding: '8px 16px', background: '#fef2f2', color: '#dc2626', borderRadius: 8, fontSize: 12, fontWeight: 600, marginBottom: 16 }}>{error}</div>}

      {/* ═══ USERS TAB ═══ */}
      {tab === 'users' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#003250', margin: 0 }}>Users & Accounts</h2>
              <p style={{ fontSize: 12, color: '#8b919e', margin: '4px 0 0' }}>{users.length} users</p>
            </div>
            <button onClick={() => setShowAddUser(true)} style={{ padding: '8px 18px', background: '#003250', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+ Add User</button>
          </div>

          {/* Add User Modal */}
          {showAddUser && (
            <div className="modal-overlay" onClick={() => setShowAddUser(false)}>
              <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#003250', marginBottom: 16 }}>Add New User</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div><label style={labelStyle}>NAME</label><input value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} placeholder="Full name" style={inputStyle} /></div>
                  <div><label style={labelStyle}>EMAIL</label><input value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} placeholder="email@middleby.com" style={inputStyle} /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div><label style={labelStyle}>PASSWORD</label><input type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} placeholder="Password" style={inputStyle} /></div>
                  <div><label style={labelStyle}>ROLE</label><select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} style={inputStyle}>{ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}</select></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div><label style={labelStyle}>PRIMARY COMPANY</label><select value={newUser.primaryCompanyId} onChange={e => setNewUser({ ...newUser, primaryCompanyId: e.target.value })} style={inputStyle}><option value="">None (Corporate)</option>{dbCompanies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                  <div style={{ display: 'flex', alignItems: 'end', paddingBottom: 4 }}>
                    <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input type="checkbox" checked={newUser.isAdmin} onChange={e => setNewUser({ ...newUser, isAdmin: e.target.checked })} style={{ accentColor: '#003250' }} />
                      Admin privileges
                    </label>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button onClick={handleAddUser} style={{ flex: 1, padding: 10, background: '#003250', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Create User</button>
                  <button onClick={() => setShowAddUser(false)} style={{ padding: '10px 20px', background: '#f3f4f6', color: '#8b919e', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* Users Table */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e4e9', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f8f9fb' }}>
                  {['Name', 'Email', 'Role', 'Admin', 'Company', 'Status', ''].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 9, fontWeight: 700, color: '#8b919e', borderBottom: '1px solid #e2e4e9' }}>{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const co = dbCompanies.find(c => c.id === u.primaryCompanyId);
                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: '#003250' }}>{u.name}</td>
                      <td style={{ padding: '10px 14px', color: '#555' }}>{u.email}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: u.role === 'supervisor' ? '#dbeafe' : u.role === 'manager' ? '#dcfce7' : u.role === 'reviewer' ? '#fef9c3' : '#f3f4f6', color: u.role === 'supervisor' ? '#2563eb' : u.role === 'manager' ? '#16a34a' : u.role === 'reviewer' ? '#a16207' : '#6b7085' }}>
                          {ROLE_OPTIONS.find(r => r.value === u.role)?.label}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        {u.isAdmin && <span style={{ fontSize: 10, fontWeight: 600, color: '#E12C3E', background: '#fef2f2', padding: '2px 8px', borderRadius: 10 }}>Admin</span>}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#8b919e', fontSize: 11 }}>
                        {co ? <span style={{ color: co.color, fontWeight: 600 }}>{co.name}</span> : 'Corporate'}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: u.active ? '#16a34a' : '#dc2626' }}>{u.active ? 'Active' : 'Inactive'}</span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <button onClick={() => setEditUser(u)} style={{ padding: '4px 10px', borderRadius: 5, border: '1px solid #e2e4e9', background: '#fff', fontSize: 10, fontWeight: 600, color: '#003250', cursor: 'pointer' }}>Edit</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Edit User Modal */}
          {editUser && (
            <div className="modal-overlay" onClick={() => setEditUser(null)}>
              <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#003250', marginBottom: 16 }}>Edit User: {editUser.name}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div><label style={labelStyle}>NAME</label><input defaultValue={editUser.name} id="edit-name" style={inputStyle} /></div>
                  <div><label style={labelStyle}>EMAIL</label><input defaultValue={editUser.email} id="edit-email" style={inputStyle} /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div><label style={labelStyle}>NEW PASSWORD (leave blank to keep)</label><input type="password" id="edit-password" placeholder="New password..." style={inputStyle} /></div>
                  <div><label style={labelStyle}>ROLE</label><select defaultValue={editUser.role} id="edit-role" style={inputStyle}>{ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}</select></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div><label style={labelStyle}>PRIMARY COMPANY</label><select defaultValue={editUser.primaryCompanyId || ''} id="edit-company" style={inputStyle}><option value="">None (Corporate)</option>{dbCompanies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'end', paddingBottom: 4 }}>
                    <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input type="checkbox" defaultChecked={editUser.isAdmin} id="edit-isadmin" style={{ accentColor: '#003250' }} />
                      Admin privileges
                    </label>
                    <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input type="checkbox" defaultChecked={editUser.active} id="edit-active" style={{ accentColor: '#16a34a' }} />
                      Active
                    </label>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button onClick={() => {
                    const pw = document.getElementById('edit-password').value;
                    handleUpdateUser({
                      id: editUser.id,
                      name: document.getElementById('edit-name').value,
                      email: document.getElementById('edit-email').value,
                      role: document.getElementById('edit-role').value,
                      isAdmin: document.getElementById('edit-isadmin').checked,
                      primaryCompanyId: document.getElementById('edit-company').value || null,
                      active: document.getElementById('edit-active').checked,
                      ...(pw ? { password: pw } : {}),
                    });
                  }} style={{ flex: 1, padding: 10, background: '#003250', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Save Changes</button>
                  <button onClick={() => setEditUser(null)} style={{ padding: '10px 20px', background: '#f3f4f6', color: '#8b919e', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ CATALOG TAB ═══ */}
      {tab === 'catalog' && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#003250', marginBottom: 16 }}>Catalog</h2>
          {dbCompanies.map(co => (
            <div key={co.id} style={{ marginBottom: 20 }}>
              <div style={{ background: co.color, padding: '12px 20px', borderRadius: '10px 10px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{co.name}</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,.7)' }}>{co.description}</div></div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>{co.catalogSections?.length || 0} sections</div>
              </div>
              {(co.catalogSections || []).map(sec => (
                <div key={sec.id} style={{ border: '1px solid #e2e4e9', borderTop: 'none', background: '#fff' }}>
                  <div style={{ padding: '8px 16px', fontSize: 12, fontWeight: 700, color: co.color, borderBottom: '1px solid #f3f4f6' }}>{sec.name} ({sec.items?.length || 0} items)</div>
                  {(sec.items || []).map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 16px 6px 32px', borderTop: '1px solid #f8f9fb', fontSize: 12 }}>
                      <div><span style={{ fontWeight: 500 }}>{item.name}</span>{item.description && <span style={{ color: '#8b919e', fontSize: 10, marginLeft: 8 }}>{item.description}</span>}</div>
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        {item.options && Array.isArray(item.options) && item.options.length > 0 && <span style={{ fontSize: 10, color: co.color, fontWeight: 600 }}>{item.options.length} options</span>}
                        <span style={{ fontWeight: 600, color: co.color }}>{fP(item.fixedPrice)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ═══ COMPANIES TAB ═══ */}
      {tab === 'companies' && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#003250', marginBottom: 16 }}>Companies</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {dbCompanies.map(co => (
              <div key={co.id} style={{ background: '#fff', borderRadius: 12, border: '2px solid ' + co.color, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: co.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#fff' }}>{co.name[0]}</div>
                  <div><div style={{ fontSize: 15, fontWeight: 700, color: co.color }}>{co.name}</div><div style={{ fontSize: 10, color: '#8b919e' }}>{co.description}</div></div>
                </div>
                <div style={{ fontSize: 11, color: '#555', lineHeight: 1.5, marginBottom: 8 }}>{co.execSummary || 'No executive summary.'}</div>
                <div style={{ fontSize: 10, color: '#8b919e' }}>Key: {co.key} • Color: {co.color}</div>
                {co.rates && <div style={{ fontSize: 10, color: '#8b919e', marginTop: 4 }}>Labor: ${co.rates.laborRate}/hr • Markup: {co.rates.markup}%</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ CUSTOMERS TAB ═══ */}
      {tab === 'customers' && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#003250', marginBottom: 16 }}>Customers ({customers.length})</h2>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e4e9', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr style={{ background: '#f8f9fb' }}>
                {['Name', 'Plant', 'Contact', 'Email', 'Phone', 'Rep', 'Industry'].map(h => <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 9, fontWeight: 700, color: '#8b919e', borderBottom: '1px solid #e2e4e9' }}>{h.toUpperCase()}</th>)}
              </tr></thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px 14px', fontWeight: 600, color: '#003250' }}>{c.name}</td>
                    <td style={{ padding: '8px 14px', color: '#555' }}>{c.plant || '—'}</td>
                    <td style={{ padding: '8px 14px' }}>{c.contact || '—'}</td>
                    <td style={{ padding: '8px 14px', color: '#8b919e' }}>{c.email || '—'}</td>
                    <td style={{ padding: '8px 14px', color: '#8b919e' }}>{c.phone || '—'}</td>
                    <td style={{ padding: '8px 14px' }}>{c.rep || '—'}</td>
                    <td style={{ padding: '8px 14px', color: '#8b919e' }}>{c.industry || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
