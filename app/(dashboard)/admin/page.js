// app/(dashboard)/admin/page.js
'use client';
import { useAuth } from '@/components/AuthProvider';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { dbToPrototypeCatalog, fP, C, ROLES } from '@/lib/transform';

export default function AdminPage() {
  const { user, canAdmin } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState('catalog');
  const [companies, setCompanies] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!canAdmin) { router.push('/builder'); return; }
    async function load() {
      const [catRes, custRes] = await Promise.all([fetch('/api/catalog'), fetch('/api/customers')]);
      const catData = await catRes.json();
      const custData = await custRes.json();
      setCompanies(catData.companies || []);
      setCustomers(custData.customers || []);
      setLoading(false);
    }
    load();
  }, [canAdmin, router]);

  if (!canAdmin || loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 56px)' }}><div style={{ fontSize: 16, color: C.muted }}>Loading...</div></div>;

  const TB = ({ id, l }) => <button onClick={() => setTab(id)} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, background: tab === id ? C.navy : 'transparent', color: tab === id ? '#fff' : C.muted }}>{l}</button>;

  return (
    <div style={{ maxWidth: 1320, margin: '0 auto', padding: 20 }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 2, background: '#fff', padding: 4, borderRadius: 10, border: '1px solid ' + C.border }}>
          <TB id="catalog" l="Catalog" />
          <TB id="companies" l="Companies" />
          <TB id="customers" l="Customers" />
        </div>
      </div>

      {tab === 'catalog' && (
        <div>
          {companies.map(co => (
            <div key={co.id} style={{ marginBottom: 20 }}>
              <div style={{ background: co.color, padding: '12px 20px', borderRadius: '10px 10px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{co.name}</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,.7)' }}>{co.description}</div></div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>{co.catalogSections?.length || 0} sections</div>
              </div>
              {(co.catalogSections || []).map(sec => (
                <div key={sec.id} style={{ border: '1px solid ' + C.border, borderTop: 'none', background: '#fff' }}>
                  <div style={{ padding: '8px 16px', fontSize: 12, fontWeight: 700, color: co.color, borderBottom: '1px solid #f3f4f6' }}>{sec.name} ({sec.items?.length || 0} items)</div>
                  {(sec.items || []).map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 16px 6px 32px', borderTop: '1px solid #f8f9fb', fontSize: 12 }}>
                      <div>
                        <span style={{ fontWeight: 500 }}>{item.name}</span>
                        {item.description && <span style={{ color: C.muted, fontSize: 10, marginLeft: 8 }}>{item.description}</span>}
                      </div>
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

      {tab === 'companies' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {companies.map(co => (
            <div key={co.id} style={{ background: '#fff', borderRadius: 12, border: '2px solid ' + co.color, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: co.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#fff' }}>{co.name[0]}</div>
                <div><div style={{ fontSize: 15, fontWeight: 700, color: co.color }}>{co.name}</div><div style={{ fontSize: 10, color: C.muted }}>{co.description}</div></div>
              </div>
              <div style={{ fontSize: 11, color: '#555', lineHeight: 1.5, marginBottom: 8 }}>{co.execSummary || 'No executive summary set.'}</div>
              <div style={{ fontSize: 10, color: C.muted }}>Key: {co.key} • Color: {co.color}</div>
              {co.rates && <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>Labor Rate: ${co.rates.laborRate}/hr • Markup: {co.rates.markup}%</div>}
            </div>
          ))}
        </div>
      )}

      {tab === 'customers' && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid ' + C.border, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid ' + C.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.navy }}>Customers ({customers.length})</div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead><tr style={{ background: '#f8f9fb' }}>
              {['Name', 'Plant', 'Contact', 'Email', 'Phone', 'Rep', 'Industry'].map(h => <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 9, fontWeight: 700, color: C.muted, borderBottom: '1px solid ' + C.border }}>{h.toUpperCase()}</th>)}
            </tr></thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '8px 14px', fontWeight: 600, color: C.navy }}>{c.name}</td>
                  <td style={{ padding: '8px 14px', color: '#555' }}>{c.plant || '—'}</td>
                  <td style={{ padding: '8px 14px' }}>{c.contact || '—'}</td>
                  <td style={{ padding: '8px 14px', color: C.muted }}>{c.email || '—'}</td>
                  <td style={{ padding: '8px 14px', color: C.muted }}>{c.phone || '—'}</td>
                  <td style={{ padding: '8px 14px' }}>{c.rep || '—'}</td>
                  <td style={{ padding: '8px 14px', color: C.muted }}>{c.industry || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
