'use client';
import { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { useQuote } from './QuoteProvider';
import { usePathname, useRouter } from 'next/navigation';

const ROLES = { salesperson: 'Sales Rep', reviewer: 'Reviewer', manager: 'Manager', supervisor: 'Executive', it: 'IT Admin' };
const NAV = [
  { id: '/builder', l: 'Builder' },
  { id: '/pdf', l: 'PDF' },
  { id: '/margin', l: 'Margin' },
  { id: '/quotes', l: 'Quotes' },
];

export default function NavBar() {
  const { user, logout, canAdmin } = useAuth();
  const { navLogo, navColor, appName } = useQuote();
  const path = usePathname();
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState(0);

  // Fetch pending quote count for notification badge
  useEffect(() => {
    if (!user) return;
    const fetchPending = () => {
      fetch('/api/quotes').then(r => r.ok ? r.json() : { quotes: [] }).then(d => {
        const quotes = d.quotes || [];
        let count = 0;
        if (user.role === 'reviewer') count = quotes.filter(q => q.status === 'submitted' && q.reviewerId === user.id).length;
        else if (user.role === 'manager') count = quotes.filter(q => q.status === 'reviewed' && q.managerId === user.id).length;
        else if (user.role === 'salesperson') count = quotes.filter(q => q.status === 'info_requested' && q.createdById === user.id).length;
        setPendingCount(count);
      }).catch(() => {});
    };
    fetchPending();
    const interval = setInterval(fetchPending, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [user]);

  if (!user) return null;
  const isCorporate = user.role === 'supervisor' || (user.role === 'it' && !user.primaryCompanyId) || (user.isAdmin && !user.primaryCompanyId);
  const bg = navColor || '#002a3e';
  const label = appName || 'QUOTECRAFT';
  return (
    <div className="no-print" style={{ background: bg, padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56, position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 8px rgba(0,0,0,.2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {navLogo ? <img src={navLogo} style={{ height: 28, objectFit: 'contain' }} alt="Logo" /> : <span style={{ fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: '.05em', fontStyle: 'italic' }}>MIDDLEBY</span>}
        <span style={{ fontSize: 8, color: 'rgba(255,255,255,.4)', background: 'rgba(255,255,255,.08)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
        {NAV.map(n => (
          <button key={n.id} onClick={() => router.push(n.id)} style={{ padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: path === n.id ? '#fff' : 'transparent', color: path === n.id ? bg : 'rgba(255,255,255,.6)', position: 'relative' }}>
            {n.l}
            {n.id === '/quotes' && pendingCount > 0 && <span style={{ position: 'absolute', top: -4, right: -4, background: '#E12C3E', color: '#fff', fontSize: 9, fontWeight: 800, width: 18, height: 18, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{pendingCount}</span>}
          </button>
        ))}
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
