'use client';
import { useState, useEffect, Fragment, Suspense, lazy } from 'react';
import { useRouter } from 'next/navigation';
import { useQuote } from '@/components/QuoteProvider';
import { useAuth } from '@/components/AuthProvider';
import { gP, cTot, fP, C, itemDN } from '@/lib/transform';

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
    if (it.subs) it.subs.forEach(sub => { ds[sub.k] = (n[it.id] && n[it.id].subs && n[it.id].subs[sub.k]) || sub.choices[0]; });
    n[it.id] = { ...(n[it.id] || {}), on: v, q: (n[it.id] && n[it.id].q) || (it.hq ? 1 : 0), op: (n[it.id] && n[it.id].op) || (it.ops ? it.ops[0] : undefined), subs: { ...(n[it.id] && n[it.id].subs || {}), ...ds } };
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
      {Object.keys(cat).length === 0 && <div style={{ border: '1px solid ' + C.border, borderTop: 'none', padding: '24px 16px', textAlign: 'center', color: C.muted, fontSize: 12, background: '#fff', borderRadius: '0 0 10px 10px' }}>No catalog items yet.</div>}
      {Object.entries(cat).map(([sn, sec]) => {
        const isO = openSec === sn; const items = sec.items || []; const c = items.filter(i => sel[i.id] && sel[i.id].on).length;
        return (
          <div key={sn} style={{ border: '1px solid ' + C.border, borderTop: 'none', background: '#fff' }}>
            <div onClick={() => setOS(isO ? null : sn)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 16px', cursor: 'pointer', background: isO ? bg2 : '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 8, color: C.muted, display: 'inline-block', transform: isO ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }}>{'\u25B6'}</span>
                <span style={{ fontSize: 12, fontWeight: 700 }}>{sn}</span>
                {c > 0 && <span style={{ fontSize: 9, fontWeight: 700, color, background: bg2, padding: '1px 6px', borderRadius: 8 }}>{c}</span>}
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: items.reduce((a, i) => a + gP(i, sel[i.id]), 0) > 0 ? color : C.muted }}>{fP(items.reduce((a, i) => a + gP(i, sel[i.id]), 0))}</span>
            </div>
            {isO && items.map(it => {
              const s = sel[it.id] || {}; const pr = gP(it, s);
              return (
                <div key={it.id} style={{ borderTop: '1px solid #f3f4f6', background: s.on ? bg2 : 'transparent' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 16px' }}>
                    <Tog on={!!s.on} set={v => tog(sn, it, v)} color={color} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: C.text }}>{it.n}</div>
                      {it.nt && <div style={{ fontSize: 10, color: C.muted }}>{it.nt}</div>}
                    </div>
                    {it.ops && s.on && <select value={s.op || it.ops[0]} onChange={e => setSel({ ...sel, [it.id]: { ...s, op: e.target.value } })} style={{ fontSize: 10, padding: '3px 6px', borderRadius: 5, border: '1px solid ' + C.border, minWidth: 70 }}>{it.ops.map(o => <option key={o} value={o}>{o}</option>)}</select>}
                    {it.hq && s.on && <input type="number" min="0" value={s.q || ''} placeholder={it.ql || 'qty'} onChange={e => setSel({ ...sel, [it.id]: { ...s, q: parseInt(e.target.value) || 0 } })} style={{ width: 50, fontSize: 11, padding: '3px 6px', borderRadius: 5, border: '1px solid ' + C.border, textAlign: 'center' }} />}
                    <div style={{ fontSize: 12, fontWeight: 600, color: s.on ? color : C.muted, minWidth: 72, textAlign: 'right' }}>{s.on ? fP(pr) : '\u2014'}</div>
                  </div>
                  {it.subs && it.subs.length > 0 && s.on && (
                    <div style={{ display: 'flex', gap: 8, padding: '0 16px 8px 56px', flexWrap: 'wrap' }}>
                      {it.subs.map(sub => (
                        <div key={sub.k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: 9, fontWeight: 700, color: C.muted }}>{sub.label}:</span>
                          <select value={(s.subs && s.subs[sub.k]) || sub.choices[0]} onChange={e => setSel({ ...sel, [it.id]: { ...s, subs: { ...(s.subs || {}), [sub.k]: e.target.value } } })} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, border: '1px solid ' + C.border }}>
                            {sub.choices.map(ch => { const m = sub.mod && sub.mod[ch]; return <option key={ch} value={ch}>{ch}{m > 0 ? ` (+${fP(m)})` : m < 0 ? ` (${fP(m)})` : ''}</option>; })}
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
  const router = useRouter();
  const { cats, sels, setSels, companies, customers, loading, mode, setMode, ci, setCi, approval, setApproval, tots, gt, terms } = useQuote();
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selReviewer, setSelReviewer] = useState('');
  const [submitNote, setSubmitNote] = useState('');
  const [reviewers, setReviewers] = useState([]);
  const [activeCos, setActiveCos] = useState({}); // {companyKey: true/false} for bundle mode
  const [previewModal, setPreviewModal] = useState(null); // 'pdf' or 'margin'

  const coKeys = Object.keys(companies);
  // Find user's company key
  const userCoKey = coKeys.find(k => companies[k]?.id === user?.primaryCompanyId) || coKeys[0] || null;

  useEffect(() => {
    fetch('/api/users').then(r => r.ok ? r.json() : {}).then(d => {
      const allReviewers = (d.users || []).filter(u => u.role === 'reviewer');
      // Filter to same company as current user (corporate sees all)
      const myCoId = user?.primaryCompanyId;
      const filtered = myCoId ? allReviewers.filter(u => u.primaryCompanyId === myCoId) : allReviewers;
      setReviewers(filtered);
    }).catch(() => {});
  }, [user]);

  // Initialize activeCos when companies load
  useEffect(() => {
    if (coKeys.length > 0 && Object.keys(activeCos).length === 0) {
      const init = {};
      coKeys.forEach(k => { init[k] = k === userCoKey; }); // default: only user's company on
      setActiveCos(init);
    }
  }, [coKeys.length]);

  const handleCustomerSelect = (cid) => {
    setSelectedCustomer(cid);
    const cust = customers.find(c => c.id === cid);
    if (cust) setCi(prev => ({ ...prev, name: cust.name || '', contact: cust.contact || '', email: cust.email || '', rep: cust.rep || '' }));
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 56px)' }}><div style={{ fontSize: 16, color: C.muted }}>Loading catalog...</div></div>;

  const isCorporate = user.role === 'supervisor' || (user.role === 'it' && !user.primaryCompanyId) || (user.isAdmin && !user.primaryCompanyId);

  // Which companies are visible?
  const visibleCos = mode === 'individual'
    ? (isCorporate ? [] : coKeys.filter(k => k === userCoKey)) // corporate sees nothing in individual
    : coKeys.filter(k => activeCos[k]); // bundle: only toggled companies

  // Filtered tots for summary
  const visTots = tots.filter(([k]) => visibleCos.includes(k));
  const visGt = visTots.reduce((a, [, t]) => a + t.g, 0);

  const statusColors = { draft: '#6b7085', pending: '#d97706', approved: '#16a34a', rejected: '#dc2626' };
  const statusLabels = { draft: 'Draft', pending: 'Pending Review', approved: 'Approved', rejected: 'Rejected' };

  return (
    <div>
      {/* Preview buttons centered under nav */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '8px 0' }}>
        <button onClick={() => setPreviewModal('pdf')} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid ' + C.navy, background: '#fff', color: C.navy, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>View PDF</button>
        <button onClick={() => setPreviewModal('margin')} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #059669', background: '#fff', color: '#059669', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>View Margin</button>
      </div>

    <div style={{ display: 'flex', gap: 20, maxWidth: 1320, margin: '0 auto', padding: 20 }}>
      <div style={{ width: 280, flexShrink: 0 }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid ' + C.border, padding: 16, position: 'sticky', top: 64 }}>
          <div style={{ display: 'flex', gap: 2, marginBottom: 12, background: '#f3f4f6', borderRadius: 8, padding: 3 }}>
            {['individual', 'bundle'].map(m => <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, background: mode === m ? '#fff' : 'transparent', color: mode === m ? C.navy : C.muted, textTransform: 'capitalize' }}>{m} Quote</button>)}
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.navy, letterSpacing: '.06em', marginBottom: 10 }}>PROJECT DETAILS</div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.muted }}>CUSTOMER</div>
            <select value={selectedCustomer} onChange={e => handleCustomerSelect(e.target.value)} style={{ width: '100%', padding: '6px 8px', borderRadius: 5, border: '1px solid ' + C.border, fontSize: 11, boxSizing: 'border-box' }}>
              <option value="">Select customer...</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}{c.plant ? ` \u2014 ${c.plant}` : ''}</option>)}
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
          <div style={{ borderTop: '1px solid ' + C.border, paddingTop: 8, marginTop: 6 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.navy, marginBottom: 6 }}>{mode === 'bundle' ? 'BUNDLE SUMMARY' : 'QUOTE SUMMARY'}</div>
            {visTots.filter(([, t]) => mode === 'bundle' || t.g > 0).map(([k, t]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: companies[k]?.color }} />
                  <span style={{ fontWeight: 600 }}>{companies[k]?.name}</span>
                </div>
                <span style={{ fontWeight: 700, color: companies[k]?.color }}>{fP(t.g)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800, color: C.navy, borderTop: '2px solid ' + C.navy, marginTop: 4, paddingTop: 6 }}>
              <span>Total</span><span>{fP(visGt)}</span>
            </div>
          </div>
          <div style={{ borderTop: '1px solid ' + C.border, paddingTop: 10, marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.navy, letterSpacing: '.06em' }}>APPROVAL</div>
              <span style={{ fontSize: 9, fontWeight: 700, color: statusColors[approval.status], background: statusColors[approval.status] + '18', padding: '2px 8px', borderRadius: 10 }}>{statusLabels[approval.status] || 'Draft'}</span>
            </div>
            {isCorporate ? <div style={{ fontSize: 10, color: C.muted, fontStyle: 'italic' }}>Corporate — view only</div> :
            approval.status === 'draft' || approval.status === 'info_requested' ? <div>
              {approval.status === 'info_requested' && approval.infoNote && <div style={{ fontSize: 10, color: '#9333ea', background: '#f3e8ff', padding: '6px 10px', borderRadius: 6, marginBottom: 8 }}>Info requested: "{approval.infoNote}"</div>}
              <div style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: C.muted, marginBottom: 3 }}>SUBMIT TO</div>
                <select value={selReviewer} onChange={e => setSelReviewer(e.target.value)} style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid ' + C.border, fontSize: 11, boxSizing: 'border-box', background: '#fff' }}>
                  <option value="">Select reviewer...</option>
                  {reviewers.map(u => <option key={u.id} value={u.id}>{u.name} — Reviewer</option>)}
                </select></div>
              <div style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: C.muted, marginBottom: 3 }}>NOTE (optional)</div>
                <input value={submitNote} onChange={e => setSubmitNote(e.target.value)} placeholder="Add a note for the reviewer..." style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid ' + C.border, fontSize: 10, boxSizing: 'border-box' }} /></div>
              <button onClick={async () => {
                if (!selReviewer) return;
                try {
                  const activeCosKeys = visibleCos.filter(k => Object.values(sels[k] || {}).some(s => s && s.on));
                  if (activeCosKeys.length === 0) { alert('Select at least one item before submitting'); return; }
                  const res = await fetch('/api/quotes', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mode, customerId: selectedCustomer || null, customerName: ci.name, contactName: ci.contact, contactEmail: ci.email, repName: ci.rep, purpose: ci.purpose, selections: sels, grandTotal: visGt, companyKeys: activeCosKeys, terms }),
                  });
                  if (res.ok) {
                    const { quote } = await res.json();
                    await fetch('/api/quotes/' + quote.id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'submit', reviewerId: selReviewer, note: submitNote }) });
                    setApproval({ status: 'pending', reviewer: selReviewer, submittedAt: new Date().toLocaleString(), note: submitNote, quoteId: quote.id });
                    setSubmitNote('');
                    alert('Quote ' + quote.quoteNumber + ' submitted for review!');
                  } else { const d = await res.json(); alert('Error: ' + (d.error || 'Failed')); }
                } catch (e) { alert('Error: ' + e.message); }
              }} disabled={!selReviewer} style={{ width: '100%', padding: 8, borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 700, cursor: selReviewer ? 'pointer' : 'default', background: selReviewer ? '#d97706' : '#e5e7eb', color: selReviewer ? '#fff' : '#aaa' }}>{approval.status === 'info_requested' ? 'Resubmit' : 'Submit for Review'}</button>
            </div> : approval.status === 'pending' ? <div>
              <div style={{ fontSize: 11, color: C.text, marginBottom: 4 }}>Sent to: <strong>{(reviewers.find(u => u.id === approval.reviewer) || {}).name || 'Unknown'}</strong></div>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>{approval.submittedAt}</div>
              {approval.note && <div style={{ fontSize: 10, color: '#555', fontStyle: 'italic', marginBottom: 6 }}>{'\u201C'}{approval.note}{'\u201D'}</div>}
              <button onClick={async () => {
                if (approval.quoteId) {
                  try { await fetch('/api/quotes/' + approval.quoteId, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'recall' }) }); } catch {}
                }
                setApproval({ status: 'draft', reviewer: null, submittedAt: null, note: '', quoteId: null });
              }} style={{ width: '100%', padding: 6, borderRadius: 6, border: '1px solid ' + C.border, fontSize: 10, fontWeight: 600, cursor: 'pointer', background: '#fff', color: C.muted }}>Recall Submission</button>
            </div> : <div>
              <div style={{ fontSize: 11, color: C.text, marginBottom: 4 }}>{approval.status === 'approved' ? '\u2713 Approved' : 'Returned'} by: <strong>{(reviewers.find(u => u.id === approval.reviewer) || {}).name || 'Unknown'}</strong></div>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 6 }}>{approval.submittedAt}</div>
              <button onClick={() => setApproval({ status: 'draft', reviewer: null, submittedAt: null, note: '', quoteId: null })} style={{ width: '100%', padding: 6, borderRadius: 6, border: '1px solid ' + C.border, fontSize: 10, fontWeight: 600, cursor: 'pointer', background: '#fff', color: C.muted }}>New Quote</button>
            </div>}
          </div>
        </div>
      </div>
      <div style={{ flex: 1 }}>
        {/* Company toggles for bundle mode */}
        {mode === 'bundle' && coKeys.length > 1 && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap', padding: '10px 14px', background: '#fff', borderRadius: 10, border: '1px solid ' + C.border }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, alignSelf: 'center', marginRight: 4 }}>INCLUDE:</span>
            {coKeys.map(k => {
              const co = companies[k]; const on = activeCos[k];
              return <button key={k} onClick={() => setActiveCos(prev => ({ ...prev, [k]: !prev[k] }))} style={{ padding: '5px 14px', borderRadius: 6, border: '2px solid ' + co.color, cursor: 'pointer', fontSize: 11, fontWeight: 700, background: on ? co.color : 'transparent', color: on ? '#fff' : co.color, transition: 'all .15s' }}>{co.name}</button>;
            })}
          </div>
        )}
        {mode === 'individual' && isCorporate && (
          <div style={{ padding: '20px 14px', background: '#fef9c3', borderRadius: 8, marginBottom: 16, fontSize: 12, color: '#92400e', textAlign: 'center' }}>
            Corporate users cannot create individual quotes — no company assigned. Switch to Bundle mode to view catalogs.
          </div>
        )}
        {isCorporate && (
          <div style={{ padding: '8px 14px', background: '#f0f2f5', borderRadius: 8, marginBottom: 16, fontSize: 11, color: C.muted, textAlign: 'center' }}>
            Corporate view only — quotes are created by company-level Sales Reps.
          </div>
        )}
        {mode === 'individual' && !isCorporate && coKeys.length > 1 && (
          <div style={{ padding: '8px 14px', background: '#f8f9fb', borderRadius: 8, marginBottom: 16, fontSize: 11, color: C.muted }}>
            Individual mode — showing only <strong style={{ color: companies[userCoKey]?.color }}>{companies[userCoKey]?.name}</strong> items
          </div>
        )}
        {visibleCos.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: C.muted, fontSize: 12, background: '#fff', borderRadius: 10, border: '1px dashed ' + C.border }}>Select at least one company above to see catalog items.</div>}
        {visibleCos.map(k => {
          const co = companies[k];
          return <CatPanel key={k} label={co.name.toUpperCase()} color={co.color} cat={cats[k] || {}} sel={sels[k] || {}} setSel={s => setSels(prev => ({ ...prev, [k]: s }))} bg2={co.bg} />;
        })}
      </div>
    </div>

    {/* Preview Modal */}
    {previewModal && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflow: 'auto', padding: '30px 20px' }} onClick={() => setPreviewModal(null)}>
      <div style={{ background: '#fff', borderRadius: 14, width: previewModal === 'margin' ? 1100 : 800, maxWidth: '95vw', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.3)' }} onClick={e => e.stopPropagation()}>
        {/* Modal header */}
        <div style={{ position: 'sticky', top: 0, background: '#fff', borderBottom: '1px solid #e2e4e9', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, borderRadius: '14px 14px 0 0' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.navy }}>{previewModal === 'pdf' ? 'PDF Preview' : 'Margin Preview'}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setPreviewModal(null); router.push(previewModal === 'pdf' ? '/pdf' : '/margin'); }} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid ' + C.navy, background: '#fff', color: C.navy, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Open Full Page</button>
            <button onClick={() => setPreviewModal(null)} style={{ padding: '6px 16px', borderRadius: 8, border: '1px solid #e2e4e9', background: '#fff', color: '#666', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Close</button>
          </div>
        </div>
        {/* Modal content */}
        <div style={{ padding: 20, background: '#f4f5f7' }}>
          {previewModal === 'pdf' && <PDFPreview />}
          {previewModal === 'margin' && <MarginPreview />}
        </div>
      </div>
    </div>}
    </div>
  );
}

// ═══ Inline PDF Preview Component ═══
function PDFPreview() {
  const { cats, sels, companies, ci, mode, terms, navLogo, pdfLogo } = useQuote();
  const { user } = useAuth();

  const activeCos = Object.keys(cats).filter(k => {
    const cat = cats[k]||{};
    return Object.values(cat).some(sec => (sec.items||[]).some(it => sels[k]?.[it.id]?.on));
  });
  let gt = 0;
  activeCos.forEach(k => { gt += cTot(cats[k]||{}, sels[k]||{}).g; });

  const stripe = <div style={{height:4,background:`linear-gradient(90deg,${C.navy} 40%,${C.blue} 40%,${C.blue} 70%,${C.red} 70%)`}} />;
  const hdr = <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingBottom:8,borderBottom:'1px solid #eee',marginBottom:12}}>
    <div style={{display:'flex',alignItems:'center',gap:8}}>
      {pdfLogo ? <img src={pdfLogo} style={{height:18,objectFit:'contain'}} /> : <span style={{fontSize:11,fontWeight:800,color:C.navy,fontStyle:'italic'}}>MIDDLEBY</span>}
      <span style={{fontSize:6.5,color:C.muted,letterSpacing:'.08em'}}>FOOD PROCESSING</span>
    </div>
    <span style={{fontSize:7.5,color:C.muted}}>{ci.proposalNumber||''}</span>
  </div>;

  if (activeCos.length === 0) return <div className="page-letter"><div className="page-content" style={{textAlign:'center',color:C.muted,paddingTop:60}}>Select items in the Builder first.</div></div>;

  return <>
    {/* Cover */}
    <div className="page-letter">
      <div className="page-stripe">{stripe}</div>
      <div className="page-content">
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:24}}>
          {pdfLogo ? <img src={pdfLogo} style={{height:36,objectFit:'contain'}} /> : <span style={{fontSize:26,fontWeight:800,color:C.navy,fontStyle:'italic'}}>MIDDLEBY</span>}
          <span style={{fontSize:8,color:C.muted,letterSpacing:'.1em'}}>FOOD PROCESSING</span>
        </div>
        <div style={{fontSize:26,fontWeight:800,color:C.navy,marginBottom:4}}>Equipment Proposal</div>
        <div style={{fontSize:15,fontWeight:600,color:C.navy,marginBottom:24}}>{mode==='bundle'?'Complete Line Solution':'Individual Quote'} for {ci.name||'Customer'}</div>
        {(ci.name||ci.contact)&&<div style={{background:'#f8f9fb',borderRadius:8,padding:'14px 18px',marginBottom:20,border:'1px solid #eef0f2'}}>
          <div style={{fontSize:8,fontWeight:700,color:C.muted,letterSpacing:'.06em',marginBottom:4}}>PREPARED FOR</div>
          <div style={{fontSize:17,fontWeight:700,color:C.navy}}>{ci.name||'—'}</div>
          {ci.contact&&<div style={{fontSize:11,color:'#555',marginTop:3}}>Attn: {ci.contact}</div>}
        </div>}
        <div style={{display:'flex',gap:30,fontSize:10,color:C.muted,marginBottom:24}}>
          <div><strong>Proposal #:</strong> {ci.proposalNumber||'—'}</div>
          <div><strong>Rev:</strong> {ci.revision||'1'}</div>
          <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
        </div>
        <div style={{height:2,background:C.navy,marginBottom:20}} />
        {activeCos.map(k => {
          const co = companies[k]; if (!co) return null;
          const ct = cTot(cats[k]||{}, sels[k]||{}).g;
          return <div key={k} style={{display:'flex',gap:16,padding:'14px 16px',marginBottom:10,borderRadius:10,border:'1px solid '+co.color+'30',background:co.color+'06'}}>
            {co.machineImg ? <img src={co.machineImg} style={{width:100,height:70,objectFit:'contain',borderRadius:6,background:'#f8f9fb',flexShrink:0}} />
              : <div style={{width:50,height:50,borderRadius:10,background:co.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,fontWeight:800,color:'#fff',flexShrink:0}}>{co.name[0]}</div>}
            <div style={{flex:1}}>
              <div style={{display:'flex',justifyContent:'space-between'}}><span style={{fontSize:15,fontWeight:700,color:co.color}}>{co.name}</span><span style={{fontSize:14,fontWeight:800,color:co.color}}>{fP(ct)}</span></div>
              <div style={{fontSize:9,color:co.color,opacity:.7}}>{co.desc||''}</div>
              {co.execSummary&&<div style={{fontSize:8.5,lineHeight:1.5,color:'#555',marginTop:4}}>{co.execSummary}</div>}
            </div>
          </div>;
        })}
        <div style={{marginTop:16,borderTop:'3px double '+C.navy,paddingTop:12,display:'flex',justifyContent:'space-between'}}>
          <span style={{fontSize:16,fontWeight:800,color:C.navy}}>{mode==='bundle'?'Bundle Total':'Total'}</span>
          <span style={{fontSize:16,fontWeight:800,color:C.navy}}>{fP(gt)}</span>
        </div>
      </div>
      <div className="page-stripe">{stripe}</div>
    </div>

    {/* Company pages */}
    {activeCos.map(k => {
      const co = companies[k]; if (!co) return null;
      const cat = cats[k]||{}; const ct = cTot(cat, sels[k]||{}).g;
      return <div key={k} className="page-letter">
        <div className="page-stripe">{stripe}</div>
        <div className="page-content">
          {hdr}
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
            <div style={{width:4,height:26,borderRadius:2,background:co.color}} />
            <div style={{fontSize:20,fontWeight:800,color:co.color}}>{co.name}</div>
          </div>
          {co.machineImg&&<div style={{textAlign:'center',padding:14,background:'linear-gradient(135deg,#f8f9fb,#eef0f4)',borderRadius:10,marginBottom:14}}><img src={co.machineImg} style={{maxWidth:'100%',maxHeight:160,objectFit:'contain'}} /></div>}
          {co.execSummary&&<div style={{fontSize:9.5,lineHeight:1.6,color:'#444',marginBottom:14,padding:'10px 14px',background:'#fafbfc',borderRadius:6,borderLeft:'3px solid '+co.color}}>{co.execSummary}</div>}
          {Object.entries(cat).map(([sn, sec]) => {
            const items = (sec.items||[]).filter(it => { const s = sels[k]?.[it.id]; return s?.on && (gP(it,s)>0||(it.hq&&s.q>0)); });
            if (!items.length) return null;
            return <div key={sn} style={{marginBottom:10}}>
              <div style={{fontSize:12,fontWeight:700,color:co.color,marginBottom:4,paddingBottom:3,borderBottom:'1px solid '+co.color+'30'}}>{sn}</div>
              {items.map(it => { const s=sels[k][it.id]; const pr=gP(it,s); const dn=itemDN(it,s);
                return <div key={it.id} style={{padding:'4px 0 3px 8px',borderBottom:'1px solid #f3f4f6'}}>
                  <div style={{display:'flex',justifyContent:'space-between'}}><span style={{fontSize:10.5,fontWeight:600,color:'#333'}}>{dn}{it.hq&&s.q>0?' — Qty. '+s.q:''}</span><span style={{fontSize:10.5,fontWeight:700,color:co.color}}>{fP(pr)}</span></div>
                </div>;
              })}
            </div>;
          })}
          <div style={{marginTop:12,borderTop:'2px solid '+co.color,paddingTop:8,display:'flex',justifyContent:'space-between'}}>
            <span style={{fontSize:13,fontWeight:800,color:co.color}}>{co.name} Total</span>
            <span style={{fontSize:13,fontWeight:800,color:co.color}}>{fP(ct)}</span>
          </div>
        </div>
        <div className="page-stripe">{stripe}</div>
      </div>;
    })}

    {/* Summary */}
    <div className="page-letter">
      <div className="page-stripe">{stripe}</div>
      <div className="page-content">
        {hdr}
        <div style={{fontSize:20,fontWeight:800,color:C.navy,marginBottom:20}}>Price Summary</div>
        <div style={{maxWidth:420}}>
          {activeCos.map(k => { const co=companies[k]; return co?<div key={k} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid #f3f4f6'}}><span style={{fontSize:13,fontWeight:700,color:co.color}}>{co.name}</span><span style={{fontSize:13,fontWeight:700,color:'#333'}}>{fP(cTot(cats[k]||{},sels[k]||{}).g)}</span></div>:null; })}
          <div style={{display:'flex',justifyContent:'space-between',padding:'14px 0',marginTop:6,borderTop:'3px double '+C.navy}}>
            <span style={{fontSize:18,fontWeight:800,color:C.navy}}>{mode==='bundle'?'BUNDLE TOTAL:':'TOTAL:'}</span>
            <span style={{fontSize:18,fontWeight:800,color:C.navy}}>{fP(gt)}</span>
          </div>
        </div>
      </div>
      <div className="page-stripe">{stripe}</div>
    </div>
  </>;
}

// ═══ Inline Margin Preview Component ═══
function MarginPreview() {
  const { cats, sels, companies, ci } = useQuote();
  const fD = n => '$'+Math.round(n||0).toLocaleString('en-US');
  const pill = mp => <span style={{fontSize:10,fontWeight:700,color:mp>=40?'#16a34a':mp>=25?'#ca8a04':'#dc2626',background:(mp>=40?'#dcfce7':mp>=25?'#fef9c3':'#fef2f2'),padding:'2px 8px',borderRadius:10}}>{mp}%</span>;

  const secs=[]; let tMat=0,tLH=0,tLC=0,tPO=0,tList=0,t3rd=0;
  Object.entries(cats).forEach(([k,cat])=>{
    const co=companies[k]; if(!co)return; const rates=co.rates||{};
    Object.entries(cat).forEach(([sn,sec])=>{
      const rows=[]; (sec.items||[]).forEach(it=>{
        const s=(sels[k]||{})[it.id]; if(!s||!s.on)return;
        const q=it.hq&&s.q>0?s.q:1; const mat=(it.mc||0)*q; const lh=(it.lh||0)*q;
        const lc=Math.round(lh*(rates.laborRate||30)); const po=Math.round(lc*(rates.pohr||2)); const cost=mat+lc+po;
        let lp=gP(it,s); const is3=sn.toLowerCase().includes('3rd');
        if(!is3)lp=Math.round(lp*(1+(rates.markup||10)/100));
        const mg=lp-cost; const mp=lp>0?Math.round(mg/lp*100):0;
        rows.push({dn:itemDN(it,s),q,mat,lh,lc,po,cost,lp,mg,mp});
        tMat+=mat;tLH+=lh;tLC+=lc;tPO+=po;tList+=lp;if(is3)t3rd+=lp;
      });
      if(rows.length>0)secs.push({co:co.name,color:co.color,sn,rows});
    });
  });

  const manC=tMat+tLC+tPO; const mRev=tList-manC; const mPct=tList>0?Math.round(mRev/tList*100):0;

  if(secs.length===0) return <div style={{background:'#fff',borderRadius:12,padding:40,textAlign:'center',color:C.muted}}>Select items in the Builder first.</div>;

  return <div style={{background:'#fff',borderRadius:12,padding:24}}>
    <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}>
      <div><div style={{fontSize:18,fontWeight:800,color:C.navy}}>Margin Calculator</div><div style={{fontSize:11,color:C.muted}}>{ci.name} • Rev. {ci.revision}</div></div>
      <div style={{fontSize:9,color:'#dc2626',fontWeight:700,background:'#fef2f2',padding:'4px 12px',borderRadius:6,alignSelf:'flex-start'}}>CONFIDENTIAL</div>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:12,marginBottom:20}}>
      {[{l:'Total List Price',v:fP(tList),c:C.navy},{l:'Manufacturing Cost',v:fD(manC),c:'#64748b'},{l:'Margin Revenue',v:fD(mRev),c:mPct>=40?'#16a34a':'#ca8a04'},{l:'Gross Margin',v:mPct+'%',c:mPct>=40?'#16a34a':'#ca8a04'}].map((kpi,i)=>
        <div key={i} style={{background:'#f8f9fb',borderRadius:10,padding:'14px 16px',borderTop:'3px solid '+kpi.c}}>
          <div style={{fontSize:9,fontWeight:700,color:C.muted}}>{kpi.l}</div>
          <div style={{fontSize:20,fontWeight:800,color:kpi.c,marginTop:4}}>{kpi.v}</div>
        </div>)}
    </div>
    <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
      <thead><tr style={{background:'#f8f9fb'}}>{['Item','Qty','Material','Hrs','Labor $','POHR','Cost','List','Margin','M%'].map(h=><th key={h} style={{padding:'7px 10px',textAlign:h==='Item'?'left':'right',fontSize:8,fontWeight:700,color:C.muted,borderBottom:'1px solid #e2e4e9'}}>{h}</th>)}</tr></thead>
      <tbody>{secs.map((sec,si)=>[
        <tr key={'h'+si} style={{background:sec.color+'08'}}><td colSpan={10} style={{padding:'8px 10px',fontWeight:700,color:sec.color,fontSize:11}}>{sec.co} — {sec.sn}</td></tr>,
        ...sec.rows.map((r,ri)=><tr key={'r'+si+ri} style={{borderBottom:'1px solid #f3f4f6'}}>
          <td style={{padding:'5px 10px',color:'#444'}}>{r.dn}</td>
          <td style={{padding:'5px 10px',textAlign:'center',color:C.muted}}>{r.q}</td>
          <td style={{padding:'5px 10px',textAlign:'right',color:'#888'}}>{fD(r.mat)}</td>
          <td style={{padding:'5px 10px',textAlign:'right',color:'#888'}}>{r.lh.toFixed(1)}</td>
          <td style={{padding:'5px 10px',textAlign:'right',color:'#888'}}>{fD(r.lc)}</td>
          <td style={{padding:'5px 10px',textAlign:'right',color:'#888'}}>{fD(r.po)}</td>
          <td style={{padding:'5px 10px',textAlign:'right',fontWeight:500}}>{fD(r.cost)}</td>
          <td style={{padding:'5px 10px',textAlign:'right',fontWeight:600,color:sec.color}}>{fD(r.lp)}</td>
          <td style={{padding:'5px 10px',textAlign:'right',fontWeight:500,color:r.mp>=40?'#16a34a':r.mp>=25?'#ca8a04':'#dc2626'}}>{fD(r.mg)}</td>
          <td style={{padding:'5px 10px',textAlign:'right'}}>{pill(r.mp)}</td>
        </tr>)
      ])}</tbody>
    </table>
  </div>;
}
