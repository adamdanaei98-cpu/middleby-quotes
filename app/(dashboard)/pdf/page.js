// app/(dashboard)/pdf/page.js
'use client';
import { useState, useEffect, Fragment } from 'react';
import { dbToPrototypeCatalog, gP, cTot, itemDN, fP, C } from '@/lib/transform';

export default function PDFPage() {
  const [cats, setCats] = useState({});
  const [sels, setSels] = useState({});
  const [companies, setCompanies] = useState({});
  const [loading, setLoading] = useState(true);
  const [ci] = useState({ name: '', contact: '', email: '', rep: '', proposalNumber: 'QC-000001', revision: '1', purpose: '' });
  const mode = 'bundle';
  const terms = '1. PRICING: All prices are in US Dollars and are valid for 30 days.\n\n2. PAYMENT TERMS: 30% deposit with order, balance net 30 days from shipment.\n\n3. DELIVERY: Estimated 16-20 weeks from receipt of order.\n\n4. WARRANTY: 12 months from startup or 15 months from shipment.';

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/catalog');
      const data = await res.json();
      const { cats: c, companies: co, initSels } = dbToPrototypeCatalog(data.companies || []);
      setCats(c); setCompanies(co); setSels(initSels); setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 56px)' }}><div style={{ fontSize: 16, color: C.muted }}>Loading...</div></div>;

  const tots = Object.entries(cats).map(([k, cat]) => [k, cTot(cat, sels[k] || {})]);
  const gt = tots.reduce((a, [, t]) => a + t.g, 0);
  const activeCos = tots.filter(([, t]) => t.g > 0).map(([k]) => k);
  const stripe = <div style={{ height: 4, background: 'linear-gradient(90deg, ' + C.navy + ' 40%, ' + C.blue + ' 40%, ' + C.blue + ' 70%, ' + C.red + ' 70%)' }} />;
  const ps = { width: 720, margin: '0 auto 20px', background: '#fff', boxShadow: '0 2px 20px rgba(0,0,0,.1)', fontFamily: 'Calibri, sans-serif' };
  const hdr = () => <div>{stripe}<div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 40px 8px' }}><span style={{ fontSize: 18, fontWeight: 800, color: C.navy, fontStyle: 'italic' }}>MIDDLEBY</span><span style={{ fontSize: 8, color: C.muted }}>FOOD PROCESSING</span></div></div>;

  return (
    <div style={{ padding: 20, background: '#e5e7eb', minHeight: 'calc(100vh - 56px)' }}>
      <div className="no-print" style={{ textAlign: 'center', marginBottom: 16 }}>
        <button onClick={() => window.print()} style={{ padding: '8px 24px', borderRadius: 8, border: 'none', background: C.green, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>Print / Save PDF</button>
      </div>

      {/* Cover page */}
      <div className="pdf-doc pdf-page" style={ps}>
        {hdr()}
        <div style={{ padding: '10px 40px 30px' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.navy, marginBottom: 4 }}>{mode === 'bundle' ? 'Bundle Equipment Proposal' : 'Equipment Proposal'}</div>
          <div style={{ fontSize: 10, color: C.muted, marginBottom: 16 }}>Proposal #{ci.proposalNumber} • Rev. {ci.revision} • {new Date().toLocaleDateString()}</div>
          <div style={{ display: 'flex', gap: 20, marginBottom: 20, padding: '14px 18px', background: '#f8f9fb', borderRadius: 8, border: '1px solid ' + C.border }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: C.muted, letterSpacing: '.06em', marginBottom: 3 }}>PREPARED FOR</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{ci.name || '—'}</div>
              {ci.contact && <div style={{ fontSize: 11, color: '#555' }}>{ci.contact}</div>}
            </div>
            {ci.rep && <div style={{ flex: 1 }}><div style={{ fontSize: 8, fontWeight: 700, color: C.muted, letterSpacing: '.06em', marginBottom: 3 }}>YOUR REPRESENTATIVE</div><div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{ci.rep}</div></div>}
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
            {activeCos.map(k => <div key={k} style={{ padding: '5px 12px', background: companies[k]?.color, borderRadius: 5 }}><span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{companies[k]?.name}</span></div>)}
          </div>
          {activeCos.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: C.muted, fontSize: 13 }}>Select items in the Builder to generate the PDF proposal.</div>}
        </div>
        {stripe}
      </div>

      {/* Per-company pages */}
      {activeCos.map(k => {
        const co = companies[k]; const cat = cats[k] || {}; const items = [];
        Object.entries(cat).forEach(([s, sec]) => (sec.items || []).forEach(it => { if (sels[k]?.[it.id]?.on) items.push({ sec: s, it, sl: sels[k][it.id] }); }));
        const coTotal = cTot(cat, sels[k] || {}).g;
        return (
          <div key={k} className="pdf-doc pdf-page" style={ps}>
            {hdr()}
            <div style={{ padding: '10px 40px 30px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 6, height: 28, borderRadius: 3, background: co.color }} />
                <div style={{ flex: 1 }}><div style={{ fontSize: 18, fontWeight: 800, color: co.color }}>{co.name}</div><div style={{ fontSize: 10, color: C.muted }}>{co.desc}</div></div>
                <div style={{ fontSize: 16, fontWeight: 800, color: co.color }}>{fP(coTotal)}</div>
              </div>
              {co.machineImg && <div style={{ textAlign: 'center', padding: 20, background: 'linear-gradient(135deg,#f8f9fb,#eef0f4)', borderRadius: 10, marginBottom: 14, border: '1px solid #e8eaee' }}><img src={co.machineImg} style={{ maxWidth: '100%', maxHeight: 240, objectFit: 'contain' }} /></div>}
              {co.execSummary && <div style={{ fontSize: 10, lineHeight: 1.6, color: '#444', marginBottom: 14, padding: '10px 14px', background: '#fafbfc', borderRadius: 6, borderLeft: '3px solid ' + co.color }}>{co.execSummary}</div>}
              {items.map((x, i) => {
                const prev = i > 0 ? items[i - 1].sec : null; const pr = gP(x.it, x.sl); const dn = itemDN(x.it, x.sl);
                return (
                  <Fragment key={i}>
                    {x.sec !== prev && <div style={{ fontSize: 12, fontWeight: 700, color: co.color, marginTop: 14, marginBottom: 4, paddingBottom: 3, borderBottom: '1px solid ' + co.color + '40' }}>{x.sec}</div>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}><span style={{ fontSize: 11, fontWeight: 600 }}>{dn}{x.it.hq && x.sl.q > 0 ? ' — Qty. ' + x.sl.q : ''}</span><span style={{ fontSize: 11, fontWeight: 700, color: co.color }}>{fP(pr)}</span></div>
                    {x.it.desc && <div style={{ fontSize: 10, color: '#666', paddingLeft: 10, fontStyle: 'italic', marginTop: 1 }}>{x.it.desc}</div>}
                  </Fragment>
                );
              })}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, paddingTop: 8, borderTop: '2px solid ' + co.color }}><span style={{ fontSize: 13, fontWeight: 800, color: co.color }}>{co.name} Total</span><span style={{ fontSize: 13, fontWeight: 800 }}>{fP(coTotal)}</span></div>
            </div>
            {stripe}
          </div>
        );
      })}

      {/* Summary page */}
      {activeCos.length > 0 && (
        <div className="pdf-doc pdf-page" style={ps}>
          {hdr()}
          <div style={{ padding: '10px 40px 30px' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.navy, marginBottom: 14 }}>Price Summary</div>
            {activeCos.map(k => {
              const t = cTot(cats[k] || {}, sels[k] || {});
              return <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: companies[k]?.color }} /><span style={{ fontSize: 12, fontWeight: 700, color: companies[k]?.color }}>{companies[k]?.name}</span></div><span style={{ fontSize: 12, fontWeight: 700 }}>{fP(t.g)}</span></div>;
            })}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', marginTop: 4, borderTop: '3px double ' + C.navy }}><span style={{ fontSize: 15, fontWeight: 800, color: C.navy }}>TOTAL:</span><span style={{ fontSize: 15, fontWeight: 800 }}>{fP(gt)}</span></div>
            {terms && <div style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid #ddd' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 10 }}>Terms & Conditions</div>
              {terms.split('\n').map((line, i) => {
                if (!line.trim()) return <div key={i} style={{ height: 6 }} />;
                const isH = /^\d+\./.test(line.trim());
                return <div key={i} style={{ fontSize: 9, lineHeight: 1.6, color: isH ? '#333' : '#555', fontWeight: isH ? 600 : 400 }}>{line}</div>;
              })}
            </div>}
          </div>
          {stripe}
        </div>
      )}
    </div>
  );
}
