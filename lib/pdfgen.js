// lib/pdfgen.js
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const NAVY = [0, 50, 80];
const BLUE = [0, 116, 187];
const RED = [225, 44, 62];
const MUTED = [139, 145, 158];
const BLACK = [51, 51, 51];
const WHITE = [255, 255, 255];

function hex2rgb(hex) {
  hex = (hex||'#999').replace('#','');
  if (hex.length===3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  return [parseInt(hex.slice(0,2),16), parseInt(hex.slice(2,4),16), parseInt(hex.slice(4,6),16)];
}
function fmt(n) { return '$' + Math.round(n||0).toLocaleString('en-US'); }

// ═══ PROPOSAL PDF ═══
export function generateProposalPDF({ cats, sels, companies, ci, mode, terms, cTot, gP, itemDN }) {
  const doc = new jsPDF('p', 'mm', 'letter');
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const LM = 22, RM = W - 22, CW = RM - LM;
  let y = 0;
  let pageNum = 0;

  // ─── HELPERS ───
  function topStripe() {
    doc.setFillColor(...NAVY); doc.rect(0, 0, W*0.4, 3, 'F');
    doc.setFillColor(...BLUE); doc.rect(W*0.4, 0, W*0.3, 3, 'F');
    doc.setFillColor(...RED); doc.rect(W*0.7, 0, W*0.3, 3, 'F');
  }
  function botStripe() {
    doc.setFillColor(...NAVY); doc.rect(0, H-3, W*0.4, 3, 'F');
    doc.setFillColor(...BLUE); doc.rect(W*0.4, H-3, W*0.3, 3, 'F');
    doc.setFillColor(...RED); doc.rect(W*0.7, H-3, W*0.3, 3, 'F');
  }
  function pageFooter() {
    botStripe();
    doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...MUTED);
    doc.text('Proposal #' + (ci.proposalNumber||''), LM, H - 6);
    doc.text('Page ' + pageNum, RM, H - 6, { align: 'right' });
  }
  function newPage() {
    if (pageNum > 0) { pageFooter(); doc.addPage(); }
    pageNum++;
    topStripe();
    y = 12;
  }
  function need(h) { if (y + h > H - 22) { pageFooter(); doc.addPage(); pageNum++; topStripe(); y = 12; } }

  // Active companies
  const activeCos = Object.keys(cats).filter(k => {
    const cat = cats[k] || {};
    return Object.values(cat).some(sec => (sec.items||[]).some(it => sels[k]?.[it.id]?.on));
  });

  // ══════════════════════════════════════════════════════
  // PAGE 1: COVER
  // ══════════════════════════════════════════════════════
  newPage();

  // Logo + title
  doc.setFont('helvetica','bolditalic'); doc.setFontSize(26); doc.setTextColor(...NAVY);
  doc.text('MIDDLEBY', LM, y + 4);
  doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(...MUTED);
  doc.text('FOOD PROCESSING', LM + 56, y + 1);
  y += 16;

  doc.setFont('helvetica','bold'); doc.setFontSize(22); doc.setTextColor(...NAVY);
  doc.text(mode === 'bundle' ? 'Bundle Equipment Proposal' : 'Equipment Proposal', LM, y);
  y += 10;

  // Proposal info
  doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(...MUTED);
  doc.text('Proposal #' + (ci.proposalNumber||'') + '   Rev. ' + (ci.revision||'1'), LM, y);
  y += 5;
  doc.text('Date: ' + new Date().toLocaleDateString(), LM, y);
  y += 10;

  // Customer info box
  if (ci.name || ci.contact || ci.email) {
    doc.setFillColor(248, 249, 251); doc.roundedRect(LM, y, CW, 20, 2, 2, 'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(...MUTED);
    doc.text('PREPARED FOR', LM + 6, y + 6);
    doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.setTextColor(...NAVY);
    doc.text(ci.name || '', LM + 6, y + 12);
    doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...BLACK);
    doc.text((ci.contact||'') + (ci.email ? '  |  '+ci.email : ''), LM + 6, y + 17);
    y += 26;
  }

  // Purpose
  if (ci.purpose) {
    doc.setFillColor(250, 251, 252); doc.roundedRect(LM, y, CW, 14, 1.5, 1.5, 'F');
    doc.setFont('helvetica','italic'); doc.setFontSize(9); doc.setTextColor(85, 85, 85);
    const pLines = doc.splitTextToSize(ci.purpose, CW - 12);
    doc.text(pLines.slice(0,3), LM + 6, y + 6);
    y += Math.min(pLines.length, 3) * 4 + 8;
  }

  // Separator
  y += 4;
  doc.setFillColor(...NAVY); doc.rect(LM, y, CW, 0.8, 'F'); y += 10;

  // Company cards on cover
  if (activeCos.length === 0) {
    doc.setFont('helvetica','normal'); doc.setFontSize(12); doc.setTextColor(...MUTED);
    doc.text('No items selected.', LM, y + 10);
    pageFooter(); return doc;
  }

  if (activeCos.length > 1) {
    doc.setFont('helvetica','bold'); doc.setFontSize(14); doc.setTextColor(...NAVY);
    doc.text('The Complete Line Solution', LM, y); y += 10;
  }

  activeCos.forEach(k => {
    const co = companies[k]; if (!co) return;
    const rgb = hex2rgb(co.color);
    const coTotal = cTot(cats[k]||{}, sels[k]||{}).g;

    need(40);

    // Company card - bordered box
    const cardH = co.execSummary ? 36 : 24;
    doc.setDrawColor(...rgb); doc.setLineWidth(0.5);
    doc.setFillColor(rgb[0], rgb[1], rgb[2]); doc.rect(LM, y, 3, cardH, 'F'); // left accent
    doc.setDrawColor(230,230,230); doc.setLineWidth(0.2);
    doc.roundedRect(LM, y, CW, cardH, 2, 2, 'S');

    // Logo circle
    doc.setFillColor(...rgb); doc.circle(LM + 14, y + 12, 7, 'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(14); doc.setTextColor(...WHITE);
    doc.text(co.name[0], LM + 11, y + 14.5);

    // Company name + desc
    doc.setFont('helvetica','bold'); doc.setFontSize(13); doc.setTextColor(...rgb);
    doc.text(co.name, LM + 26, y + 9);
    doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(...MUTED);
    doc.text(co.desc || '', LM + 26, y + 14);

    // Total
    doc.setFont('helvetica','bold'); doc.setFontSize(13); doc.setTextColor(...rgb);
    doc.text(fmt(coTotal), RM - 4, y + 9, { align: 'right' });

    // Exec summary
    if (co.execSummary) {
      doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(80, 80, 80);
      const sumLines = doc.splitTextToSize(co.execSummary, CW - 32);
      doc.text(sumLines.slice(0, 4), LM + 26, y + 20);
    }

    y += cardH + 6;
  });

  // Grand total on cover
  need(20);
  y += 4;
  doc.setFillColor(...NAVY); doc.rect(LM, y, CW, 0.8, 'F'); y += 8;
  let gt = 0;
  activeCos.forEach(k => { gt += cTot(cats[k]||{}, sels[k]||{}).g; });
  doc.setFont('helvetica','bold'); doc.setFontSize(16); doc.setTextColor(...NAVY);
  doc.text(mode==='bundle' ? 'Bundle Total:' : 'Total:', LM, y + 2);
  doc.text(fmt(gt), RM, y + 2, { align: 'right' });

  // ══════════════════════════════════════════════════════
  // COMPANY PAGES — each company gets its own page
  // ══════════════════════════════════════════════════════
  activeCos.forEach(k => {
    const co = companies[k]; if (!co) return;
    const cat = cats[k] || {};
    const rgb = hex2rgb(co.color);
    const coTotal = cTot(cat, sels[k]||{}).g;

    // ── NEW PAGE for this company ──
    newPage();

    // Company header bar
    doc.setFillColor(...rgb); doc.roundedRect(LM, y, CW, 14, 2, 2, 'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(16); doc.setTextColor(...WHITE);
    doc.text(co.name, LM + 6, y + 10);
    doc.setFont('helvetica','bold'); doc.setFontSize(14); doc.setTextColor(...WHITE);
    doc.text(fmt(coTotal), RM - 6, y + 10, { align: 'right' });
    y += 20;

    // Description
    doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...MUTED);
    doc.text(co.desc || '', LM, y); y += 6;

    // Machine image placeholder text (actual image would need base64)
    if (co.machineImg) {
      doc.setFillColor(248, 249, 251); doc.roundedRect(LM, y, CW, 20, 2, 2, 'F');
      doc.setFont('helvetica','italic'); doc.setFontSize(8); doc.setTextColor(...MUTED);
      doc.text('[Machine Image]', LM + CW/2, y + 12, { align: 'center' });
      y += 24;
    }

    // Exec summary
    if (co.execSummary) {
      doc.setFillColor(250, 251, 252); doc.roundedRect(LM + 2, y, CW - 4, 14, 1.5, 1.5, 'F');
      doc.setFillColor(...rgb); doc.rect(LM + 2, y, 2, 14, 'F'); // accent bar
      doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(60, 60, 60);
      const sLines = doc.splitTextToSize(co.execSummary, CW - 16);
      doc.text(sLines.slice(0, 4), LM + 8, y + 5);
      y += Math.min(sLines.length, 4) * 3.5 + 8;
    }

    y += 4;

    // ── Items by section ──
    let prevSec = '';
    Object.entries(cat).forEach(([sn, sec]) => {
      const sectionItems = (sec.items||[]).filter(it => {
        const s = sels[k]?.[it.id]; if (!s || !s.on) return false;
        const pr = gP(it, s);
        return pr > 0 || (it.hq && s.q > 0);
      });
      if (sectionItems.length === 0) return;

      // Section header
      need(14);
      doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(...rgb);
      doc.text(sn, LM + 2, y); y += 6;

      // Items
      sectionItems.forEach(it => {
        const s = sels[k][it.id];
        const pr = gP(it, s);
        const dn = itemDN(it, s);
        const qtyStr = it.hq && s.q > 0 ? '  —  Qty. ' + s.q : '';

        need(10);

        // Item name + price
        doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(...BLACK);
        doc.text(dn + qtyStr, LM + 6, y);
        doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...rgb);
        doc.text(fmt(pr), RM, y, { align: 'right' });
        y += 4;

        // One-line description
        if (it.desc) {
          const firstLine = it.desc.split('\n').filter(l => l.trim())[0];
          if (firstLine) {
            const clean = firstLine.replace(/^[•\-\s]+/, '').trim().substring(0, 100);
            doc.setFont('helvetica','italic'); doc.setFontSize(7.5); doc.setTextColor(130, 130, 130);
            doc.text(clean, LM + 10, y);
            y += 3.5;
          }
        }
        y += 2;
      });
      y += 2;
    });

    // Company total
    need(14);
    y += 2;
    doc.setFillColor(...rgb); doc.rect(LM, y, CW, 0.6, 'F'); y += 6;
    doc.setFont('helvetica','bold'); doc.setFontSize(13); doc.setTextColor(...rgb);
    doc.text(co.name + ' Total', LM + 2, y);
    doc.text(fmt(coTotal), RM, y, { align: 'right' });
  });

  // ══════════════════════════════════════════════════════
  // SUMMARY PAGE
  // ══════════════════════════════════════════════════════
  newPage();

  doc.setFont('helvetica','bold'); doc.setFontSize(18); doc.setTextColor(...NAVY);
  doc.text('Price Summary', LM, y); y += 12;

  doc.setFillColor(248, 249, 251); doc.roundedRect(LM, y, 130, activeCos.length * 8 + 20, 2, 2, 'F');
  const sumY = y + 6;

  activeCos.forEach((k, i) => {
    const co = companies[k]; if (!co) return;
    const t = cTot(cats[k]||{}, sels[k]||{}).g;
    const rgb = hex2rgb(co.color);
    const ry = sumY + i * 8;
    doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(...rgb);
    doc.text(co.name, LM + 6, ry + 2);
    doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(...BLACK);
    doc.text(fmt(t), LM + 124, ry + 2, { align: 'right' });
  });

  const totalY = sumY + activeCos.length * 8 + 4;
  doc.setFillColor(...NAVY); doc.rect(LM + 4, totalY - 3, 122, 0.6, 'F');
  doc.setFont('helvetica','bold'); doc.setFontSize(14); doc.setTextColor(...NAVY);
  doc.text(mode === 'bundle' ? 'BUNDLE TOTAL:' : 'TOTAL:', LM + 6, totalY + 4);
  doc.text(fmt(gt), LM + 124, totalY + 4, { align: 'right' });

  y = totalY + 16;

  // ══════════════════════════════════════════════════════
  // TERMS PAGE
  // ══════════════════════════════════════════════════════
  if (terms && terms.trim()) {
    newPage();

    doc.setFont('helvetica','bold'); doc.setFontSize(16); doc.setTextColor(...NAVY);
    doc.text('Terms & Conditions', LM, y); y += 10;

    doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.2); doc.line(LM, y - 4, RM, y - 4);

    terms.split('\n').forEach(ln => {
      if (!ln.trim()) { y += 3; return; }
      need(6);
      const isH = /^\d+\./.test(ln.trim());
      doc.setFont('helvetica', isH ? 'bold' : 'normal');
      doc.setFontSize(isH ? 9 : 8);
      doc.setTextColor(isH ? 40 : 90, isH ? 40 : 90, isH ? 40 : 90);
      const wrapped = doc.splitTextToSize(ln, CW - 4);
      doc.text(wrapped, LM + 2, y);
      y += wrapped.length * 3.8 + (isH ? 3 : 1);
    });
  }

  pageFooter();
  return doc;
}

// ═══ MARGIN REPORT PDF ═══
export function generateMarginPDF({ cats, sels, companies, ci, gP, itemDN, cTot }) {
  const doc = new jsPDF('l', 'mm', 'letter');
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 15;
  let y = M;

  function need(h) { if (y + h > H - 15) { doc.addPage(); y = M; } }

  // Header
  doc.setFont('helvetica','bold'); doc.setFontSize(16); doc.setTextColor(...NAVY);
  doc.text('Margin Calculator', M, y);
  doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(...MUTED);
  doc.text((ci.name||'') + '  •  Rev. ' + (ci.revision||'1'), M, y + 5);
  doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(220, 38, 38);
  doc.text('CONFIDENTIAL — INTERNAL USE ONLY', W - M, y, { align: 'right' });
  y += 14;

  // Build data
  const sections = [];
  let tMat=0, tLH=0, tLC=0, tPO=0, tList=0, t3rd=0;
  Object.entries(cats).forEach(([k, cat]) => {
    const co = companies[k]; if (!co) return;
    const rates = co.rates || {};
    Object.entries(cat).forEach(([sn, sec]) => {
      const rows = [];
      (sec.items||[]).forEach(it => {
        const s = (sels[k]||{})[it.id]; if (!s || !s.on) return;
        const q = it.hq && s.q > 0 ? s.q : 1;
        const mat = (it.mc||0)*q; const lh = (it.lh||0)*q;
        const lc = Math.round(lh * (rates.laborRate||30));
        const po = Math.round(lc * (rates.pohr||2));
        const cost = mat + lc + po;
        let lp = gP(it, s);
        const is3 = sn.toLowerCase().includes('3rd');
        if (!is3) lp = Math.round(lp * (1 + (rates.markup||10)/100));
        const mg = lp - cost; const mp = lp > 0 ? Math.round(mg/lp*100) : 0;
        rows.push([itemDN(it,s), String(q), fmt(mat), lh.toFixed(1), fmt(lc), fmt(po), fmt(cost), fmt(lp), fmt(mg), mp+'%']);
        tMat+=mat; tLH+=lh; tLC+=lc; tPO+=po; tList+=lp; if(is3) t3rd+=lp;
      });
      if (rows.length > 0) sections.push({ co: co.name, color: co.color, sn, rows });
    });
  });

  if (sections.length === 0) {
    doc.setFont('helvetica','normal'); doc.setFontSize(12); doc.setTextColor(...MUTED);
    doc.text('No items selected.', M, y + 10);
    return doc;
  }

  // KPIs
  const manC = tMat + tLC + tPO;
  const mRev = tList - manC;
  const mPct = tList > 0 ? Math.round(mRev/tList*100) : 0;
  const kpis = [['TOTAL LIST PRICE', fmt(tList)], ['MANUFACTURING COST', fmt(manC)], ['MARGIN REVENUE', fmt(mRev)], ['GROSS MARGIN', mPct+'%']];
  const kpiW = (W - 2*M - 15) / 4;
  kpis.forEach((kpi, i) => {
    const x = M + i * (kpiW + 5);
    doc.setDrawColor(226,228,233); doc.setLineWidth(0.3); doc.roundedRect(x, y, kpiW, 16, 1.5, 1.5, 'S');
    doc.setFillColor(...NAVY); doc.rect(x, y, kpiW, 1.2, 'F');
    doc.setFont('helvetica','normal'); doc.setFontSize(6); doc.setTextColor(...MUTED);
    doc.text(kpi[0], x + 4, y + 6);
    doc.setFont('helvetica','bold'); doc.setFontSize(14); doc.setTextColor(...NAVY);
    doc.text(kpi[1], x + 4, y + 13);
  });
  y += 22;

  // Group by company
  const coGroups = {};
  sections.forEach(sec => {
    if (!coGroups[sec.co]) coGroups[sec.co] = { color: sec.color, sections: [] };
    coGroups[sec.co].sections.push(sec);
  });

  const colHeaders = ['Item', 'Qty', 'Material', 'Labor Hrs', 'Labor $', 'POHR', 'Cost', 'List Price', 'Margin', 'M%'];

  Object.entries(coGroups).forEach(([coName, grp]) => {
    need(20);
    const rgb = hex2rgb(grp.color);
    doc.setFillColor(...rgb); doc.roundedRect(M, y, W-2*M, 10, 1.5, 1.5, 'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(...WHITE);
    doc.text(coName, M + 5, y + 7);
    y += 14;

    const body = [];
    grp.sections.forEach(sec => {
      body.push([{ content: sec.sn, colSpan: 10, styles: { fontStyle: 'bold', textColor: rgb, fillColor: [248, 249, 251], fontSize: 8 } }]);
      sec.rows.forEach(r => body.push(r));
    });

    doc.autoTable({
      startY: y, head: [colHeaders], body: body,
      margin: { left: M, right: M },
      styles: { fontSize: 7.5, cellPadding: 2, lineColor: [240,240,240], lineWidth: 0.1 },
      headStyles: { fillColor: [248,249,251], textColor: [...MUTED], fontStyle: 'bold', fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 60 }, 1: { halign: 'center', cellWidth: 14 },
        2: { halign: 'right', cellWidth: 22 }, 3: { halign: 'right', cellWidth: 20 },
        4: { halign: 'right', cellWidth: 20 }, 5: { halign: 'right', cellWidth: 20 },
        6: { halign: 'right', cellWidth: 22 }, 7: { halign: 'right', cellWidth: 24, fontStyle: 'bold' },
        8: { halign: 'right', cellWidth: 22 }, 9: { halign: 'right', cellWidth: 16 },
      },
      didParseCell: function(data) {
        if (data.column.index === 9 && data.section === 'body' && !data.cell.colSpan) {
          const pct = parseInt(data.cell.text[0]);
          if (pct >= 40) data.cell.styles.textColor = [22, 163, 74];
          else if (pct >= 25) data.cell.styles.textColor = [202, 138, 4];
          else data.cell.styles.textColor = [220, 38, 38];
        }
      },
    });
    y = doc.lastAutoTable.finalY + 12;
  });

  // Summary cards
  need(40);
  const cardW = (W - 2*M - 12) / 3;
  const sums = [
    { t: 'Contract Info', r: [['Middleby Equipment', fmt(tList-t3rd)], ['3rd Party', fmt(t3rd)], ['Total Package', fmt(tList)]] },
    { t: 'POC Info', r: [['Material Cost', fmt(tMat)], ['Labor Hours', tLH.toFixed(1)+' hrs'], ['Labor Cost', fmt(tLC)], ['POHR', fmt(tPO)]] },
    { t: 'Margin Summary', r: [['Equipment + 3rd Party', fmt(tList)], ['Manufacturing Cost', '-'+fmt(manC)], ['Margin Revenue', fmt(mRev)], ['Gross Margin', mPct+'%']] },
  ];
  sums.forEach((card, ci) => {
    const x = M + ci * (cardW + 6);
    doc.setDrawColor(226,228,233); doc.setLineWidth(0.3); doc.roundedRect(x, y, cardW, 34, 1.5, 1.5, 'S');
    doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(...NAVY);
    doc.text(card.t, x + 4, y + 6);
    doc.setFillColor(...NAVY); doc.rect(x + 4, y + 8, cardW - 8, 0.5, 'F');
    card.r.forEach((row, ri) => {
      const ry = y + 14 + ri * 5.5;
      doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(...BLACK);
      doc.text(row[0], x + 4, ry);
      doc.setFont('helvetica','bold');
      doc.text(row[1], x + cardW - 4, ry, { align: 'right' });
    });
  });

  return doc;
}
