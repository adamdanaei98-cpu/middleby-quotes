// components/NavBar.js
'use client';
import { useAuth } from './AuthProvider';
import { usePathname, useRouter } from 'next/navigation';

const ROLES = {
  salesperson: { label: 'Salesperson', level: 1 },
  reviewer: { label: 'Reviewer', level: 2 },
  manager: { label: 'Manager', level: 3 },
  supervisor: { label: 'Supervisor', level: 4 },
};

const NAV_ITEMS = [
  { id: '/builder', label: 'Builder' },
  { id: '/margin', label: 'Margin' },
  { id: '/pdf', label: 'PDF' },
];

export default function NavBar() {
  const { user, logout, canAdmin } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (!user) return null;

  return (
    <div
      className="no-print"
      style={{
        background: '#002a3e',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 56,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 8px rgba(0,0,0,.2)',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{
          fontSize: 17,
          fontWeight: 800,
          color: '#fff',
          letterSpacing: '.05em',
          fontStyle: 'italic',
        }}>
          MIDDLEBY
        </span>
        <span style={{
          fontSize: 8,
          color: 'rgba(255,255,255,.4)',
          background: 'rgba(255,255,255,.08)',
          padding: '2px 8px',
          borderRadius: 4,
          fontWeight: 600,
        }}>
          QUOTECRAFT
        </span>
      </div>

      {/* Main nav */}
      <div style={{ display: 'flex', gap: 2 }}>
        {NAV_ITEMS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => router.push(id)}
            style={{
              padding: '6px 16px',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              background: pathname === id ? '#fff' : 'transparent',
              color: pathname === id ? '#003250' : 'rgba(255,255,255,.6)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {canAdmin && (
          <button
            onClick={() => router.push('/admin')}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: pathname === '/admin' ? '2px solid #fff' : '2px solid rgba(255,255,255,.25)',
              cursor: 'pointer',
              background: pathname === '/admin' ? '#fff' : 'transparent',
              color: pathname === '/admin' ? '#003250' : 'rgba(255,255,255,.7)',
              fontSize: 11,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            ⚙ Admin
          </button>
        )}

        <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,.2)' }} />

        <div style={{ textAlign: 'right', marginRight: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>{user.name}</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,.5)' }}>
            {ROLES[user.role]?.label}
          </div>
        </div>

        <button
          onClick={logout}
          title="Logout"
          style={{
            padding: '4px 8px',
            borderRadius: 5,
            border: 'none',
            cursor: 'pointer',
            background: 'rgba(255,255,255,.1)',
            color: 'rgba(255,255,255,.5)',
            fontSize: 10,
            fontWeight: 600,
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
