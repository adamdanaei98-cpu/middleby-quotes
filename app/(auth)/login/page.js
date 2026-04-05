// app/(auth)/login/page.js
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const DEMO_ACCOUNTS = [
  { name: 'John Smith', email: 'jsmith@middleby.com', password: 'sales123', role: 'Salesperson' },
  { name: 'Sarah Johnson', email: 'sjohnson@middleby.com', password: 'review123', role: 'Reviewer' },
  { name: 'Mike Chen', email: 'mchen@middleby.com', password: 'manager123', role: 'Manager' },
  { name: 'Lisa Rodriguez', email: 'lrodriguez@middleby.com', password: 'super123', role: 'Supervisor' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      router.push('/builder');
      router.refresh();
    } catch {
      setError('Network error');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #002a3e 0%, #003250 50%, #001a2e 100%)',
    }}>
      <div style={{
        width: 420,
        background: '#fff',
        borderRadius: 16,
        padding: 40,
        boxShadow: '0 20px 60px rgba(0,0,0,.3)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#003250', letterSpacing: '.04em' }}>
            MIDDLEBY
          </div>
          <div style={{ fontSize: 12, color: '#8b919e', marginTop: 4 }}>
            Food Processing • Quote Management System
          </div>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#8b919e', display: 'block', marginBottom: 4 }}>
              EMAIL OR NAME
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. jsmith@middleby.com"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid #e2e4e9',
                fontSize: 14,
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#8b919e', display: 'block', marginBottom: 4 }}>
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                border: `1px solid ${error ? '#dc2626' : '#e2e4e9'}`,
                fontSize: 14,
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          {error && (
            <div style={{
              fontSize: 12,
              color: '#dc2626',
              marginBottom: 16,
              textAlign: 'center',
              fontWeight: 600,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: 14,
              background: loading ? '#666' : '#003250',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? 'default' : 'pointer',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{
          marginTop: 24,
          paddingTop: 16,
          borderTop: '1px solid #e2e4e9',
        }}>
          <div style={{
            fontSize: 10,
            fontWeight: 700,
            color: '#8b919e',
            marginBottom: 8,
            textAlign: 'center',
          }}>
            DEMO ACCOUNTS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {DEMO_ACCOUNTS.map((a) => (
              <div
                key={a.email}
                onClick={() => { setEmail(a.email); setPassword(a.password); setError(''); }}
                style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: '1px solid #e2e4e9',
                  cursor: 'pointer',
                  fontSize: 10,
                  lineHeight: 1.4,
                  transition: 'background .15s',
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#f8f9fb'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ fontWeight: 700, color: '#003250' }}>{a.name}</div>
                <div style={{ color: '#8b919e' }}>{a.role}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
