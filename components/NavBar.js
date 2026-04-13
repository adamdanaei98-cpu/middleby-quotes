'use client';
import { useAuth } from './AuthProvider';
import { usePathname, useRouter } from 'next/navigation';

const ROLES = { salesperson: 'Salesperson', reviewer: 'Reviewer', manager: 'Manager', supervisor: 'Supervisor' };
const NAV = [{ id: '/builder', l: 'Builder' }, { id: '/quotes', l: 'Quotes' }, { id: '/margin', l: 'Margin' }, { id: '/pdf', l: 'PDF' }];

export default function NavBar() {
  const { user, logout, canAdmin } = useAuth();
  const path = usePathname();
  const router = useRouter();
  if (!user) return null;
  return (
    <div className="no-print" style={{ background: '#002a3e', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56, position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 8px rgba(0,0,0,.2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: '.05em', fontStyle: 'italic' }}>MIDDLEBY</span>
        <span style={{ fontSize: 8, color: 'rgba(255,255,255,.4)', background: 'rgba(255,255,255,.08)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>QUOTECRAFT</span>
      </div>
      <div style={{ display: 'flex', gap: 2 }}>
        {NAV.map(n => (
          <button key={n.id} onClick={() => router.push(n.id)} style={{ padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: path === n.id ? '#fff' : 'transparent', color: path === n.id ? '#003250' : 'rgba(255,255,255,.6)' }}>{n.l}</button>
        ))}
        {canAdmin && (
          <button onClick={() => router.push('/admin')} style={{ padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: path === '/admin' ? '#E12C3E' : 'rgba(225,44,62,.15)', color: path === '/admin' ? '#fff' : '#E12C3E', marginLeft: 8 }}>
            Admin
          </button>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>{user.name}</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,.5)' }}>
            {ROLES[user.role]}{user.isAdmin ? ' • Admin' : ''} • {user.role === 'supervisor' ? 'Corporate' : 'Company'}
          </div>
        </div>
        <button onClick={logout} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid rgba(255,255,255,.2)', cursor: 'pointer', background: 'transparent', color: 'rgba(255,255,255,.6)', fontSize: 11, fontWeight: 600, transition: 'all .15s' }} onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,.1)'; e.currentTarget.style.color = '#fff'; }} onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,.6)'; }}>
          Log Out
        </button>
      </div>
    </div>
  );
}
