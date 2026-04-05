// app/(dashboard)/admin/page.js
'use client';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminPage() {
  const { user, canAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!canAdmin) router.push('/builder');
  }, [canAdmin, router]);

  if (!canAdmin) return null;

  return (
    <div style={{ maxWidth: 1320, margin: '0 auto', padding: 20 }}>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: '#003250', marginBottom: 8 }}>Admin Panel</h2>
      <p style={{ fontSize: 12, color: '#8b919e', marginBottom: 20 }}>
        Company profiles, catalog management, rates, terms, and user management will be migrated here.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
        {['Company Profiles', 'Rates', 'Catalog', 'Terms & Conditions', 'Users & Accounts', 'Customers'].map((section) => (
          <div key={section} style={{
            background: '#fff',
            borderRadius: 12,
            border: '1px solid #e2e4e9',
            padding: 24,
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#003250', marginBottom: 4 }}>{section}</div>
            <div style={{ fontSize: 11, color: '#8b919e' }}>Coming from prototype migration</div>
          </div>
        ))}
      </div>
    </div>
  );
}
