// app/(dashboard)/builder/page.js
'use client';
import { useAuth } from '@/components/AuthProvider';
import { useState, useEffect } from 'react';

export default function BuilderPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [custRes, catRes] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/catalog'),
      ]);
      const custData = await custRes.json();
      const catData = await catRes.json();
      setCustomers(custData.customers || []);
      setCatalog(catData.companies || []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 56px)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#003250', marginBottom: 8 }}>Loading...</div>
          <div style={{ fontSize: 12, color: '#8b919e' }}>Fetching catalog and customer data</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1320, margin: '0 auto', padding: 20 }}>
      <div style={{ display: 'flex', gap: 20 }}>
        {/* Left sidebar */}
        <div style={{ width: 280, flexShrink: 0 }}>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            border: '1px solid #e2e4e9',
            padding: 16,
            position: 'sticky',
            top: 76,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#003250', letterSpacing: '.06em', marginBottom: 10 }}>
              PROJECT DETAILS
            </div>

            {/* Customer dropdown */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#8b919e', marginBottom: 3 }}>CUSTOMER</div>
              <select style={{
                width: '100%', padding: '6px 10px', borderRadius: 6,
                border: '1px solid #e2e4e9', fontSize: 11, boxSizing: 'border-box',
              }}>
                <option value="">Select customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.plant ? ` — ${c.plant}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ fontSize: 14, fontWeight: 800, color: '#003250', borderTop: '2px solid #003250', marginTop: 12, paddingTop: 8 }}>
              Total: $0
            </div>
          </div>
        </div>

        {/* Main area */}
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#003250' }}>Quote Builder</h2>
            <p style={{ fontSize: 12, color: '#8b919e' }}>
              Welcome, {user.name}. {catalog.length} companies loaded with catalog data.
            </p>
          </div>

          {catalog.map((company) => (
            <div key={company.id} style={{
              background: '#fff',
              borderRadius: 12,
              border: `2px solid ${company.color}`,
              marginBottom: 16,
              overflow: 'hidden',
            }}>
              <div style={{
                background: company.color,
                padding: '12px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{company.name}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,.7)' }}>{company.description}</div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>
                  {company.catalogSections?.length || 0} sections
                </div>
              </div>

              {company.catalogSections?.map((section) => (
                <div key={section.id} style={{ borderTop: '1px solid #e2e4e9' }}>
                  <div style={{ padding: '8px 16px', fontSize: 12, fontWeight: 600, color: company.color }}>
                    {section.name} ({section.items?.length || 0} items)
                  </div>
                  {section.items?.map((item) => (
                    <div key={item.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '6px 16px 6px 32px',
                      borderTop: '1px solid #f3f4f6',
                      gap: 12,
                    }}>
                      <input type="checkbox" style={{ accentColor: company.color }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 500 }}>{item.name}</div>
                        {item.description && (
                          <div style={{ fontSize: 10, color: '#8b919e' }}>{item.description}</div>
                        )}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: company.color }}>
                        ${Math.round(item.fixedPrice).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
