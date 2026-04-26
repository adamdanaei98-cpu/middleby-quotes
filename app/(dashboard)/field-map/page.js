// app/(dashboard)/field-map/page.js
'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';

const C = { navy: '#003250', blue: '#0074BB', red: '#E12C3E', muted: '#8b919e', border: '#e2e4e9', green: '#16a34a' };

export default function FieldMapPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [reps, setReps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); // selected customer
  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState(new Set());
  const [countryFilter, setCountryFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [myLocation, setMyLocation] = useState(null);
  const [showAdmin, setShowAdmin] = useState(null); // null or customer to edit
  const [editForm, setEditForm] = useState(null);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);

  const canEdit = user?.isAdmin || user?.role === 'manager' || user?.role === 'supervisor';

  // Load data
  useEffect(() => {
    Promise.all([
      fetch('/api/field-map/customers').then(r => r.json()),
      fetch('/api/field-map/companies').then(r => r.json()),
      fetch('/api/field-map/reps').then(r => r.json()),
    ]).then(([c, co, rp]) => {
      setCustomers(c.customers || []);
      setCompanies(co.companies || []);
      setReps(rp.reps || []);
      setLoading(false);
    });
  }, []);

  // Init map
  useEffect(() => {
    if (mapInstance.current || !mapRef.current) return;
    import('leaflet').then(L => {
      // Fix default icon
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({ iconRetinaUrl: '', iconUrl: '', shadowUrl: '' });

      const map = L.map(mapRef.current, { worldCopyJump: true, zoomControl: true }).setView([25, 10], 2);
      L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
        attribution: '&copy; CartoDB',
        subdomains: 'abcd',
      }).addTo(map);
      mapInstance.current = map;
    });
  }, [loading]);

  // Update markers when data/filters change
  useEffect(() => {
    if (!mapInstance.current) return;
    import('leaflet').then(L => {
      // Clear old markers
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      filtered.forEach(c => {
        if (!c.lat || !c.lng) return;
        const color = c.primaryCompany?.color || c.company?.color || C.navy;
        const isSelected = selected?.id === c.id;
        const size = isSelected ? 30 : 22;

        const icon = L.divIcon({
          className: '',
          html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid ${isSelected ? C.red : C.navy};box-shadow:${isSelected ? '0 0 12px ' + C.red : '0 1px 4px rgba(0,0,0,.3)'};transition:all .2s;cursor:pointer"></div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });

        const marker = L.marker([c.lat, c.lng], { icon }).addTo(mapInstance.current);
        marker.on('click', () => setSelected(c));
        markersRef.current.push(marker);
      });
    });
  }, [customers, brandFilter, search, countryFilter, stateFilter, selected]);

  // Filtering
  const filtered = customers.filter(c => {
    if (search) {
      const s = search.toLowerCase();
      if (!(c.name || '').toLowerCase().includes(s) && !(c.city || '').toLowerCase().includes(s) && !(c.state || '').toLowerCase().includes(s) && !(c.contact || '').toLowerCase().includes(s)) return false;
    }
    if (brandFilter.size > 0) {
      const coId = c.primaryCompanyId || c.companyId;
      if (!coId || !brandFilter.has(coId)) return false;
    }
    if (countryFilter && c.country !== countryFilter) return false;
    if (stateFilter && c.state !== stateFilter) return false;
    return true;
  });

  // Sort by distance if myLocation is set
  const sortedFiltered = myLocation ? [...filtered].sort((a, b) => {
    const dA = a.lat && a.lng ? Math.sqrt((a.lat - myLocation.lat) ** 2 + (a.lng - myLocation.lng) ** 2) : 999999;
    const dB = b.lat && b.lng ? Math.sqrt((b.lat - myLocation.lat) ** 2 + (b.lng - myLocation.lng) ** 2) : 999999;
    return dA - dB;
  }) : filtered;

  const countries = [...new Set(customers.map(c => c.country).filter(Boolean))].sort();
  const states = [...new Set(customers.filter(c => !countryFilter || c.country === countryFilter).map(c => c.state).filter(Boolean))].sort();
  const noCoords = customers.filter(c => !c.lat || !c.lng).length;
  const equipCount = customers.reduce((t, c) => t + (c.equipment?.length || 0), 0);

  const toggleBrand = (id) => setBrandFilter(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const nearMe = () => {
    navigator.geolocation.getCurrentPosition(pos => {
      setMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      if (mapInstance.current) mapInstance.current.setView([pos.coords.latitude, pos.coords.longitude], 8);
    });
  };

  // Geocode helper
  const geocode = async (address) => {
    const res = await fetch('/api/field-map/geocode', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address }) });
    if (res.ok) return res.json();
    return null;
  };

  // Save customer (create or update)
  const saveCustomer = async () => {
    if (!editForm || !editForm.name) return;
    const body = { ...editForm };
    try {
      let res;
      if (editForm.id) {
        res = await fetch('/api/field-map/customers/' + editForm.id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      } else {
        res = await fetch('/api/field-map/customers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      }
      if (res.ok) {
        // Reload
        const r = await fetch('/api/field-map/customers');
        const d = await r.json();
        setCustomers(d.customers || []);
        setEditForm(null);
        setShowAdmin(null);
      } else { const e = await res.json(); alert(e.error || 'Save failed'); }
    } catch (e) { alert(e.message); }
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 56px)' }}><div style={{ fontSize: 16, color: C.muted }}>Loading field map...</div></div>;

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 56px)', overflow: 'hidden' }}>
      {/* ═══ LEFT: FILTER SIDEBAR ═══ */}
      <div style={{ width: 260, flexShrink: 0, background: '#fff', borderRight: '1px solid ' + C.border, padding: 16, overflowY: 'auto' }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: C.navy, marginBottom: 12 }}>Field Map</div>

        {/* Search */}
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers..." style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid ' + C.border, fontSize: 11, marginBottom: 12, boxSizing: 'border-box' }} />

        {/* Brand chips */}
        <div style={{ fontSize: 9, fontWeight: 700, color: C.muted, marginBottom: 4 }}>SUB-BRANDS</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
          {companies.map(co => (
            <button key={co.id} onClick={() => toggleBrand(co.id)} style={{ padding: '3px 10px', borderRadius: 12, border: '1.5px solid ' + co.color, fontSize: 9, fontWeight: 700, cursor: 'pointer', background: brandFilter.has(co.id) ? co.color : 'transparent', color: brandFilter.has(co.id) ? '#fff' : co.color }}>{co.name}</button>
          ))}
        </div>

        {/* Country / State */}
        <div style={{ fontSize: 9, fontWeight: 700, color: C.muted, marginBottom: 4 }}>COUNTRY</div>
        <select value={countryFilter} onChange={e => { setCountryFilter(e.target.value); setStateFilter(''); }} style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid ' + C.border, fontSize: 10, marginBottom: 8 }}>
          <option value="">All countries</option>
          {countries.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div style={{ fontSize: 9, fontWeight: 700, color: C.muted, marginBottom: 4 }}>STATE / REGION</div>
        <select value={stateFilter} onChange={e => setStateFilter(e.target.value)} style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid ' + C.border, fontSize: 10, marginBottom: 12 }}>
          <option value="">All states</option>
          {states.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Near Me */}
        <button onClick={nearMe} style={{ width: '100%', padding: '8px 0', borderRadius: 6, border: '1px solid ' + C.blue, background: myLocation ? C.blue : 'transparent', color: myLocation ? '#fff' : C.blue, fontSize: 11, fontWeight: 700, cursor: 'pointer', marginBottom: 12 }}>{myLocation ? '📍 Sorted by distance' : '📍 Near Me'}</button>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {[{ l: 'Locations', v: customers.length }, { l: 'Equipment', v: equipCount }, { l: 'Countries', v: countries.length }, { l: 'Reps', v: reps.length }].map(s => (
            <div key={s.l} style={{ background: '#f8f9fb', borderRadius: 6, padding: '8px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.navy }}>{s.v}</div>
              <div style={{ fontSize: 8, color: C.muted, fontWeight: 600 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {noCoords > 0 && <div style={{ marginTop: 10, fontSize: 9, color: '#d97706', background: '#fffbeb', padding: '6px 8px', borderRadius: 6, border: '1px solid #fde68a' }}>{noCoords} customer{noCoords > 1 ? 's' : ''} missing coordinates</div>}

        {canEdit && <button onClick={() => { setEditForm({ name: '', equipment: [], repIds: [] }); setShowAdmin('new'); }} style={{ width: '100%', marginTop: 12, padding: '8px 0', borderRadius: 6, border: 'none', background: C.navy, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>+ Add Customer</button>}
      </div>

      {/* ═══ CENTER: CUSTOMER LIST ═══ */}
      <div style={{ width: 320, flexShrink: 0, background: '#fafbfc', borderRight: '1px solid ' + C.border, overflowY: 'auto' }}>
        <div style={{ padding: '10px 12px', borderBottom: '1px solid ' + C.border, fontSize: 10, color: C.muted, fontWeight: 600 }}>{sortedFiltered.length} customers</div>
        {sortedFiltered.map(c => {
          const co = c.primaryCompany || c.company;
          const isActive = selected?.id === c.id;
          return (
            <div key={c.id} onClick={() => { setSelected(c); if (c.lat && c.lng && mapInstance.current) mapInstance.current.setView([c.lat, c.lng], 10); }} style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer', background: isActive ? co?.color + '12' : 'transparent', borderLeft: isActive ? '3px solid ' + (co?.color || C.navy) : '3px solid transparent' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>{c.name}</div>
                {co && <span style={{ fontSize: 8, fontWeight: 700, color: co.color, background: co.color + '15', padding: '1px 6px', borderRadius: 8 }}>{co.name}</span>}
              </div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{[c.city, c.state, c.country].filter(Boolean).join(', ') || c.address || 'No location'}</div>
              {!c.lat && !c.lng && <span style={{ fontSize: 8, color: '#d97706', fontWeight: 600 }}>No coords</span>}
              {c.equipment?.length > 0 && <span style={{ fontSize: 8, color: C.muted, marginLeft: 4 }}>{c.equipment.length} equipment</span>}
            </div>
          );
        })}
      </div>

      {/* ═══ RIGHT: MAP + DETAIL ═══ */}
      <div style={{ flex: 1, position: 'relative' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

        {/* Detail panel */}
        {selected && (
          <div style={{ position: 'absolute', top: 0, right: 0, width: 340, height: '100%', background: '#fff', boxShadow: '-4px 0 20px rgba(0,0,0,.1)', overflowY: 'auto', zIndex: 500, padding: 20 }}>
            <button onClick={() => setSelected(null)} style={{ position: 'absolute', top: 10, right: 10, border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: C.muted }}>✕</button>

            {/* Brand tag */}
            {(selected.primaryCompany || selected.company) && (() => {
              const co = selected.primaryCompany || selected.company;
              return <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', background: co.color, padding: '2px 10px', borderRadius: 10 }}>{co.name}</span>;
            })()}

            <div style={{ fontSize: 18, fontWeight: 800, color: C.navy, marginTop: 8 }}>{selected.name}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{[selected.city, selected.state, selected.country].filter(Boolean).join(', ')}</div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 6, marginTop: 12, marginBottom: 16 }}>
              {selected.lat && selected.lng && <a href={`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`} target="_blank" style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid ' + C.blue, color: C.blue, fontSize: 10, fontWeight: 600, textDecoration: 'none' }}>Directions</a>}
              <button onClick={() => alert('Visit logged! (v2 feature)')} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid ' + C.green, color: C.green, fontSize: 10, fontWeight: 600, background: 'none', cursor: 'pointer' }}>Log Visit</button>
              {canEdit && <button onClick={() => { setEditForm({ ...selected, repIds: (selected.fieldMapReps || []).map(r => r.userId), equipment: selected.equipment || [] }); setShowAdmin('edit'); }} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d97706', color: '#d97706', fontSize: 10, fontWeight: 600, background: 'none', cursor: 'pointer' }}>Edit</button>}
            </div>

            {/* Address & Contact */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, marginBottom: 4 }}>ADDRESS & CONTACT</div>
              {selected.address && <div style={{ fontSize: 11, color: '#444' }}>{selected.address}</div>}
              {selected.contact && <div style={{ fontSize: 11, color: '#444', marginTop: 4 }}>Contact: {selected.contact}</div>}
              {selected.email && <div style={{ fontSize: 11, color: C.blue }}>{selected.email}</div>}
              {selected.phone && <div style={{ fontSize: 11, color: '#444' }}>{selected.phone}</div>}
            </div>

            {/* Reps */}
            {selected.fieldMapReps?.length > 0 && <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, marginBottom: 4 }}>SALES REPS</div>
              {selected.fieldMapReps.map(r => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ fontSize: 11, fontWeight: 600 }}>{r.user.name}</span>
                  {r.user.primaryCompany && <span style={{ fontSize: 8, color: r.user.primaryCompany.color, fontWeight: 600 }}>{r.user.primaryCompany.name}</span>}
                </div>
              ))}
            </div>}

            {/* Equipment */}
            {selected.equipment?.length > 0 && <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, marginBottom: 4 }}>INSTALLED EQUIPMENT</div>
              {selected.equipment.map(e => (
                <div key={e.id} style={{ padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, fontWeight: 600 }}>{e.model}</span>
                    <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 6px', borderRadius: 8, background: e.status === 'active' ? '#dcfce7' : e.status === 'service' ? '#fef3c7' : '#f3f4f6', color: e.status === 'active' ? C.green : e.status === 'service' ? '#d97706' : C.muted }}>{e.status}</span>
                  </div>
                  {(e.serial || e.year) && <div style={{ fontSize: 9, color: C.muted }}>{e.serial ? 'SN: ' + e.serial : ''}{e.year ? ' • ' + e.year : ''}</div>}
                </div>
              ))}
            </div>}

            {/* Notes */}
            {selected.notes && <div style={{ padding: '10px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, fontSize: 11, color: '#dc2626' }}>{selected.notes}</div>}
          </div>
        )}
      </div>

      {/* ═══ EDIT MODAL ═══ */}
      {showAdmin && editForm && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => { setShowAdmin(null); setEditForm(null); }}>
        <div style={{ background: '#fff', borderRadius: 14, padding: 24, width: 620, maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.navy, marginBottom: 16 }}>{editForm.id ? 'Edit Customer' : 'Add Customer'}</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={{ fontSize: 9, fontWeight: 700, color: C.muted }}>NAME *</label><input value={editForm.name || ''} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid ' + C.border, fontSize: 11, boxSizing: 'border-box' }} /></div>
            <div><label style={{ fontSize: 9, fontWeight: 700, color: C.muted }}>SUB-BRAND</label><select value={editForm.primaryCompanyId || ''} onChange={e => setEditForm(p => ({ ...p, primaryCompanyId: e.target.value || null }))} style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid ' + C.border, fontSize: 11 }}>
              <option value="">Select...</option>
              {companies.map(co => <option key={co.id} value={co.id}>{co.name}</option>)}
            </select></div>
            <div><label style={{ fontSize: 9, fontWeight: 700, color: C.muted }}>CONCEPT / INDUSTRY</label><input value={editForm.concept || ''} onChange={e => setEditForm(p => ({ ...p, concept: e.target.value }))} style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid ' + C.border, fontSize: 11, boxSizing: 'border-box' }} /></div>
            <div><label style={{ fontSize: 9, fontWeight: 700, color: C.muted }}>PLANT</label><input value={editForm.plant || ''} onChange={e => setEditForm(p => ({ ...p, plant: e.target.value }))} style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid ' + C.border, fontSize: 11, boxSizing: 'border-box' }} /></div>
          </div>

          <div style={{ marginTop: 10 }}><label style={{ fontSize: 9, fontWeight: 700, color: C.muted }}>ADDRESS</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={editForm.address || ''} onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))} style={{ flex: 1, padding: '6px 8px', borderRadius: 6, border: '1px solid ' + C.border, fontSize: 11, boxSizing: 'border-box' }} />
              <button onClick={async () => {
                const addr = [editForm.address, editForm.city, editForm.state, editForm.country].filter(Boolean).join(', ');
                if (!addr) return;
                const r = await geocode(addr);
                if (r) setEditForm(p => ({ ...p, lat: r.lat, lng: r.lng }));
                else alert('Address not found');
              }} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid ' + C.blue, background: 'none', color: C.blue, fontSize: 10, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>📍 Lookup</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 8, marginTop: 8 }}>
            <div><label style={{ fontSize: 9, fontWeight: 700, color: C.muted }}>CITY</label><input value={editForm.city || ''} onChange={e => setEditForm(p => ({ ...p, city: e.target.value }))} style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid ' + C.border, fontSize: 11, boxSizing: 'border-box' }} /></div>
            <div><label style={{ fontSize: 9, fontWeight: 700, color: C.muted }}>STATE</label><input value={editForm.state || ''} onChange={e => setEditForm(p => ({ ...p, state: e.target.value }))} style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid ' + C.border, fontSize: 11, boxSizing: 'border-box' }} /></div>
            <div><label style={{ fontSize: 9, fontWeight: 700, color: C.muted }}>COUNTRY</label><input value={editForm.country || ''} onChange={e => setEditForm(p => ({ ...p, country: e.target.value }))} style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid ' + C.border, fontSize: 11, boxSizing: 'border-box' }} /></div>
            <div><label style={{ fontSize: 9, fontWeight: 700, color: C.muted }}>LAT</label><input type="number" step="any" value={editForm.lat || ''} onChange={e => setEditForm(p => ({ ...p, lat: e.target.value }))} style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid ' + C.border, fontSize: 11, boxSizing: 'border-box' }} /></div>
            <div><label style={{ fontSize: 9, fontWeight: 700, color: C.muted }}>LNG</label><input type="number" step="any" value={editForm.lng || ''} onChange={e => setEditForm(p => ({ ...p, lng: e.target.value }))} style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid ' + C.border, fontSize: 11, boxSizing: 'border-box' }} /></div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginTop: 10 }}>
            <div><label style={{ fontSize: 9, fontWeight: 700, color: C.muted }}>CONTACT</label><input value={editForm.contact || ''} onChange={e => setEditForm(p => ({ ...p, contact: e.target.value }))} style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid ' + C.border, fontSize: 11, boxSizing: 'border-box' }} /></div>
            <div><label style={{ fontSize: 9, fontWeight: 700, color: C.muted }}>EMAIL</label><input value={editForm.email || ''} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid ' + C.border, fontSize: 11, boxSizing: 'border-box' }} /></div>
            <div><label style={{ fontSize: 9, fontWeight: 700, color: C.muted }}>PHONE</label><input value={editForm.phone || ''} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid ' + C.border, fontSize: 11, boxSizing: 'border-box' }} /></div>
          </div>

          {/* Reps multi-select */}
          <div style={{ marginTop: 12 }}><label style={{ fontSize: 9, fontWeight: 700, color: C.muted }}>ASSIGNED REPS</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
              {reps.map(r => {
                const isOn = (editForm.repIds || []).includes(r.id);
                return <button key={r.id} onClick={() => setEditForm(p => ({ ...p, repIds: isOn ? (p.repIds || []).filter(x => x !== r.id) : [...(p.repIds || []), r.id] }))} style={{ padding: '3px 8px', borderRadius: 10, border: '1px solid ' + (r.primaryCompany?.color || C.muted), fontSize: 9, fontWeight: 600, cursor: 'pointer', background: isOn ? (r.primaryCompany?.color || C.navy) : 'transparent', color: isOn ? '#fff' : (r.primaryCompany?.color || C.muted) }}>{r.name}</button>;
              })}
            </div>
          </div>

          {/* Equipment editor */}
          <div style={{ marginTop: 12 }}><label style={{ fontSize: 9, fontWeight: 700, color: C.muted }}>INSTALLED EQUIPMENT</label>
            {(editForm.equipment || []).map((eq, i) => (
              <div key={i} style={{ display: 'flex', gap: 4, marginTop: 4, alignItems: 'center' }}>
                <input placeholder="Model" value={eq.model || ''} onChange={e => { const eqs = [...(editForm.equipment || [])]; eqs[i] = { ...eqs[i], model: e.target.value }; setEditForm(p => ({ ...p, equipment: eqs })); }} style={{ flex: 2, padding: '4px 6px', borderRadius: 4, border: '1px solid ' + C.border, fontSize: 10 }} />
                <input placeholder="Serial" value={eq.serial || ''} onChange={e => { const eqs = [...(editForm.equipment || [])]; eqs[i] = { ...eqs[i], serial: e.target.value }; setEditForm(p => ({ ...p, equipment: eqs })); }} style={{ flex: 1, padding: '4px 6px', borderRadius: 4, border: '1px solid ' + C.border, fontSize: 10 }} />
                <input placeholder="Year" type="number" value={eq.year || ''} onChange={e => { const eqs = [...(editForm.equipment || [])]; eqs[i] = { ...eqs[i], year: e.target.value }; setEditForm(p => ({ ...p, equipment: eqs })); }} style={{ width: 50, padding: '4px 6px', borderRadius: 4, border: '1px solid ' + C.border, fontSize: 10 }} />
                <select value={eq.status || 'active'} onChange={e => { const eqs = [...(editForm.equipment || [])]; eqs[i] = { ...eqs[i], status: e.target.value }; setEditForm(p => ({ ...p, equipment: eqs })); }} style={{ padding: '4px 4px', borderRadius: 4, border: '1px solid ' + C.border, fontSize: 10 }}>
                  <option value="active">Active</option><option value="service">Service</option><option value="idle">Idle</option>
                </select>
                <button onClick={() => { const eqs = [...(editForm.equipment || [])]; eqs.splice(i, 1); setEditForm(p => ({ ...p, equipment: eqs })); }} style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 14 }}>×</button>
              </div>
            ))}
            <button onClick={() => setEditForm(p => ({ ...p, equipment: [...(p.equipment || []), { model: '', serial: '', year: '', status: 'active' }] }))} style={{ marginTop: 6, padding: '4px 10px', borderRadius: 4, border: '1px dashed ' + C.border, background: 'none', color: C.muted, fontSize: 9, cursor: 'pointer' }}>+ Add equipment</button>
          </div>

          {/* Notes */}
          <div style={{ marginTop: 10 }}><label style={{ fontSize: 9, fontWeight: 700, color: C.muted }}>NOTES</label>
            <textarea value={editForm.notes || ''} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} rows={2} style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid ' + C.border, fontSize: 11, resize: 'vertical', boxSizing: 'border-box' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <button onClick={() => { setShowAdmin(null); setEditForm(null); }} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid ' + C.border, background: '#fff', color: '#666', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
            <button onClick={saveCustomer} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: C.navy, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{editForm.id ? 'Update' : 'Create'}</button>
          </div>
        </div>
      </div>}
    </div>
  );
}
