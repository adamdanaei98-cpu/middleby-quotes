'use client';
import { useAuth } from './AuthProvider';
import { useQuote } from './QuoteProvider';
import { usePathname, useRouter } from 'next/navigation';

const ROLES = { salesperson: 'Sales Rep', reviewer: 'Reviewer', manager: 'Manager', supervisor: 'Executive', it: 'IT Admin' };
const NAV = [
  { id: '/builder', l: 'Builder', sub: [{ id: '/pdf', l: 'PDF Preview' }, { id: '/margin', l: 'Margin Preview' }] },
  { id: '/quotes', l: 'Quotes' },
];

export default function NavBar() {
  const { user, logout, canAdmin } = useAuth();
  const { navLogo, navColor, appName } = useQuote();
  const path = usePathname();
  const router = useRouter();
  if (!user) return null;
  const isCorporate = user.role === 'supervisor' || (user.isAdmin && !user.primaryCompanyId);
  const bg = navColor || '#002a3e';
  const label = appName || 'QUOTECRAFT';
  return (
    <div className="no-print" style={{ background: bg, padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56, position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 8px rgba(0,0,0,.2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {navLogo ? <img src={navLogo} style={{ height: 28, objectFit: 'contain' }} alt="Logo" /> : <span style={{ fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: '.05em', fontStyle: 'italic' }}>MIDDLEBY</span>}
        <span style={{ fontSize: 8, color: 'rgba(255,255,255,.4)', background: 'rgba(255,255,255,.08)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        {NAV.map(n => {
          const isActive = path === n.id || (n.sub && n.sub.some(s => path === s.id));
          return (
            <div key={n.id} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <button onClick={() => router.push(n.id)} style={{ padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: isActive ? '#fff' : 'transparent', color: isActive ? bg : 'rgba(255,255,255,.6)' }}>{n.l}</button>
              {n.sub && isActive && n.sub.map(s => (
                <button key={s.id} onClick={() => router.push(s.id)} style={{ padding: '4px 10px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 600, marginLeft: 2, background: path === s.id ? 'rgba(255,255,255,.2)' : 'transparent', color: path === s.id ? '#fff' : 'rgba(255,255,255,.4)' }}>{s.l}</button>
              ))}
            </div>
          );
        })}
        {canAdmin && (
          <button onClick={() => router.push('/admin')} style={{ padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: path === '/admin' ? '#E12C3E' : 'rgba(225,44,62,.15)', color: path === '/admin' ? '#fff' : '#E12C3E', marginLeft: 8 }}>Admin</button>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>{user.name}</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,.5)' }}>
            {ROLES[user.role]}{user.isAdmin ? ' • Admin' : ''} • {isCorporate ? 'Corporate' : 'Company'}
          </div>
        </div>
        <button onClick={logout} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid rgba(255,255,255,.2)', cursor: 'pointer', background: 'transparent', color: 'rgba(255,255,255,.6)', fontSize: 11, fontWeight: 600 }} onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,.1)'; e.currentTarget.style.color = '#fff'; }} onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,.6)'; }}>
          Log Out
        </button>
      </div>
    </div>
  );
}
