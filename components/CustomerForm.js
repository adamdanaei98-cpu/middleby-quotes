// components/CustomerForm.js
'use client';
import { useState, useEffect } from 'react';

const C = { navy: '#003250', muted: '#8b919e', border: '#e2e4e9', green: '#16a34a' };
const iS = { width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #e2e4e9', fontSize: 11, boxSizing: 'border-box' };
const lS = { fontSize: 9, fontWeight: 700, color: '#8b919e', marginBottom: 3, letterSpacing: '.05em' };
const secH = { fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 6, paddingBottom: 4, borderBottom: '1px solid ' + C.navy + '40' };

export default function CustomerForm({ form, setForm, companies, allCustomers, onSave, onCancel, isNew }) {
  const [fullCustomers, setFullCustomers] = useState([]);

  useEffect(() => {
    fetch('/api/field-map/customers').then(r => r.json()).then(d => setFullCustomers(d.customers || [])).catch(() => {});
  }, []);

  const geocode = async (addr) => {
    try { const r = await fetch('/api/field-map/geocode', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address: addr }) }); return r.ok ? r.json() : null; } catch { return null; }
  };

  const selectExistingCustomer = (custId) => {
    if (!custId || custId === '__new__') { setForm({ name: '', equipment: [], contacts: [], plants: [], keywords: [] }); return; }
    const full = fullCustomers.find(c => c.id === custId);
    if (full) {
      setForm({
        ...full, keywords: full.keywords || [], contacts: full.contacts || [],
        plants: (full.plants || []).map(p => ({
          ...p, equipment: (p.equipment || []).map(e => ({ ...e, companyId: e.companyId || e.company?.id || null }))
        })),
        equipment: (full.equipment || []).map(e => ({ ...e, companyId: e.companyId || e.company?.id || null, plantId: e.plantId || e.plant?.id || null })),
      });
    }
  };

  const custList = fullCustomers.length > 0 ? fullCustomers : allCustomers;
  const uniqueCustomers = [...new Map(custList.map(c => [c.id, c])).values()].sort((a, b) => a.name.localeCompare(b.name));
  
  // Plant names scoped to currently selected customer only
  const currentCustPlants = form.id ? (fullCustomers.find(c => c.id === form.id)?.plants || []) : [];
  const currentPlantNames = currentCustPlants.map(p => p.name).filter(Boolean);

  // Equipment grouped by plant
  const addEquipToPlant = (plantIdx) => {
    const pls = [...(form.plants || [])];
    pls[plantIdx] = { ...pls[plantIdx], equipment: [...(pls[plantIdx].equipment || []), { model: '', serial: '', year: '', status: 'active', companyId: '', notes: '' }] };
    setForm(p => ({ ...p, plants: pls }));
  };
  const updateEquipInPlant = (plantIdx, eqIdx, field, value) => {
    const pls = [...(form.plants || [])];
    const eqs = [...(pls[plantIdx].equipment || [])];
    eqs[eqIdx] = { ...eqs[eqIdx], [field]: value };
    pls[plantIdx] = { ...pls[plantIdx], equipment: eqs };
    setForm(p => ({ ...p, plants: pls }));
  };
  const removeEquipFromPlant = (plantIdx, eqIdx) => {
    const pls = [...(form.plants || [])];
    const eqs = [...(pls[plantIdx].equipment || [])];
    eqs.splice(eqIdx, 1);
    pls[plantIdx] = { ...pls[plantIdx], equipment: eqs };
    setForm(p => ({ ...p, plants: pls }));
  };

  return (
    <div>
      {/* ── CUSTOMER (HQ) ── */}
      <div style={secH}>CUSTOMER (HQ)</div>
      <div style={{ marginBottom: 10 }}>
        <div style={lS}>SELECT EXISTING OR CREATE NEW</div>
        <select value={form.id || '__new__'} onChange={e => selectExistingCustomer(e.target.value)} style={{ ...iS }}>
          <option value="__new__">+ New Customer</option>
          {uniqueCustomers.map(c => <option key={c.id} value={c.id}>{c.name}{c.city ? ' — ' + c.city + (c.state ? ', ' + c.state : '') : ''}{(c.plants||[]).length > 0 ? ' (' + (c.plants||[]).length + ' plants)' : ''}</option>)}
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
        <div><div style={lS}>CUSTOMER NAME *</div><input value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Hormel Foods" style={iS} /></div>
        <div><div style={lS}>INDUSTRY / CONCEPT</div><input value={form.concept || ''} onChange={e => setForm(p => ({ ...p, concept: e.target.value }))} placeholder="Meat Processing" style={iS} /></div>
        <div><div style={lS}>STATUS</div><select value={form.active === false ? 'inactive' : 'active'} onChange={e => setForm(p => ({ ...p, active: e.target.value === 'active' }))} style={iS}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
      </div>

      {/* HQ Address */}
      <div style={{ background: '#f0f4f8', borderRadius: 8, padding: 12, marginBottom: 10, border: '1px solid #d0d9e4' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.navy, marginBottom: 6 }}>HQ ADDRESS</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          <input value={form.address || ''} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="HQ street address" style={{ ...iS, flex: 1 }} />
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

      {/* ── PLANTS ── */}
      <div style={{ ...secH, display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
        <span>PLANTS</span>
        <button onClick={() => setForm(p => ({ ...p, plants: [...(p.plants || []), { name: '', address: '', city: '', state: '', country: '', lat: '', lng: '', equipment: [] }] }))} style={{ padding: '2px 8px', borderRadius: 4, border: '1px dashed ' + C.navy, background: 'none', color: C.navy, fontSize: 9, fontWeight: 600, cursor: 'pointer' }}>+ Add Plant</button>
      </div>
      {(form.plants || []).length === 0 && <div style={{ fontSize: 10, color: C.muted, marginBottom: 10, fontStyle: 'italic', padding: '8px 12px', background: '#f8f9fb', borderRadius: 6 }}>No plants yet. Add a plant to assign equipment to it.</div>}

      {(form.plants || []).map((pl, pi) => (
        <div key={pi} style={{ border: '1px solid #d0d9e4', borderRadius: 10, marginBottom: 10, overflow: 'hidden' }}>
          {/* Plant header */}
          <div style={{ background: '#e8edf3', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 3, height: 18, borderRadius: 2, background: C.navy }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: C.navy }}>{pl.name || 'New Plant'}</span>
              {pl.city && <span style={{ fontSize: 9, color: C.muted }}>{pl.city}{pl.state ? ', ' + pl.state : ''}</span>}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => addEquipToPlant(pi)} style={{ padding: '2px 6px', borderRadius: 4, border: '1px solid ' + C.navy, background: 'none', color: C.navy, fontSize: 8, fontWeight: 600, cursor: 'pointer' }}>+ Equipment</button>
              <button onClick={() => { const pls = [...(form.plants || [])]; pls.splice(pi, 1); setForm(p => ({ ...p, plants: pls })); }} style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 14 }}>x</button>
            </div>
          </div>

          <div style={{ padding: 12 }}>
            {/* Plant location */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 2.5fr auto', gap: 6, marginBottom: 6 }}>
              <div><div style={lS}>PLANT NAME</div>
                <select value={pl.name && (currentPlantNames.includes(pl.name) || pl.name.includes('(HQ)')) ? pl.name : pl.name ? '__custom__' : ''} onChange={e => {
                  const val = e.target.value; const pls = [...(form.plants || [])];
                  if (val === '__hq__') {
                    pls[pi] = { ...pls[pi], name: (form.name || 'HQ') + ' (HQ)', address: form.address || '', city: form.city || '', state: form.state || '', country: form.country || '', lat: form.lat || '', lng: form.lng || '', equipment: pls[pi].equipment || [] };
                  } else if (val === '__custom__' || val === '') {
                    pls[pi] = { ...pls[pi], name: '' };
                  } else {
                    pls[pi] = { ...pls[pi], name: val };
                    const existing = currentCustPlants.find(p => p.name === val);
                    if (existing) { pls[pi] = { ...pls[pi], address: existing.address || '', city: existing.city || '', state: existing.state || '', country: existing.country || '', lat: existing.lat || '', lng: existing.lng || '', equipment: (existing.equipment || []).map(eq => ({ ...eq, companyId: eq.companyId || eq.company?.id || null })) }; }
                  }
                  setForm(p => ({ ...p, plants: pls }));
                }} style={iS}>
                  <option value="">Select plant...</option>
                  <option value="__hq__">\u{1F4CD} HQ (same as main address)</option>
                  {currentPlantNames.map(n => <option key={n} value={n}>{n}</option>)}
                  <option value="__custom__">+ New Plant</option>
                </select>
                {(!pl.name || (!currentPlantNames.includes(pl.name) && !pl.name.includes('(HQ)'))) && <input value={pl.name || ''} onChange={e => { const pls = [...(form.plants || [])]; pls[pi] = { ...pls[pi], name: e.target.value }; setForm(p => ({ ...p, plants: pls })); }} placeholder="New plant name..." style={{ ...iS, marginTop: 4 }} />}
              </div>
              <div><div style={lS}>ADDRESS</div><input value={pl.address || ''} onChange={e => { const pls = [...(form.plants || [])]; pls[pi] = { ...pls[pi], address: e.target.value }; setForm(p => ({ ...p, plants: pls })); }} style={iS} /></div>
              <div style={{ alignSelf: 'flex-end' }}><button onClick={async () => { const a = [pl.address, pl.city, pl.state, pl.country].filter(Boolean).join(', '); if (!a) return; const r = await geocode(a); if (r) { const pls = [...(form.plants || [])]; pls[pi] = { ...pls[pi], lat: r.lat, lng: r.lng }; setForm(p => ({ ...p, plants: pls })); } else alert('Not found'); }} style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid ' + C.navy, background: 'none', color: C.navy, fontSize: 9, fontWeight: 600, cursor: 'pointer' }}>📍</button></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 6, marginBottom: 10 }}>
              <div><div style={lS}>CITY</div><input value={pl.city || ''} onChange={e => { const pls = [...(form.plants || [])]; pls[pi] = { ...pls[pi], city: e.target.value }; setForm(p => ({ ...p, plants: pls })); }} style={iS} /></div>
              <div><div style={lS}>STATE</div><input value={pl.state || ''} onChange={e => { const pls = [...(form.plants || [])]; pls[pi] = { ...pls[pi], state: e.target.value }; setForm(p => ({ ...p, plants: pls })); }} style={iS} /></div>
              <div><div style={lS}>COUNTRY</div><input value={pl.country || ''} onChange={e => { const pls = [...(form.plants || [])]; pls[pi] = { ...pls[pi], country: e.target.value }; setForm(p => ({ ...p, plants: pls })); }} style={iS} /></div>
              <div><div style={lS}>LAT</div><input type="number" step="any" value={pl.lat || ''} onChange={e => { const pls = [...(form.plants || [])]; pls[pi] = { ...pls[pi], lat: e.target.value }; setForm(p => ({ ...p, plants: pls })); }} style={iS} /></div>
              <div><div style={lS}>LNG</div><input type="number" step="any" value={pl.lng || ''} onChange={e => { const pls = [...(form.plants || [])]; pls[pi] = { ...pls[pi], lng: e.target.value }; setForm(p => ({ ...p, plants: pls })); }} style={iS} /></div>
            </div>

            {/* Equipment in this plant */}
            {(pl.equipment || []).length > 0 && <div style={{ fontSize: 9, fontWeight: 700, color: C.muted, marginBottom: 4 }}>EQUIPMENT IN THIS PLANT</div>}
            {(pl.equipment || []).map((eq, ei) => (
              <div key={ei} style={{ background: '#f8f9fb', borderRadius: 6, padding: 8, marginBottom: 4, border: '1px solid #eef0f2', position: 'relative' }}>
                <button onClick={() => removeEquipFromPlant(pi, ei)} style={{ position: 'absolute', top: 4, right: 6, border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 12 }}>x</button>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 1fr 0.5fr 0.8fr', gap: 4 }}>
                  <div><div style={lS}>BRAND</div><select value={eq.companyId || ''} onChange={e => updateEquipInPlant(pi, ei, 'companyId', e.target.value || null)} style={iS}><option value="">Select...</option>{companies.map(co => <option key={co.id} value={co.id}>{co.name}</option>)}</select></div>
                  <div><div style={lS}>MODEL</div><input value={eq.model || ''} onChange={e => updateEquipInPlant(pi, ei, 'model', e.target.value)} placeholder="VP125" style={iS} /></div>
                  <div><div style={lS}>SERIAL #</div><input value={eq.serial || ''} onChange={e => updateEquipInPlant(pi, ei, 'serial', e.target.value)} style={iS} /></div>
                  <div><div style={lS}>YEAR</div><input type="number" value={eq.year || ''} onChange={e => updateEquipInPlant(pi, ei, 'year', e.target.value)} style={iS} /></div>
                  <div><div style={lS}>STATUS</div><select value={eq.status || 'active'} onChange={e => updateEquipInPlant(pi, ei, 'status', e.target.value)} style={iS}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* ── CONTACTS ── */}
      <div style={{ ...secH, display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
        <span>CONTACTS</span>
        <button onClick={() => setForm(p => ({ ...p, contacts: [...(p.contacts || []), { name: '', role: '', email: '', phone: '', isPrimary: false }] }))} style={{ padding: '2px 8px', borderRadius: 4, border: '1px dashed ' + C.navy, background: 'none', color: C.navy, fontSize: 9, fontWeight: 600, cursor: 'pointer' }}>+ Add Contact</button>
      </div>
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

      {/* ── KEYWORDS & NOTES ── */}
      <div style={{ ...secH, marginTop: 16 }}>KEYWORDS & NOTES</div>
      <div style={{ marginBottom: 8 }}><div style={lS}>KEYWORDS</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '6px 8px', border: '1px solid #e2e4e9', borderRadius: 6, minHeight: 34, alignItems: 'center' }}>
          {(form.keywords || []).map((kw, i) => <span key={i} style={{ fontSize: 10, background: '#e0e7ff', color: '#3b5998', padding: '2px 8px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4 }}>{kw}<button onClick={() => setForm(p => ({ ...p, keywords: (p.keywords || []).filter((_, j) => j !== i) }))} style={{ border: 'none', background: 'none', color: '#3b5998', cursor: 'pointer', fontSize: 12, padding: 0 }}>x</button></span>)}
          <input placeholder="Type & press Enter..." onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); e.stopPropagation(); const v = e.target.value.trim(); if (v) { setForm(p => ({ ...p, keywords: [...(p.keywords || []), v] })); e.target.value = ''; } } }} style={{ border: 'none', outline: 'none', fontSize: 11, flex: 1, minWidth: 100, padding: '2px 0' }} />
        </div>
      </div>
      <div style={{ marginBottom: 12 }}><div style={lS}>NOTES</div><textarea value={form.notes || ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} placeholder="Account notes..." style={{ ...iS, fontFamily: 'inherit', resize: 'vertical' }} /></div>

      {/* Save / Cancel / Delete */}
      <div style={{ display: 'flex', gap: 8, marginTop: 16, paddingTop: 12, borderTop: '1px solid #e2e4e9' }}>
        <button onClick={onSave} style={{ flex: 1, padding: 10, background: C.navy, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{isNew && !form.id ? 'Add Customer' : 'Save Changes'}</button>
        {form.id && <button onClick={async () => { if (!confirm('Delete this customer? This will deactivate it.')) return; try { await fetch('/api/field-map/customers/' + form.id, { method: 'DELETE' }); onCancel(); window.location.reload(); } catch (e) { alert(e.message); } }} style={{ padding: '10px 16px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>Delete</button>}
        <button onClick={onCancel} style={{ padding: '10px 20px', background: '#f3f4f6', color: '#8b919e', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
      </div>
    </div>
  );
}
