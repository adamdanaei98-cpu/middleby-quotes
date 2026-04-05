// app/(dashboard)/builder/page.js
'use client';
import { useState } from 'react';
import { useQuote } from '@/components/QuoteProvider';
import { useAuth } from '@/components/AuthProvider';
import { gP, cTot, fP, C } from '@/lib/transform';

function Tog({ on, set, color }) {
  return (
    <button onClick={() => set(!on)} style={{ width: 40, height: 22, borderRadius: 11, border: 'none', background: on ? (color || C.navy) : '#d1d5db', cursor: 'pointer', position: 'relative', padding: 0, flexShrink: 0 }}>
      <span style={{ position: 'absolute', top: 2, left: on ? 20 : 2, width: 18, height: 18, borderRadius: 9, background: '#fff', transition: 'left .15s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
    </button>
  );
}

function CatPanel({ label, color, cat, sel, setSel, bg2 }) {
  const [openSec, setOS] = useState(null);
  const t = cTot(cat, sel);
  const cnt = Object.values(sel).filter(x => x && x.on).length;

  function tog(sn, it, v) {
    const n = { ...sel };
    const ds = {};
    if (it.subs) it.subs.forEach(sub => {
      ds[sub.k] = (n[it.id] && n[it.id].subs && n[it.id].subs[sub.k]) || sub.choices[0];
    });
    n[it.id] = {
      ...(n[it.id] || {}),
      on: v,
      q: (n[it.id] && n[it.id].q) || (it.hq ? 1 : 0),
      op: (n[it.id] && n[it.id].op) || (it.ops ? it.ops[0] : undefined),
      subs: { ...(n[it.id] && n[it.id].subs || {}), ...ds },
    };
    setSel(n);
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: color, borderRadius: '10px 10px 0 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{label}</span>
          {cnt > 0 && <span style={{ fontSize: 10, fontWeight: 700, color, background: 'rgba(255,255,255,.9)', padding: '2px 8px', borderRadius: 10 }}>{cnt}</span>}
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{fP(t.g)}</span>
      </div>
      {Object.keys(cat).length === 0 && (
        <div style={{ border: '1px solid ' + C.border, borderTop: 'none', padding: '24px 16px', textAlign: 'center', color: C.muted, fontSize: 12, background: '#fff', borderRadius: '0 0 10px 10px' }}>
          No catalog items yet. Add items in Admin → Catalog.
        </div>
      )}
      {Object.entries(cat).map(([sn, sec]) => {
        const isO = openSec === sn;
        const items = sec.items || [];
        const c = items.filter(i => sel[i.id] && sel[i.id].on).length;
        return (
          <div key={sn} style={{ border: '1px solid ' + C.border, borderTop: 'none', background: '#fff' }}>
            <div onClick={() => setOS(isO ? null : sn)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 16px', cursor: 'pointer', background: isO ? bg2 : '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 8, color: C.muted, display: 'inline-block', transform: isO ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }}>▶</span>
                <span style={{ fontSize: 12, fontWeight: 700 }}>{sn}</span>
                {c > 0 && <span style={{ fontSize: 9, fontWeight: 700, color, background: bg2, padding: '1px 6px', borderRadius: 8 }}>{c}</span>}
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: items.reduce((a, i) => a + gP(i, sel[i.id]), 0) > 0 ? color : C.muted }}>
                {fP(items.reduce((a, i) => a + gP(i, sel[i.id]), 0))}
              </span>
            </div>
            {isO && items.map(it => {
              const s = sel[it.id] || {};
              const pr = gP(it, s);
              return (
                <div key={it.id} style={{ borderTop: '1px solid #f3f4f6', background: s.on ? bg2 : 'transparent' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 16px' }}>
                    <Tog on={!!s.on} set={v => tog(sn, it, v)} color={color} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: C.text }}>{it.n}</div>
                      {it.nt && <div style={{ fontSize: 10, color: C.muted }}>{it.nt}</div>}
                    </div>
                    {it.ops && s.on && (
                      <select
                        value={s.op || it.ops[0]}
                        onChange={e => setSel({ ...sel, [it.id]: { ...s, op: e.target.value } })}
                        style={{ fontSize: 10, padding: '3px 6px', borderRadius: 5, border: '1px solid ' + C.border, minWidth: 70 }}
                      >
                        {it.ops.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    )}
                    {it.hq && s.on && (
                      <input
                        type="number" min="0" value={s.q || ''}
                        placeholder={it.ql || 'qty'}
                        onChange={e => setSel({ ...sel, [it.id]: { ...s, q: parseInt(e.target.value) || 0 } })}
                        style={{ width: 50, fontSize: 11, padding: '3px 6px', borderRadius: 5, border: '1px solid ' + C.border, textAlign: 'center' }}
                      />
                    )}
                    <div style={{ fontSize: 12, fontWeight: 600, color: s.on ? color : C.muted, minWidth: 72, textAlign: 'right' }}>
                      {s.on ? fP(pr) : '—'}
                    </div>
                  </div>
                  {it.subs && it.subs.length > 0 && s.on && (
                    <div style={{ display: 'flex', gap: 8, padding: '0 16px 8px 56px', flexWrap: 'wrap' }}>
                      {it.subs.map(sub => (
                        <div key={sub.k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: 9, fontWeight: 700, color: C.muted }}>{sub.label}:</span>
                          <select
                            value={(s.subs && s.subs[sub.k]) || sub.choices[0]}
                            onChange={e => setSel({ ...sel, [it.id]: { ...s, subs: { ...(s.subs || {}), [sub.k]: e.target.value } } })}
                            style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, border: '1px solid ' + C.border }}
                          >
                            {sub.choices.map(ch => {
                              const m = sub.mod && sub.mod[ch];
                              return <option key={ch} value={ch}>{ch}{m > 0 ? ` (+${fP(m)})` : m < 0 ? ` (${fP(m)})` : ''}</option>;
                            })}
                          </select>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export default function BuilderPage() {
  const { user } = useAuth();
  const { cats, sels, setSels, companies, customers, loading, mode, setMode, ci, setCi, approval, tots, gt } = useQuote();
  const [selectedCustomer, setSelectedCustomer] = useState('');

  const handleCustomerSelect = (cid) => {
    setSelectedCustomer(cid);
    const cust = customers.find(c => c.id === cid);
    if (cust) {
      setCi(prev => ({ ...prev, name: cust.name || '', contact: cust.contact || '', email: cust.email || '', rep: cust.rep || '' }));
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 56px)' }}>
        <div style={{ fontSize: 16, color: C.muted }}>Loading catalog...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 20, maxWidth: 1320, margin: '0 auto', padding: 20 }}>
      {/* Left sidebar */}
      <div style={{ width: 280, flexShrink: 0 }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid ' + C.border, padding: 16, position: 'sticky', top: 64 }}>
          {/* Mode toggle */}
          <div style={{ display: 'flex', gap: 2, marginBottom: 12, background: '#f3f4f6', borderRadius: 8, padding: 3 }}>
            {['individual', 'bundle'].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, background: mode === m ? '#fff' : 'transparent', color: mode === m ? C.navy : C.muted, textTransform: 'capitalize' }}>
                {m} Quote
              </button>
            ))}
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, color: C.navy, letterSpacing: '.06em', marginBottom: 10 }}>PROJECT DETAILS</div>

          {/* Customer dropdown */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.muted }}>CUSTOMER</div>
            <select value={selectedCustomer} onChange={e => handleCustomerSelect(e.target.value)} style={{ width: '100%', padding: '6px 8px', borderRadius: 5, border: '1px solid ' + C.border, fontSize: 11, boxSizing: 'border-box' }}>
              <option value="">Select customer...</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}{c.plant ? ` — ${c.plant}` : ''}</option>)}
            </select>
          </div>

          {[['name', 'Customer Name'], ['contact', 'Contact'], ['email', 'Email'], ['rep', 'Customer Rep'], ['proposalNumber', 'Proposal #'], ['revision', 'Rev']].map(([k, l]) => (
            <div key={k} style={{ marginBottom: 5 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: C.muted }}>{l}</div>
              <input value={ci[k] || ''} onChange={e => setCi({ ...ci, [k]: e.target.value })} style={{ width: '100%', padding: '4px 8px', borderRadius: 5, border: '1px solid ' + C.border, fontSize: 11, boxSizing: 'border-box' }} />
            </div>
          ))}

          <div style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.muted }}>PURPOSE</div>
            <textarea value={ci.purpose || ''} onChange={e => setCi({ ...ci, purpose: e.target.value })} rows={2} style={{ width: '100%', padding: '4px 8px', borderRadius: 5, border: '1px solid ' + C.border, fontSize: 10, boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }} />
          </div>

          {/* Summary */}
          <div style={{ borderTop: '1px solid ' + C.border, paddingTop: 8, marginTop: 6 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.navy, marginBottom: 6 }}>
              {mode === 'bundle' ? 'BUNDLE SUMMARY' : 'QUOTE SUMMARY'}
            </div>
            {tots.filter(([, t]) => mode === 'bundle' || t.g > 0).map(([k, t]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: companies[k]?.color }} />
                  <span style={{ fontWeight: 600 }}>{companies[k]?.name}</span>
                </div>
                <span style={{ fontWeight: 700, color: companies[k]?.color }}>{fP(t.g)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800, color: C.navy, borderTop: '2px solid ' + C.navy, marginTop: 4, paddingTop: 6 }}>
              <span>Total</span>
              <span>{fP(gt)}</span>
            </div>
          </div>

          {/* Approval status */}
          <div style={{ borderTop: '1px solid ' + C.border, paddingTop: 10, marginTop: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.navy, letterSpacing: '.06em' }}>APPROVAL</div>
            <div style={{ fontSize: 9, fontWeight: 600, color: '#6b7085', background: '#f3f4f6', padding: '2px 8px', borderRadius: 10, display: 'inline-block', marginTop: 4 }}>
              {approval.status === 'draft' ? 'Draft' : approval.status}
            </div>
          </div>
        </div>
      </div>

      {/* Main catalog area */}
      <div style={{ flex: 1 }}>
        {Object.keys(companies).map(k => {
          const co = companies[k];
          return (
            <CatPanel
              key={k}
              label={co.name.toUpperCase()}
              color={co.color}
              cat={cats[k] || {}}
              sel={sels[k] || {}}
              setSel={s => setSels(prev => ({ ...prev, [k]: s }))}
              bg2={co.bg}
            />
          );
        })}
      </div>
    </div>
  );
}
