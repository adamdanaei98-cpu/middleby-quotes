// app/(dashboard)/margin/page.js
'use client';
import { useAuth } from '@/components/AuthProvider';
import { useState, useEffect } from 'react';
import { dbToPrototypeCatalog, gP, cTot, itemDN, fP, fD, C } from '@/lib/transform';

export default function MarginPage() {
  const { user } = useAuth();
  const [cats, setCats] = useState({});
  const [sels, setSels] = useState({});
  const [companies, setCompanies] = useState({});
  const [ci, setCi] = useState({ revision: '1' });
  const [loading, setLoading] = useState(true);

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

  // Build margin data
  const secs = []; let tMat = 0, tLH = 0, tLC = 0, tPO = 0, tList = 0, t3rd = 0;
  Object.entries(cats).forEach(([k, cat]) => {
    const co = companies[k]; if (!co) return; const rates = co.rates || {};
    Object.entries(cat).forEach(([sn, sec]) => {
      const rows = []; (sec.items || []).forEach(it => {
        const s = (sels[k] || {})[it.id]; if (!s || !s.on) return;
        const q = it.hq && s.q > 0 ? s.q : 1; const mat = (it.mc || 0) * q; const lh = (it.lh || 0) * q;
        const lc = Math.round(lh * (rates.laborRate || 30)); const po = Math.round(lc * (rates.pohr || 2)); const cost = mat + lc + po;
        let lp = gP(it, s); const is3 = sn.toLowerCase().includes('3rd');
        if (!is3) lp = Math.round(lp * (1 + (rates.markup || 10) / 100));
        const mg = lp - cost; const mp = lp > 0 ? Math.round(mg / lp * 100) : 0;
        rows.push({ dn: itemDN(it, s), q, mat, lh, lc, po, cost, lp, mg, mp });
        tMat += mat; tLH += lh; tLC += lc; tPO += po; tList += lp; if (is3) t3rd += lp;
      });
      if (rows.length > 0) {
        const sub = { mat: 0, lh: 0, lc: 0, po: 0, cost: 0, lp: 0, mg: 0 };
        rows.forEach(r => { sub.mat += r.mat; sub.lh += r.lh; sub.lc += r.lc; sub.po += r.po; sub.cost += r.cost; sub.lp += r.lp; sub.mg += r.mg; });
        sub.mp = sub.lp > 0 ? Math.round(sub.mg / sub.lp * 100) : 0;
        secs.push({ co: co.name, sn, color: co.color, rows, sub });
      }
    });
  });
  const mRev = tList - (tMat + tLC + tPO); const mPct = tList > 0 ? Math.round(mRev / tList * 100) : 0;
  const has = secs.length > 0;
  const pill = (v) => <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: v >= 40 ? '#dcfce7' : v >= 25 ? '#fef9c3' : '#fef2f2', color: v >= 40 ? '#16a34a' : v >= 25 ? '#a16207' : '#dc2626' }}>{v}%</span>;

  // Group by company
  const coGroups = {};
  secs.forEach(sec => {
    if (!coGroups[sec.co]) coGroups[sec.co] = { color: sec.color, secs: [], totals: { mat: 0, lh: 0, lc: 0, po: 0, cost: 0, lp: 0, mg: 0 } };
    coGroups[sec.co].secs.push(sec);
    coGroups[sec.co].totals.mat += sec.sub.mat; coGroups[sec.co].totals.lh += sec.sub.lh; coGroups[sec.co].totals.lc += sec.sub.lc;
    coGroups[sec.co].totals.po += sec.sub.po; coGroups[sec.co].totals.cost += sec.sub.cost; coGroups[sec.co].totals.lp += sec.sub.lp; coGroups[sec.co].totals.mg += sec.sub.mg;
  });

  return (
    <div style={{ padding: 20, background: '#f0f2f5', minHeight: 'calc(100vh - 56px)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.navy, marginBottom: 16 }}>Margin Calculator</div>
        {!has && <div style={{ textAlign: 'center', padding: 60, color: C.muted, background: '#fff', borderRadius: 12, border: '1px dashed ' + C.border, fontSize: 13 }}>Select items in the Quote Builder to see margin analysis</div>}

        {has && (
          <>
            {/* KPI cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[{ l: 'Total List Price', v: fP(tList), c: C.navy }, { l: 'Manufacturing Cost', v: fD(tMat + tLC + tPO), c: '#64748b' }, { l: 'Margin Revenue', v: fD(mRev), c: mPct >= 40 ? '#16a34a' : '#ca8a04' }, { l: 'Gross Margin', v: mPct + '%', c: mPct >= 40 ? '#16a34a' : '#ca8a04' }].map((kpi, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 10, padding: '16px 18px', border: '1px solid ' + C.border, borderTop: '3px solid ' + kpi.c }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: C.muted, letterSpacing: '.05em' }}>{kpi.l}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: kpi.c, marginTop: 4 }}>{kpi.v}</div>
                </div>
              ))}
            </div>

            {/* Company sections */}
            {Object.entries(coGroups).map(([coName, grp]) => {
              const coMp = grp.totals.lp > 0 ? Math.round(grp.totals.mg / grp.totals.lp * 100) : 0;
              const itemCount = grp.secs.reduce((a, s) => a + s.rows.length, 0);
              return (
                <div key={coName} style={{ marginBottom: 24, borderRadius: 10, overflow: 'hidden', border: '1px solid ' + C.border, background: '#fff' }}>
                  <div style={{ background: grp.color, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{coName}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.6)', background: 'rgba(255,255,255,.15)', padding: '3px 10px', borderRadius: 10 }}>{itemCount} items</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                      <div style={{ textAlign: 'right' }}><div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,.5)' }}>COST</div><div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,.85)' }}>{fD(grp.totals.cost)}</div></div>
                      <div style={{ textAlign: 'right' }}><div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,.5)' }}>LIST</div><div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{fP(grp.totals.lp)}</div></div>
                      <div style={{ background: 'rgba(255,255,255,.2)', padding: '6px 14px', borderRadius: 6, fontSize: 15, fontWeight: 800, color: '#fff' }}>{coMp}%</div>
                    </div>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead><tr style={{ background: '#f8f9fb' }}>
                      {['ITEM', 'QTY', 'MATERIAL', 'LABOR HRS', 'LABOR $', 'POHR', 'COST', 'LIST PRICE', 'MARGIN', 'M%'].map(x => (
                        <th key={x} style={{ padding: '7px 12px', textAlign: x === 'ITEM' ? 'left' : 'right', fontSize: 8, fontWeight: 700, color: C.muted, borderBottom: '1px solid ' + C.border }}>{x}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {grp.secs.map((sec, si) => [
                        <tr key={'hdr-' + si} style={{ background: grp.color + '08' }}>
                          <td colSpan={7} style={{ padding: '8px 12px', borderTop: si > 0 ? '2px solid ' + C.border : 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 3, height: 14, borderRadius: 2, background: grp.color }} /><span style={{ fontSize: 11, fontWeight: 700, color: grp.color }}>{sec.sn}</span></div>
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: grp.color, borderTop: si > 0 ? '2px solid ' + C.border : 'none' }}>{fP(sec.sub.lp)}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, borderTop: si > 0 ? '2px solid ' + C.border : 'none' }}>{fD(sec.sub.mg)}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', borderTop: si > 0 ? '2px solid ' + C.border : 'none' }}>{pill(sec.sub.mp)}</td>
                        </tr>,
                        ...sec.rows.map((r, ri) => (
                          <tr key={'r-' + si + '-' + ri} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '6px 12px 6px 24px', fontWeight: 400, color: '#444', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.dn}</td>
                            <td style={{ padding: '6px 12px', textAlign: 'center', color: C.muted, fontSize: 10 }}>{r.q}</td>
                            <td style={{ padding: '6px 12px', textAlign: 'right', color: '#888', fontSize: 10 }}>{fD(r.mat)}</td>
                            <td style={{ padding: '6px 12px', textAlign: 'right', color: '#888', fontSize: 10 }}>{r.lh.toFixed(1)}</td>
                            <td style={{ padding: '6px 12px', textAlign: 'right', color: '#888', fontSize: 10 }}>{fD(r.lc)}</td>
                            <td style={{ padding: '6px 12px', textAlign: 'right', color: '#888', fontSize: 10 }}>{fD(r.po)}</td>
                            <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 500, fontSize: 10 }}>{fD(r.cost)}</td>
                            <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 600, color: grp.color }}>{fD(r.lp)}</td>
                            <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 500, color: r.mp >= 50 ? '#16a34a' : r.mp >= 30 ? '#ca8a04' : '#dc2626' }}>{fD(r.mg)}</td>
                            <td style={{ padding: '6px 12px', textAlign: 'right' }}>{pill(r.mp)}</td>
                          </tr>
                        ))
                      ])}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
