'use client';
import { useAuth } from './AuthProvider';
import { useQuote } from './QuoteProvider';
import { usePathname, useRouter } from 'next/navigation';

const ROLES = { salesperson: 'Sales Rep', reviewer: 'Reviewer', manager: 'Manager', supervisor: 'Executive', it: 'IT Admin' };
const NAV = [
  { id: '/builder', l: 'Builder' },
  { id: '/pdf', l: 'PDF Preview', parent: '/builder' },
  { id: '/margin', l: 'Margin Preview', parent: '/builder' },
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
  const isBuilderArea = path === '/builder' || path === '/pdf' || path === '/margin';
  return (
    <div className="no-print" style={{ background: bg, padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56, position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 8px rgba(0,0,0,.2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {navLogo ? <img src={navLogo} style={{ height: 28, objectFit: 'contain' }} alt="Logo" /> : <span style={{ fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: '.05em', fontStyle: 'italic' }}>MIDDLEBY</span>}
        <span style={{ fontSize: 8, color: 'rgba(255,255,255,.4)', background: 'rgba(255,255,255,.08)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
        {NAV.map(n => {
          // Hide sub-tabs when not in builder area
          if (n.parent && !isBuilderArea) return null;
          const isActive = path === n.id;
          const isSub = !!n.parent;
          return (
            <button key={n.id} onClick={() => router.push(n.id)} style={{ padding: isSub ? '5px 12px' : '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: isSub ? 10 : 12, fontWeight: 600, background: isActive ? '#fff' : 'transparent', color: isActive ? bg : isSub ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.6)', marginLeft: isSub && n.id === '/pdf' ? 4 : 0 }}>{n.l}</button>
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
