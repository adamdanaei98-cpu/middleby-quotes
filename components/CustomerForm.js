// components/CustomerForm.js
'use client';
import { useState, useEffect } from 'react';

const C = { navy: '#003250', blue: '#0074BB', red: '#E12C3E', muted: '#8b919e', border: '#e2e4e9', green: '#16a34a' };
const iS = { width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #e2e4e9', fontSize: 11, boxSizing: 'border-box' };
const lS = { fontSize: 9, fontWeight: 700, color: '#8b919e', marginBottom: 3, letterSpacing: '.05em' };
const secH = { fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 6, paddingBottom: 4, borderBottom: '1px solid ' + C.navy + '40' };

export default function CustomerForm({ form, setForm, companies, allCustomers, onSave, onCancel, isNew }) {
  const [custMode, setCustMode] = useState(isNew ? 'new' : 'existing');
  const [fullCustomers, setFullCustomers] = useState([]);
  const [loadingFull, setLoadingFull] = useState(false);

  // Load full customer data (with contacts, plants, equipment) on mount
  useEffect(() => {
    setLoadingFull(true);
    fetch('/api/field-map/customers').then(r => r.json()).then(d => {
      setFullCustomers(d.customers || []);
      setLoadingFull(false);
    }).catch(() => setLoadingFull(false));
  }, []);

  const geocode = async (addr) => {
    try {
      const r = await fetch('/api/field-map/geocode', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address: addr }) });
      return r.ok ? r.json() : null;
    } catch { return null; }
  };

  // When selecting an existing customer, load their full data
  const selectExistingCustomer = (custId) => {
    if (!custId || custId === '__new__') { setCustMode('new'); setForm({ name: '', equipment: [], contacts: [], plants: [], keywords: [] }); return; }
    setCustMode('existing');
    const full = fullCustomers.find(c => c.id === custId);
    if (full) {
      setForm({
        ...full,
        keywords: full.keywords || [],
        contacts: full.contacts || [],
        plants: full.plants || [],
        equipment: (full.equipment || []).map(e => ({ ...e, companyId: e.companyId || e.company?.id || null })),
      });
    }
  };

  // Use fullCustomers if loaded, otherwise fall back to allCustomers
  const custList = fullCustomers.length > 0 ? fullCustomers : allCustomers;
  const uniqueCustomers = [...new Map(custList.map(c => [c.id, c])).values()].sort((a, b) => a.name.localeCompare(b.name));
  const allPlantNames = [...new Set(custList.flatMap(c => [c.plant, ...(c.plants || []).map(p => p.name)]).filter(Boolean))].sort();

  return (
    <div>
      {/* ── CUSTOMER DETAILS ── */}
      <div style={secH}>CUSTOMER DETAILS</div>

      {/* Customer selector - like catalog section dropdown */}
      <div style={{ marginBottom: 10 }}>
        <div style={lS}>CUSTOMER</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            value={form.id || '__new__'}
            onChange={e => selectExistingCustomer(e.target.value)}
            style={{ ...iS, flex: 1 }}
          >
            <option value="__new__">+ New Customer</option>
            {uniqueCustomers.map(c => <option key={c.id} value={c.id}>{c.name}{c.city ? ' — ' + c.city + (c.state ? ', ' + c.state : '') : ''}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
        <div><div style={lS}>CUSTOMER NAME *</div><input value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Hormel Foods" style={iS} /></div>
        <div><div style={lS}>INDUSTRY / CONCEPT</div><input value={form.concept || ''} onChange={e => setForm(p => ({ ...p, concept: e.target.value }))} placeholder="Meat Processing" style={iS} /></div>
        <div><div style={lS}>STATUS</div><select value={form.active === false ? 'inactive' : 'active'} onChange={e => setForm(p => ({ ...p, active: e.target.value === 'active' }))} style={iS}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
      </div>

      {/* ── PLANTS / LOCATIONS ── */}
      <div style={{ ...secH, display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
        <span>PLANTS / LOCATIONS</span>
        <button onClick={() => setForm(p => ({ ...p, plants: [...(p.plants || []), { name: '', address: '', city: '', state: '', country: '', lat: '', lng: '' }] }))} style={{ padding: '2px 8px', borderRadius: 4, border: '1px dashed ' + C.navy, background: 'none', color: C.navy, fontSize: 9, fontWeight: 600, cursor: 'pointer' }}>+ Add Plant</button>
      </div>

      {/* Main address */}
      <div style={{ background: '#f8f9fb', borderRadius: 8, padding: 10, marginBottom: 6, border: '1px solid #eef0f2' }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: C.muted, marginBottom: 4 }}>Main Address (HQ)</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          <input value={form.address || ''} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="Street address" style={{ ...iS, flex: 1 }} />
          <button onClick={async () => { const a = [form.address, form.city, form.state, form.country].filter(Boolean).join(', '); if (!a) return; const r = await geocode(a); if (r) setForm(p => ({ ...p, lat: r.lat, lng: r.lng })); else alert('Not found'); }} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid ' + C.navy, background: 'none', color: C.navy, fontSize: 9, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>📍 Lookup</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 6 }}>
          <div><div style={lS}>CITY</div><input value={form.city || ''} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} style={iS} /></div>
          <div><div style={lS}>STATE</div><input value={form.state || ''} onChange={e => setForm(p => ({ ...p, state: e.target.value }))} style={iS} /></div>
          <div><div style={lS}>COUNTRY</div><input value={form.country || ''} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} style={iS} /></div>
          <div><div style={lS}>LAT</div><input type="number" step="any" value={form.lat || ''} onChange={e => setForm(p => ({ ...p, lat: e.target.value }))} style={iS} /></div>
          <div><div style={lS}>LNG</div><input type="number" step="any" value={form.lng || ''} onChange={e => setForm(p => ({ ...p, lng: e.target.value }))} style={iS} /></div>
        </div>
      </div>

      {/* Sub-plants */}
      {(form.plants || []).map((pl, i) => (
        <div key={i} style={{ background: '#f8f9fb', borderRadius: 8, padding: 10, marginBottom: 4, border: '1px solid #eef0f2', position: 'relative' }}>
          <button onClick={() => { const pls = [...(form.plants || [])]; pls.splice(i, 1); setForm(p => ({ ...p, plants: pls })); }} style={{ position: 'absolute', top: 6, right: 8, border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 14 }}>x</button>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 2.5fr auto', gap: 6, marginBottom: 4 }}>
            <div><div style={lS}>PLANT NAME</div>
              <select value={pl.name && allPlantNames.includes(pl.name) ? pl.name : pl.name ? '__custom__' : ''} onChange={e => {
                const val = e.target.value;
                const pls = [...(form.plants || [])];
                if (val === '__custom__' || val === '') { pls[i] = { ...pls[i], name: '' }; }
                else {
                  pls[i] = { ...pls[i], name: val };
                  // Auto-fill from existing plant data
                  const existing = custList.flatMap(c => (c.plants || []).filter(p => p.name === val));
                  if (existing.length > 0 && !pls[i].address) {
                    pls[i] = { ...pls[i], address: existing[0].address || '', city: existing[0].city || '', state: existing[0].state || '', country: existing[0].country || '', lat: existing[0].lat || '', lng: existing[0].lng || '' };
                  }
                }
                setForm(p => ({ ...p, plants: pls }));
              }} style={iS}>
                <option value="">Select plant...</option>
                {allPlantNames.map(n => <option key={n} value={n}>{n}</option>)}
                <option value="__custom__">+ New Plant</option>
              </select>
              {(pl.name === '' || !allPlantNames.includes(pl.name)) && <input value={pl.name || ''} onChange={e => { const pls = [...(form.plants || [])]; pls[i] = { ...pls[i], name: e.target.value }; setForm(p => ({ ...p, plants: pls })); }} placeholder="Type new plant name..." style={{ ...iS, marginTop: 4 }} />}
            </div>
            <div><div style={lS}>ADDRESS</div><input value={pl.address || ''} onChange={e => { const pls = [...(form.plants || [])]; pls[i] = { ...pls[i], address: e.target.value }; setForm(p => ({ ...p, plants: pls })); }} style={iS} /></div>
            <div style={{ alignSelf: 'flex-end' }}><button onClick={async () => { const a = [pl.address, pl.city, pl.state, pl.country].filter(Boolean).join(', '); if (!a) return; const r = await geocode(a); if (r) { const pls = [...(form.plants || [])]; pls[i] = { ...pls[i], lat: r.lat, lng: r.lng }; setForm(p => ({ ...p, plants: pls })); } else alert('Not found'); }} style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid ' + C.navy, background: 'none', color: C.navy, fontSize: 9, fontWeight: 600, cursor: 'pointer' }}>📍</button></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 6 }}>
            <div><div style={lS}>CITY</div><input value={pl.city || ''} onChange={e => { const pls = [...(form.plants || [])]; pls[i] = { ...pls[i], city: e.target.value }; setForm(p => ({ ...p, plants: pls })); }} style={iS} /></div>
            <div><div style={lS}>STATE</div><input value={pl.state || ''} onChange={e => { const pls = [...(form.plants || [])]; pls[i] = { ...pls[i], state: e.target.value }; setForm(p => ({ ...p, plants: pls })); }} style={iS} /></div>
            <div><div style={lS}>COUNTRY</div><input value={pl.country || ''} onChange={e => { const pls = [...(form.plants || [])]; pls[i] = { ...pls[i], country: e.target.value }; setForm(p => ({ ...p, plants: pls })); }} style={iS} /></div>
            <div><div style={lS}>LAT</div><input type="number" step="any" value={pl.lat || ''} onChange={e => { const pls = [...(form.plants || [])]; pls[i] = { ...pls[i], lat: e.target.value }; setForm(p => ({ ...p, plants: pls })); }} style={iS} /></div>
            <div><div style={lS}>LNG</div><input type="number" step="any" value={pl.lng || ''} onChange={e => { const pls = [...(form.plants || [])]; pls[i] = { ...pls[i], lng: e.target.value }; setForm(p => ({ ...p, plants: pls })); }} style={iS} /></div>
          </div>
        </div>
      ))}

      {/* ── CONTACTS ── */}
      <div style={{ ...secH, display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
        <span>CONTACTS</span>
        <button onClick={() => setForm(p => ({ ...p, contacts: [...(p.contacts || []), { name: '', role: '', email: '', phone: '', isPrimary: false }] }))} style={{ padding: '2px 8px', borderRadius: 4, border: '1px dashed ' + C.navy, background: 'none', color: C.navy, fontSize: 9, fontWeight: 600, cursor: 'pointer' }}>+ Add Contact</button>
      </div>
      {(form.contacts || []).length === 0 && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 8 }}>
        <div><div style={lS}>CONTACT</div><input value={form.contact || ''} onChange={e => setForm(p => ({ ...p, contact: e.target.value }))} style={iS} /></div>
        <div><div style={lS}>EMAIL</div><input value={form.email || ''} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} style={iS} /></div>
        <div><div style={lS}>PHONE</div><input value={form.phone || ''} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} style={iS} /></div>
      </div>}
      {(form.contacts || []).map((ct, i) => (
        <div key={i} style={{ background: '#f8f9fb', borderRadius: 8, padding: 10, marginBottom: 4, border: '1px solid #eef0f2', position: 'relative' }}>
          <button onClick={() => { const cts = [...(form.contacts || [])]; cts.splice(i, 1); setForm(p => ({ ...p, contacts: cts })); }} style={{ position: 'absolute', top: 6, right: 8, border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 14 }}>x</button>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1.5fr 1fr', gap: 6 }}>
            <div><div style={lS}>NAME</div><input value={ct.name || ''} onChange={e => { const cts = [...(form.contacts || [])]; cts[i] = { ...cts[i], name: e.target.value }; setForm(p => ({ ...p, contacts: cts })); }} style={iS} /></div>
            <div><div style={lS}>ROLE / TITLE</div><input value={ct.role || ''} onChange={e => { const cts = [...(form.contacts || [])]; cts[i] = { ...cts[i], role: e.target.value }; setForm(p => ({ ...p, contacts: cts })); }} placeholder="Plant Manager" style={iS} /></div>
            <div><div style={lS}>EMAIL</div><input value={ct.email || ''} onChange={e => { const cts = [...(form.contacts || [])]; cts[i] = { ...cts[i], email: e.target.value }; setForm(p => ({ ...p, contacts: cts })); }} style={iS} /></div>
            <div><div style={lS}>PHONE</div><input value={ct.phone || ''} onChange={e => { const cts = [...(form.contacts || [])]; cts[i] = { ...cts[i], phone: e.target.value }; setForm(p => ({ ...p, contacts: cts })); }} style={iS} /></div>
          </div>
          <label style={{ fontSize: 9, display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, color: C.muted }}><input type="checkbox" checked={ct.isPrimary || false} onChange={e => { const cts = [...(form.contacts || [])]; cts[i] = { ...cts[i], isPrimary: e.target.checked }; setForm(p => ({ ...p, contacts: cts })); }} /> Primary contact</label>
        </div>
      ))}

      {/* ── INSTALLED EQUIPMENT ── */}
      <div style={{ ...secH, display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
        <span>INSTALLED EQUIPMENT</span>
        <button onClick={() => setForm(p => ({ ...p, equipment: [...(p.equipment || []), { model: '', serial: '', year: '', status: 'active', companyId: '', notes: '' }] }))} style={{ padding: '2px 8px', borderRadius: 4, border: '1px dashed ' + C.navy, background: 'none', color: C.navy, fontSize: 9, fontWeight: 600, cursor: 'pointer' }}>+ Add Equipment</button>
      </div>
      {(form.equipment || []).map((eq, i) => (
        <div key={i} style={{ background: '#f8f9fb', borderRadius: 8, padding: 10, marginBottom: 4, border: '1px solid #eef0f2', position: 'relative' }}>
          <button onClick={() => { const eqs = [...(form.equipment || [])]; eqs.splice(i, 1); setForm(p => ({ ...p, equipment: eqs })); }} style={{ position: 'absolute', top: 6, right: 8, border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 14 }}>x</button>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 1fr 0.6fr 0.8fr', gap: 6 }}>
            <div><div style={lS}>BRAND</div><select value={eq.companyId || ''} onChange={e => { const eqs = [...(form.equipment || [])]; eqs[i] = { ...eqs[i], companyId: e.target.value || null }; setForm(p => ({ ...p, equipment: eqs })); }} style={iS}><option value="">Select...</option>{companies.map(co => <option key={co.id} value={co.id}>{co.name}</option>)}</select></div>
            <div><div style={lS}>MODEL</div><input value={eq.model || ''} onChange={e => { const eqs = [...(form.equipment || [])]; eqs[i] = { ...eqs[i], model: e.target.value }; setForm(p => ({ ...p, equipment: eqs })); }} placeholder="e.g. VP125" style={iS} /></div>
            <div><div style={lS}>SERIAL #</div><input value={eq.serial || ''} onChange={e => { const eqs = [...(form.equipment || [])]; eqs[i] = { ...eqs[i], serial: e.target.value }; setForm(p => ({ ...p, equipment: eqs })); }} style={iS} /></div>
            <div><div style={lS}>YEAR</div><input type="number" value={eq.year || ''} onChange={e => { const eqs = [...(form.equipment || [])]; eqs[i] = { ...eqs[i], year: e.target.value }; setForm(p => ({ ...p, equipment: eqs })); }} style={iS} /></div>
            <div><div style={lS}>STATUS</div><select value={eq.status || 'active'} onChange={e => { const eqs = [...(form.equipment || [])]; eqs[i] = { ...eqs[i], status: e.target.value }; setForm(p => ({ ...p, equipment: eqs })); }} style={iS}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
          </div>
          <div style={{ marginTop: 4 }}><div style={lS}>EQUIPMENT NOTES</div><input value={eq.notes || ''} onChange={e => { const eqs = [...(form.equipment || [])]; eqs[i] = { ...eqs[i], notes: e.target.value }; setForm(p => ({ ...p, equipment: eqs })); }} placeholder="Notes..." style={iS} /></div>
        </div>
      ))}

      {/* ── KEYWORDS & NOTES ── */}
      <div style={{ ...secH, marginTop: 16 }}>KEYWORDS & NOTES</div>
      <div style={{ marginBottom: 8 }}><div style={lS}>KEYWORDS</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '6px 8px', border: '1px solid #e2e4e9', borderRadius: 6, minHeight: 34, alignItems: 'center' }}>
          {(form.keywords || []).map((kw, i) => <span key={i} style={{ fontSize: 10, background: '#e0e7ff', color: '#3b5998', padding: '2px 8px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4 }}>{kw}<button onClick={() => setForm(p => ({ ...p, keywords: (p.keywords || []).filter((_, j) => j !== i) }))} style={{ border: 'none', background: 'none', color: '#3b5998', cursor: 'pointer', fontSize: 12, padding: 0 }}>x</button></span>)}
          <input placeholder="Type & press Enter..." onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); e.stopPropagation(); const v = e.target.value.trim(); if (v) { setForm(p => ({ ...p, keywords: [...(p.keywords || []), v] })); e.target.value = ''; } } }} style={{ border: 'none', outline: 'none', fontSize: 11, flex: 1, minWidth: 100, padding: '2px 0' }} />
        </div>
      </div>
      <div style={{ marginBottom: 12 }}><div style={lS}>NOTES</div><textarea value={form.notes || ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} placeholder="Account notes..." style={{ ...iS, fontFamily: 'inherit', resize: 'vertical' }} /></div>

      {/* Save / Cancel */}
      <div style={{ display: 'flex', gap: 8, marginTop: 16, paddingTop: 12, borderTop: '1px solid #e2e4e9' }}>
        <button onClick={onSave} style={{ flex: 1, padding: 10, background: C.navy, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{isNew && !form.id ? 'Add Customer' : 'Save Changes'}</button>
        <button onClick={onCancel} style={{ padding: '10px 20px', background: '#f3f4f6', color: '#8b919e', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
      </div>
    </div>
  );
}
