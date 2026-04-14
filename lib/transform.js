// lib/transform.js
// Converts between database format and prototype internal format

export function dbToPrototypeCatalog(companies) {
  const cats = {};
  const companiesMap = {};
  const initSels = {};

  companies.forEach((co) => {
    const key = co.key;
    cats[key] = {};
    initSels[key] = {};
    companiesMap[key] = {
      id: co.id,
      name: co.name,
      color: co.color,
      bg: co.color + '12',
      desc: co.description || '',
      execSummary: co.execSummary || '',
      logo: co.logo || null,
      machineImg: co.machineImage || null,
      division: co.division || 'protein',
      rates: co.rates || { laborRate: 30, pohr: 2, markup: 10, agentFee: 5, commission: 1.5, discount: 0, freight: 5000, install: 15000 },
    };
    (co.catalogSections || []).forEach((section) => {
      const items = (section.items || []).map((item) => {
        const it = { id: item.id, n: item.name, fp: item.fixedPrice || 0, vp: item.variablePrice || 0, mc: item.materialCost || 0, lh: item.laborHours || 0, desc: item.description || undefined, nt: item.note || undefined, hq: item.hasQuantity || undefined, ql: item.quantityLabel || undefined };
        if (item.options && Array.isArray(item.options) && item.options.length > 0) {
          it.ops = item.options.map(o => o.name);
          it.opP = {}; it.opVP = {};
          item.options.forEach(o => { it.opP[o.name] = o.fixedPrice || 0; it.opVP[o.name] = o.variablePrice || 0; });
        }
        if (item.subOptions) it.subs = item.subOptions;
        return it;
      });
      cats[key][section.name] = { items };
    });
  });
  return { cats, companies: companiesMap, initSels };
}

export function gP(it, s) {
  if (!s || !s.on) return 0;
  const baseFP = (it.ops && it.opP && s.op && it.opP[s.op] != null) ? it.opP[s.op] : (it.fp || 0);
  const baseVP = (it.ops && it.opVP && s.op && it.opVP[s.op] != null) ? it.opVP[s.op] : (it.vp || 0);
  const q = (s.q || 0) > 0 ? s.q : 1;
  let p = baseFP;
  if (baseVP > 0) p = baseFP + baseVP * q;
  else if (it.hq && q > 1) p = baseFP * q;
  if (it.subs && s.subs) it.subs.forEach(sub => { const ch = s.subs[sub.k]; if (ch && sub.mod && sub.mod[ch]) p += sub.mod[ch]; });
  return Math.round(p);
}

export function cTot(cat, sel) {
  const s = {}; let g = 0;
  Object.entries(cat).forEach(([k, d]) => { let t = 0; (d.items || []).forEach(i => { t += gP(i, sel[i.id]); }); s[k] = t; g += t; });
  return { s, g };
}

export function itemDN(it, s) {
  let dn = it.ops && s.op ? it.n + ' (' + s.op + ')' : it.n;
  if (it.subs && s.subs) { const sp = it.subs.map(sub => s.subs[sub.k]).filter(Boolean); if (sp.length) dn += ' (' + sp.join(', ') + ')'; }
  return dn;
}

export function fP(n) { return '$' + Math.round(n || 0).toLocaleString('en-US'); }
export function fD(n) { return n < 0 ? '($' + Math.abs(Math.round(n)).toLocaleString('en-US') + ')' : '$' + Math.round(n).toLocaleString('en-US'); }

export const C = { navy: '#003250', red: '#E12C3E', dkNavy: '#032436', blue: '#0074BB', gray: '#DBDCDD', bg: '#f4f5f7', border: '#e2e4e9', muted: '#8b919e', text: '#1a1c21', green: '#059669' };
