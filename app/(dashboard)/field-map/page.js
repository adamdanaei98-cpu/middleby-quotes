// app/(dashboard)/field-map/page.js
'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/AuthProvider';
import CustomerForm from '@/components/CustomerForm';

const C = { navy: '#003250', blue: '#0074BB', red: '#E12C3E', muted: '#8b919e', border: '#e2e4e9', green: '#16a34a' };
const VISIT_TYPES = { in_person: 'In-Person', phone: 'Phone', email: 'Email', virtual: 'Virtual' };

function haversine(lat1, lon1, lat2, lon2) {
  const R = 3958.8, toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

export default function FieldMapPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [reps, setReps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState(new Set());
  const [countryFilter, setCountryFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [myLocation, setMyLocation] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [visitModal, setVisitModal] = useState(null); // customer for visit logging
  const [visitForm, setVisitForm] = useState({ type: 'in_person', notes: '', followUpDate: '' });
  const [visitHistory, setVisitHistory] = useState([]);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const meMarkerRef = useRef(null);

  const canEdit = user?.isAdmin || user?.role === 'manager' || user?.role === 'supervisor' || user?.role === 'it';

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
    if (mapInstance.current || !mapRef.current || loading) return;
    import('leaflet').then(L => {
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({ iconRetinaUrl: '', iconUrl: '', shadowUrl: '' });
      const map = L.map(mapRef.current, { worldCopyJump: true }).setView([25, 10], 2);
      L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', { attribution: '', subdomains: 'abcd' }).addTo(map);
      mapInstance.current = map;
    });
  }, [loading]);

  // Filtering
  const filtered = customers.filter(c => {
    if (search) { const s = search.toLowerCase(); if (!(c.name||'').toLowerCase().includes(s) && !(c.city||'').toLowerCase().includes(s) && !(c.state||'').toLowerCase().includes(s) && !(c.contact||'').toLowerCase().includes(s) && !(c.concept||'').toLowerCase().includes(s) && !(c.equipment||[]).some(e => (e.model||'').toLowerCase().includes(s))) return false; }
    if (brandFilter.size > 0) { const coId = c.primaryCompanyId || c.companyId; if (!coId || !brandFilter.has(coId)) return false; }
    if (countryFilter && c.country !== countryFilter) return false;
    if (stateFilter && c.state !== stateFilter) return false;
    if (industryFilter && c.concept !== industryFilter) return false;
    return true;
  });

  // Sorting
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'distance' && myLocation) {
      const dA = a.lat && a.lng ? haversine(myLocation.lat, myLocation.lng, a.lat, a.lng) : 999999;
      const dB = b.lat && b.lng ? haversine(myLocation.lat, myLocation.lng, b.lat, b.lng) : 999999;
      return dA - dB;
    }
    if (sortBy === 'state') return ((a.state||'')+(a.name||'')).localeCompare((b.state||'')+(b.name||''));
    if (sortBy === 'brand') { const aN = a.primaryCompany?.name || a.company?.name || ''; const bN = b.primaryCompany?.name || b.company?.name || ''; return (aN+a.name).localeCompare(bN+b.name); }
    return (a.name||'').localeCompare(b.name||'');
  });

  // Update markers - HQ (circles) + Plants (diamonds)
  useEffect(() => {
    if (!mapInstance.current) return;
    import('leaflet').then(L => {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      filtered.forEach(c => {
        const color = c.primaryCompany?.color || c.company?.color || C.navy;
        const isSel = selected?.id === c.id;
        // HQ marker (circle)
        if (c.lat && c.lng) {
          const sz = isSel ? 28 : 20;
          const icon = L.divIcon({ className: '', html: `<div style="width:${sz}px;height:${sz}px;border-radius:50%;background:${color};border:2.5px solid ${isSel?C.red:C.navy};box-shadow:${isSel?'0 0 10px '+C.red:'0 1px 3px rgba(0,0,0,.25)'};cursor:pointer"></div>`, iconSize: [sz, sz], iconAnchor: [sz/2, sz/2] });
          const marker = L.marker([c.lat, c.lng], { icon }).addTo(mapInstance.current);
          marker.bindTooltip(c.name + ' (HQ)', { direction: 'top', offset: [0, -10] });
          marker.on('click', () => selectCustomer(c));
          markersRef.current.push(marker);
        }
        // Plant markers (smaller diamonds)
        (c.plants || []).forEach(pl => {
          if (!pl.lat || !pl.lng) return;
          const sz = isSel ? 16 : 12;
          const icon = L.divIcon({ className: '', html: `<div style="width:${sz}px;height:${sz}px;border-radius:2px;transform:rotate(45deg);background:${color};border:2px solid ${C.navy};opacity:0.85;cursor:pointer"></div>`, iconSize: [sz, sz], iconAnchor: [sz/2, sz/2] });
          const marker = L.marker([pl.lat, pl.lng], { icon }).addTo(mapInstance.current);
          marker.bindTooltip(c.name + ' — ' + pl.name, { direction: 'top', offset: [0, -6] });
          marker.on('click', () => selectCustomer(c));
          markersRef.current.push(marker);
        });
      });
    });
    });
  }, [customers, brandFilter, search, countryFilter, stateFilter, industryFilter, selected]);

  const selectCustomer = (c) => { setSelected(c); if (c.lat && c.lng && mapInstance.current) mapInstance.current.flyTo([c.lat, c.lng], Math.max(mapInstance.current.getZoom(), 9), { duration: 0.6 }); };

  const nearMe = () => {
    navigator.geolocation.getCurrentPosition(pos => {
      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setMyLocation(loc); setSortBy('distance');
      if (mapInstance.current) {
        mapInstance.current.flyTo([loc.lat, loc.lng], 7, { duration: 0.8 });
        import('leaflet').then(L => {
          if (meMarkerRef.current) meMarkerRef.current.remove();
          const icon = L.divIcon({ className: '', html: '<div style="width:14px;height:14px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 0 8px rgba(37,99,235,.5)"></div>', iconSize: [14, 14], iconAnchor: [7, 7] });
          meMarkerRef.current = L.marker([loc.lat, loc.lng], { icon, zIndexOffset: 1000 }).addTo(mapInstance.current);
          meMarkerRef.current.bindTooltip('You are here');
        });
      }
    });
  };

  const fitAll = () => { if (!mapInstance.current) return; const pts = filtered.filter(c => c.lat && c.lng); if (pts.length > 0) { import('leaflet').then(L => { mapInstance.current.fitBounds(L.latLngBounds(pts.map(c => [c.lat, c.lng])), { padding: [40, 40], maxZoom: 10 }); }); } };

  const toggleBrand = (id) => setBrandFilter(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const geocode = async (addr) => { const r = await fetch('/api/field-map/geocode', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address: addr }) }); return r.ok ? r.json() : null; };

  const saveCustomer = async () => {
    if (!editForm?.name) return;
    try {
      const res = editForm.id ? await fetch('/api/field-map/customers/' + editForm.id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm) })
        : await fetch('/api/field-map/customers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm) });
      if (res.ok) { const r = await fetch('/api/field-map/customers'); const d = await r.json(); setCustomers(d.customers || []); setEditForm(null); } else { const e = await res.json(); alert(e.error); }
    } catch (e) { alert(e.message); }
  };

  const logVisit = async () => {
    if (!visitModal) return;
    try {
      await fetch('/api/field-map/visits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customerId: visitModal.id, ...visitForm }) });
      // Reload customers to get updated last visit
      const r = await fetch('/api/field-map/customers'); const d = await r.json(); setCustomers(d.customers || []);
      setVisitModal(null); setVisitForm({ type: 'in_person', notes: '', followUpDate: '' });
    } catch (e) { alert(e.message); }
  };

  const loadVisitHistory = async (customerId) => {
    const r = await fetch('/api/field-map/visits?customerId=' + customerId);
    if (r.ok) { const d = await r.json(); setVisitHistory(d.visits || []); }
  };

  const countries = [...new Set(customers.map(c => c.country).filter(Boolean))].sort();
  const states = [...new Set(customers.filter(c => !countryFilter || c.country === countryFilter).map(c => c.state).filter(Boolean))].sort();
  const industries = [...new Set(customers.map(c => c.concept).filter(Boolean))].sort();
  const noCoords = customers.filter(c => !c.lat || !c.lng).length;
  const equipCount = customers.reduce((t, c) => t + (c.equipment?.length || 0), 0);

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 56px)' }}><div style={{ fontSize: 16, color: C.muted }}>Loading field map...</div></div>;

  const iS = { width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid ' + C.border, fontSize: 11, boxSizing: 'border-box' };
  const lS = { fontSize: 9, fontWeight: 700, color: C.muted, marginBottom: 3, letterSpacing: '.05em' };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 56px)', overflow: 'hidden' }}>
      {/* ═══ FILTERS ═══ */}
      <div style={{ width: 250, flexShrink: 0, background: '#fff', borderRight: '1px solid ' + C.border, padding: 16, overflowY: 'auto' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: C.navy, marginBottom: 12 }}>Field Map</div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, city, equipment..." style={{ ...iS, marginBottom: 10, padding: '8px 10px' }} />

        <div style={lS}>SUB-BRANDS</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
          {companies.map(co => { const count = customers.filter(c => (c.primaryCompanyId || c.companyId) === co.id).length; return (
            <button key={co.id} onClick={() => toggleBrand(co.id)} style={{ padding: '3px 8px', borderRadius: 10, border: '1.5px solid ' + co.color, fontSize: 9, fontWeight: 700, cursor: 'pointer', background: brandFilter.has(co.id) ? co.color : 'transparent', color: brandFilter.has(co.id) ? '#fff' : co.color }}>{co.name} <span style={{ opacity: .5 }}>{count}</span></button>
          ); })}
          {brandFilter.size > 0 && <button onClick={() => setBrandFilter(new Set())} style={{ padding: '3px 6px', border: 'none', background: 'none', color: C.muted, fontSize: 8, cursor: 'pointer', textDecoration: 'underline' }}>Clear</button>}
        </div>

        <div style={lS}>COUNTRY</div>
        <select value={countryFilter} onChange={e => { setCountryFilter(e.target.value); setStateFilter(''); }} style={{ ...iS, marginBottom: 8 }}><option value="">All</option>{countries.map(c => <option key={c}>{c}</option>)}</select>
        <div style={lS}>STATE / REGION</div>
        <select value={stateFilter} onChange={e => setStateFilter(e.target.value)} style={{ ...iS, marginBottom: 8 }}><option value="">All</option>{states.map(s => <option key={s}>{s}</option>)}</select>
        <div style={lS}>INDUSTRY</div>
        <select value={industryFilter} onChange={e => setIndustryFilter(e.target.value)} style={{ ...iS, marginBottom: 8 }}><option value="">All</option>{industries.map(i => <option key={i}>{i}</option>)}</select>
        <div style={lS}>KEYWORDS</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 8 }}>
          {[...new Set(customers.flatMap(c => c.keywords || []))].sort().slice(0, 20).map(k => (
            <button key={k} onClick={() => setSearch(search === k ? '' : k)} style={{ padding: '2px 6px', borderRadius: 4, border: '1px solid ' + (search === k ? C.navy : C.border), fontSize: 8, cursor: 'pointer', background: search === k ? C.navy : 'transparent', color: search === k ? '#fff' : C.muted }}>{k}</button>
          ))}
        </div>
        <div style={lS}>SORT BY</div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ ...iS, marginBottom: 10 }}><option value="name">Name</option><option value="distance">Distance</option><option value="state">State</option><option value="brand">Brand</option></select>

        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          <button onClick={nearMe} style={{ flex: 1, padding: '7px 0', borderRadius: 6, border: '1px solid ' + C.blue, background: myLocation ? C.blue : 'transparent', color: myLocation ? '#fff' : C.blue, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>{myLocation ? '📍 Located' : '📍 Near Me'}</button>
          <button onClick={fitAll} style={{ flex: 1, padding: '7px 0', borderRadius: 6, border: '1px solid ' + C.border, background: '#fff', color: C.muted, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>Fit All</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
          {[{ l: 'Locations', v: customers.length }, { l: 'Equipment', v: equipCount }, { l: 'Countries', v: countries.length }, { l: 'Reps', v: reps.length }].map(s => (
            <div key={s.l} style={{ background: '#f8f9fb', borderRadius: 6, padding: '8px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.navy }}>{s.v}</div>
              <div style={{ fontSize: 8, color: C.muted, fontWeight: 600 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {noCoords > 0 && <div style={{ fontSize: 9, color: '#d97706', background: '#fffbeb', padding: '6px 8px', borderRadius: 6, border: '1px solid #fde68a', marginBottom: 8 }}>{noCoords} missing coordinates</div>}
        {canEdit && <button onClick={() => setEditForm({ name: '', equipment: [], repIds: [], contacts: [], plants: [], keywords: [] })} style={{ width: '100%', padding: '8px 0', borderRadius: 6, border: 'none', background: C.navy, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>+ Add Customer</button>}
      </div>

      {/* ═══ LIST ═══ */}
      <div style={{ width: 320, flexShrink: 0, background: '#fafbfc', borderRight: '1px solid ' + C.border, overflowY: 'auto' }}>
        <div style={{ padding: '8px 12px', borderBottom: '1px solid ' + C.border, fontSize: 10, color: C.muted, fontWeight: 600 }}>{sorted.length} of {customers.length} customers</div>
        {sorted.map(c => {
          const co = c.primaryCompany || c.company;
          const isSel = selected?.id === c.id;
          const dist = myLocation && c.lat && c.lng ? haversine(myLocation.lat, myLocation.lng, c.lat, c.lng) : null;
          const lastVisit = c.visits?.[0];
          const plantCount = (c.plants || []).length;
          const equipCount = (c.equipment?.length || 0) + (c.plants || []).reduce((t, p) => t + (p.equipment?.length || 0), 0);
          return (
            <div key={c.id} style={{ borderBottom: '1px solid #eef0f2' }}>
              {/* Customer header */}
              <div onClick={() => selectCustomer(c)} style={{ padding: '8px 12px', cursor: 'pointer', background: isSel ? (co?.color || C.navy) + '10' : 'transparent', borderLeft: isSel ? '3px solid ' + (co?.color || C.navy) : '3px solid transparent' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#333' }}>{c.name}</div>
                  {dist !== null && <div style={{ fontSize: 9, color: C.blue, fontWeight: 700 }}>{Math.round(dist)} mi</div>}
                </div>
                <div style={{ display: 'flex', gap: 4, marginTop: 2, alignItems: 'center' }}>
                  {co && <span style={{ fontSize: 7, fontWeight: 700, color: '#fff', background: co.color, padding: '1px 5px', borderRadius: 6 }}>{co.name}</span>}
                  {c.concept && <span style={{ fontSize: 8, color: C.muted }}>{c.concept}</span>}
                </div>
                <div style={{ fontSize: 9, color: C.muted, marginTop: 1 }}>HQ: {[c.city, c.state].filter(Boolean).join(', ') || c.address || '—'}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                  {plantCount > 0 && <span style={{ fontSize: 8, color: C.navy, fontWeight: 600 }}>{plantCount} plant{plantCount > 1 ? 's' : ''}</span>}
                  {equipCount > 0 && <span style={{ fontSize: 8, color: C.muted }}>{equipCount} equip</span>}
                  {lastVisit && <span style={{ fontSize: 8, color: C.green }}>Visited {new Date(lastVisit.visitDate).toLocaleDateString()}</span>}
                  {!c.lat && <span style={{ fontSize: 7, color: '#d97706', fontWeight: 600 }}>No coords</span>}
                </div>
              </div>
              {/* Expandable plants (show when selected) */}
              {isSel && (c.plants || []).length > 0 && <div style={{ background: '#f4f6f8', borderTop: '1px solid #eef0f2' }}>
                {(c.plants || []).map((pl, pi) => (
                  <div key={pi} style={{ padding: '4px 12px 4px 24px', borderBottom: '1px solid #eef0f2' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: 10, fontWeight: 600, color: C.navy }}>◆ {pl.name}</span>
                        <span style={{ fontSize: 9, color: C.muted, marginLeft: 6 }}>{[pl.city, pl.state].filter(Boolean).join(', ')}</span>
                      </div>
                      {(pl.equipment || []).length > 0 && <span style={{ fontSize: 8, color: C.muted }}>{(pl.equipment || []).length} equip</span>}
                    </div>
                  </div>
                ))}
              </div>}
            </div>
          );
        })}
        {sorted.length === 0 && <div style={{ padding: 30, textAlign: 'center', color: C.muted, fontSize: 12 }}>No customers match filters</div>}
      </div>

      {/* ═══ MAP ═══ */}
      <div style={{ flex: 1, position: 'relative' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        {/* Legend */}
        <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(255,255,255,.92)', borderRadius: 8, padding: '8px 12px', fontSize: 9, zIndex: 400, boxShadow: '0 1px 4px rgba(0,0,0,.1)' }}>
          {companies.map(co => <div key={co.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0' }}><div style={{ width: 10, height: 10, borderRadius: 5, background: co.color }} /><span style={{ color: '#333', fontWeight: 500 }}>{co.name}</span></div>)}
        </div>

        {/* DETAIL PANEL */}
        {selected && <div style={{ position: 'absolute', top: 0, right: 0, width: 360, height: '100%', background: '#fff', boxShadow: '-4px 0 20px rgba(0,0,0,.1)', overflowY: 'auto', zIndex: 500, padding: 20 }}>
          <button onClick={() => setSelected(null)} style={{ position: 'absolute', top: 10, right: 12, border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: C.muted }}>x</button>
          {(selected.primaryCompany || selected.company) && (() => { const co = selected.primaryCompany || selected.company; return <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', background: co.color, padding: '2px 10px', borderRadius: 10 }}>{co.name}</span>; })()}
          <div style={{ fontSize: 18, fontWeight: 800, color: C.navy, marginTop: 6 }}>{selected.name}</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{[selected.city, selected.state, selected.country].filter(Boolean).join(', ')}{selected.concept ? ' · ' + selected.concept : ''}</div>
          {myLocation && selected.lat && selected.lng && <div style={{ fontSize: 10, color: C.blue, fontWeight: 600, marginTop: 2 }}>{Math.round(haversine(myLocation.lat, myLocation.lng, selected.lat, selected.lng))} miles away</div>}

          <div style={{ display: 'flex', gap: 6, marginTop: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <button onClick={() => { setVisitModal(selected); loadVisitHistory(selected.id); }} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: C.navy, color: '#fff', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Log Visit</button>
            {selected.lat && selected.lng && <a href={`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`} target="_blank" rel="noopener" style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid ' + C.blue, color: C.blue, fontSize: 10, fontWeight: 600, textDecoration: 'none' }}>Directions</a>}
            {selected.phone && <a href={'tel:' + selected.phone.replace(/[^0-9+]/g, '')} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid ' + C.green, color: C.green, fontSize: 10, fontWeight: 600, textDecoration: 'none' }}>Call</a>}
            {selected.email && <a href={'mailto:' + selected.email} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d97706', color: '#d97706', fontSize: 10, fontWeight: 600, textDecoration: 'none' }}>Email</a>}
            {canEdit && <button onClick={() => setEditForm({ ...selected, repIds: (selected.fieldMapReps || []).map(r => r.userId), equipment: (selected.equipment || []).map(e => ({ ...e, companyId: e.companyId || e.company?.id || null })), contacts: selected.contacts || [], plants: selected.plants || [] })} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid ' + C.muted, color: C.muted, fontSize: 10, fontWeight: 600, background: 'none', cursor: 'pointer' }}>Edit</button>}
          </div>

          {/* Contacts */}
          <div style={{ marginBottom: 14 }}><div style={lS}>CONTACTS{selected.contacts?.length > 0 ? ' \u00b7 ' + selected.contacts.length : ''}</div>
            {selected.contacts?.length > 0 ? selected.contacts.map((ct, i) => (
              <div key={i} style={{ padding: '5px 0', borderBottom: '1px solid #f3f4f6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>{ct.name}</span>
                  {ct.isPrimary && <span style={{ fontSize: 7, fontWeight: 700, color: C.blue, background: '#dbeafe', padding: '1px 5px', borderRadius: 6 }}>PRIMARY</span>}
                </div>
                {ct.role && <div style={{ fontSize: 10, color: C.muted }}>{ct.role}</div>}
                <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                  {ct.phone && <a href={'tel:' + ct.phone.replace(/[^0-9+]/g, '')} style={{ fontSize: 10, color: '#333', textDecoration: 'none', borderBottom: '1px dotted #ccc' }}>{ct.phone}</a>}
                  {ct.email && <a href={'mailto:' + ct.email} style={{ fontSize: 10, color: '#333', textDecoration: 'none', borderBottom: '1px dotted #ccc' }}>{ct.email}</a>}
                </div>
              </div>
            )) : selected.contact ? <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>{selected.contact}</div>
              {selected.contactRole && <div style={{ fontSize: 10, color: C.muted }}>{selected.contactRole}</div>}
              {selected.phone && <div style={{ fontSize: 11, marginTop: 2 }}><a href={'tel:' + selected.phone.replace(/[^0-9+]/g, '')} style={{ color: '#333', textDecoration: 'none', borderBottom: '1px dotted #ccc' }}>{selected.phone}</a></div>}
              {selected.email && <div style={{ fontSize: 11 }}><a href={'mailto:' + selected.email} style={{ color: '#333', textDecoration: 'none', borderBottom: '1px dotted #ccc' }}>{selected.email}</a></div>}
            </div> : <div style={{ fontSize: 10, color: C.muted }}>No contacts on file</div>}
            {selected.address && <div style={{ fontSize: 10, color: C.muted, marginTop: 6 }}>{selected.address}</div>}
          </div>
          {/* Keywords */}
          {selected.keywords?.length > 0 && <div style={{ marginBottom: 14 }}><div style={lS}>KEYWORDS</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>{selected.keywords.map(k => <span key={k} style={{ fontSize: 8, background: '#e0e7ff', color: '#3b5998', padding: '2px 6px', borderRadius: 4 }}>{k}</span>)}</div>
          </div>}

          {/* Reps */}
          {selected.fieldMapReps?.length > 0 && <div style={{ marginBottom: 14 }}><div style={lS}>SALES REPS · {selected.fieldMapReps.length}</div>
            {selected.fieldMapReps.map(r => <div key={r.id} style={{ padding: '4px 0', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 11, fontWeight: 600 }}>{r.user.name}</span>
              {r.user.primaryCompany && <span style={{ fontSize: 8, color: r.user.primaryCompany.color, fontWeight: 600 }}>{r.user.primaryCompany.name}</span>}</div>
              {r.user.email && <div style={{ fontSize: 9, color: C.muted }}>{r.user.email}</div>}
            </div>)}
          </div>}

          {/* Equipment */}
          {selected.equipment?.length > 0 && <div style={{ marginBottom: 14 }}><div style={lS}>INSTALLED EQUIPMENT · {selected.equipment.length}</div>
            {selected.equipment.map(e => <div key={e.id} style={{ padding: '5px 0', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, fontWeight: 600 }}>{e.model}</span>
                {e.company && <span style={{ fontSize: 7, fontWeight: 700, color: '#fff', background: e.company.color, padding: '1px 5px', borderRadius: 6, marginLeft: 4 }}>{e.company.name}</span>}
                <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 6px', borderRadius: 8, background: e.status === 'active' ? '#dcfce7' : e.status === 'service' ? '#fef3c7' : '#f3f4f6', color: e.status === 'active' ? C.green : e.status === 'service' ? '#d97706' : C.muted }}>{e.status}</span>
              </div>
              <div style={{ fontSize: 9, color: C.muted }}>{e.serial ? 'SN ' + e.serial : ''}{e.year ? ' · ' + e.year : ''}</div>
            </div>)}
          </div>}

          {/* Last visit */}
          {selected.visits?.[0] && <div style={{ marginBottom: 14 }}><div style={lS}>LAST VISIT</div>
            <div style={{ fontSize: 11, color: '#333' }}>{new Date(selected.visits[0].visitDate).toLocaleDateString()} — {VISIT_TYPES[selected.visits[0].type] || selected.visits[0].type}</div>
            {selected.visits[0].notes && <div style={{ fontSize: 10, color: C.muted, fontStyle: 'italic', marginTop: 2 }}>{selected.visits[0].notes}</div>}
            <div style={{ fontSize: 9, color: C.muted }}>by {selected.visits[0].user?.name}</div>
          </div>}

          {/* Notes */}
          {selected.notes && <div style={{ padding: '10px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, fontSize: 11, color: '#dc2626' }}><div style={{ fontWeight: 700, marginBottom: 2 }}>Notes</div>{selected.notes}</div>}
        </div>}
      </div>

      {/* ═══ LOG VISIT MODAL ═══ */}
      {visitModal && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setVisitModal(null)}>
        <div style={{ background: '#fff', borderRadius: 14, padding: 24, width: 460, maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.navy, marginBottom: 4 }}>Log Visit</div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>{visitModal.name}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div><div style={lS}>VISIT TYPE</div><select value={visitForm.type} onChange={e => setVisitForm(p => ({ ...p, type: e.target.value }))} style={iS}>{Object.entries(VISIT_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            <div><div style={lS}>DATE</div><input type="date" value={visitForm.visitDate || new Date().toISOString().slice(0, 10)} onChange={e => setVisitForm(p => ({ ...p, visitDate: e.target.value }))} style={iS} /></div>
          </div>
          <div style={{ marginBottom: 10 }}><div style={lS}>NOTES</div><textarea value={visitForm.notes} onChange={e => setVisitForm(p => ({ ...p, notes: e.target.value }))} rows={3} placeholder="What was discussed, next steps..." style={{ ...iS, resize: 'vertical' }} /></div>
          <div style={{ marginBottom: 16 }}><div style={lS}>FOLLOW-UP DATE</div><input type="date" value={visitForm.followUpDate} onChange={e => setVisitForm(p => ({ ...p, followUpDate: e.target.value }))} style={iS} /></div>

          {/* Visit history */}
          {visitHistory.length > 0 && <div style={{ marginBottom: 16 }}>
            <div style={lS}>RECENT VISITS</div>
            {visitHistory.slice(0, 5).map(v => <div key={v.id} style={{ padding: '6px 0', borderBottom: '1px solid #f3f4f6', fontSize: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontWeight: 600 }}>{new Date(v.visitDate).toLocaleDateString()} — {VISIT_TYPES[v.type]}</span><span style={{ color: C.muted }}>{v.user?.name}</span></div>
              {v.notes && <div style={{ color: C.muted, fontStyle: 'italic', marginTop: 1 }}>{v.notes}</div>}
            </div>)}
          </div>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button onClick={() => setVisitModal(null)} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid ' + C.border, background: '#fff', color: '#666', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
            <button onClick={logVisit} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: C.navy, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Log Visit</button>
          </div>
        </div>
      </div>}

      {/* ═══ EDIT CUSTOMER MODAL ═══ */}
      {editForm && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setEditForm(null)}>
        <div style={{ background: '#fff', borderRadius: 14, width: 780, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
          <div style={{ borderBottom: '3px solid #003250', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#fff', zIndex: 10, borderRadius: '14px 14px 0 0' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#003250' }}>{editForm.id ? 'Edit Customer' : 'Add New Customer'}</div>
            <button onClick={() => setEditForm(null)} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer', color: '#8b919e' }}>x</button>
          </div>
          <div style={{ padding: '16px 24px 24px' }}>
            <CustomerForm form={editForm} setForm={setEditForm} companies={companies} allCustomers={customers} onSave={saveCustomer} onCancel={() => setEditForm(null)} isNew={!editForm.id} />
          </div>
        </div>
      </div>}
    </div>
  );
}
