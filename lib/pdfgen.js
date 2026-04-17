// lib/pdfgen.js
// Client-side PDF generation using jsPDF
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const NAVY = '#003250';
const RED = '#E12C3E';
const BLUE = '#0074BB';
const MUTED = '#8b919e';

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

// ═══ PROPOSAL PDF ═══
export function generateProposalPDF({ cats, sels, companies, ci, mode, terms, cTot, gP, itemDN }) {
  const doc = new jsPDF('p', 'mm', 'letter');
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 20; // margin
  const CW = W - 2 * M; // content width
  let y = M;

  const addPage = () => { doc.addPage(); y = M; drawStripe(); };
  const checkPage = (need) => { if (y + need > H - 20) addPage(); };

  // Top stripe
  const drawStripe = () => {
    doc.setFillColor(...hexToRgb(NAVY)); doc.rect(0, 0, W * 0.4, 3, 'F');
    doc.setFillColor(...hexToRgb(BLUE)); doc.rect(W * 0.4, 0, W * 0.3, 3, 'F');
    doc.setFillColor(...hexToRgb(RED)); doc.rect(W * 0.7, 0, W * 0.3, 3, 'F');
  };
  drawStripe();
  y = 10;

  // Header
  doc.setFont('helvetica', 'bolditalic'); doc.setFontSize(22); doc.setTextColor(...hexToRgb(NAVY));
  doc.text('MIDDLEBY', M, y); y += 4;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...hexToRgb(MUTED));
  doc.text('FOOD PROCESSING', M + 50, y - 7);
  y += 4;

  doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(...hexToRgb(NAVY));
  doc.text(mode === 'bundle' ? 'Bundle Equipment Proposal' : 'Equipment Proposal', M, y); y += 6;

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...hexToRgb(MUTED));
  doc.text(`Proposal #${ci.proposalNumber} Rev. ${ci.revision} | ${ci.name || '—'} | ${new Date().toLocaleDateString()}`, M, y); y += 8;

  // Company tags
  const activeCos = Object.entries(cats).filter(([k]) => {
    const cat = cats[k] || {};
    return Object.values(cat).some(sec => (sec.items || []).some(it => sels[k]?.[it.id]?.on));
  }).map(([k]) => k);

  activeCos.forEach(k => {
    const co = companies[k]; if (!co) return;
    doc.setFillColor(...hexToRgb(co.color)); doc.roundedRect(M + activeCos.indexOf(k) * 45, y - 3, 42, 6, 1, 1, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(255, 255, 255);
    doc.text(co.name, M + activeCos.indexOf(k) * 45 + 3, y + 1);
  });
  y += 10;

  if (activeCos.length === 0) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(...hexToRgb(MUTED));
    doc.text('No items selected.', M, y);
    return doc;
  }

  // Bundle intro
  if (mode === 'bundle' && activeCos.length > 1) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(...hexToRgb(NAVY));
    doc.text('The Complete Line Solution', M, y); y += 8;

    activeCos.forEach(k => {
      const co = companies[k]; if (!co) return;
      checkPage(20);
      doc.setFillColor(...hexToRgb(co.color + '15')); doc.roundedRect(M, y - 4, CW, 16, 2, 2, 'F');
      doc.setDrawColor(...hexToRgb(co.color + '44')); doc.roundedRect(M, y - 4, CW, 16, 2, 2, 'S');
      // Logo circle
      doc.setFillColor(...hexToRgb(co.color)); doc.circle(M + 8, y + 4, 5, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(255, 255, 255);
      doc.text(co.name[0], M + 6, y + 6);
      // Name + desc
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...hexToRgb(co.color));
      doc.text(co.name, M + 16, y + 2);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...hexToRgb(MUTED));
      doc.text(co.desc || '', M + 16, y + 7);
      y += 20;
    });
  }

  // Purpose
  if (ci.purpose) {
    checkPage(12);
    doc.setFillColor(249, 250, 251); doc.roundedRect(M, y - 3, CW, 10, 1, 1, 'F');
    doc.setFont('helvetica', 'italic'); doc.setFontSize(9); doc.setTextColor(85, 85, 85);
    const purposeLines = doc.splitTextToSize(ci.purpose, CW - 8);
    doc.text(purposeLines, M + 4, y + 2);
    y += purposeLines.length * 4 + 8;
  }

  // Per-company sections
  

  activeCos.forEach(k => {
    const co = companies[k]; if (!co) return;
    const cat = cats[k] || {};
    const coTotal = cTot(cat, sels[k] || {}).g;

    checkPage(20);
    // Company header
    doc.setFillColor(...hexToRgb(co.color)); doc.rect(M, y, CW, 0.8, 'F');
    y += 4;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(...hexToRgb(co.color));
    doc.text(co.name, M, y);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
    doc.text('$' + Math.round(coTotal).toLocaleString(), W - M, y, { align: 'right' });
    y += 3;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...hexToRgb(MUTED));
    doc.text(co.desc || '', M, y); y += 6;

    // Exec summary
    if (co.execSummary) {
      checkPage(15);
      doc.setFillColor(250, 251, 252); doc.roundedRect(M, y - 3, CW, 12, 1, 1, 'F');
      doc.setDrawColor(...hexToRgb(co.color)); doc.line(M, y - 3, M, y + 9);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(68, 68, 68);
      const sumLines = doc.splitTextToSize(co.execSummary, CW - 10);
      doc.text(sumLines.slice(0, 4), M + 4, y + 1);
      y += Math.min(sumLines.length, 4) * 3.5 + 6;
    }

    // Items by section
    let prevSec = '';
    Object.entries(cat).forEach(([sn, sec]) => {
      (sec.items || []).forEach(it => {
        const s = sels[k]?.[it.id]; if (!s || !s.on) return;
        const pr = gP(it, s);
        const dn = itemDN(it, s);

        if (sn !== prevSec) {
          checkPage(10);
          doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...hexToRgb(co.color));
          doc.text(sn, M, y); y += 5;
          prevSec = sn;
        }

        checkPage(8);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(51, 51, 51);
        const label = dn + (it.hq && s.q > 0 ? ` — Qty. ${s.q}` : '');
        doc.text(label, M + 4, y);
        doc.setFont('helvetica', 'bold'); doc.setTextColor(...hexToRgb(co.color));
        doc.text('$' + Math.round(pr).toLocaleString(), W - M, y, { align: 'right' });
        y += 3;

        if (it.desc) {
          doc.setFont('helvetica', 'italic'); doc.setFontSize(7); doc.setTextColor(102, 102, 102);
          doc.text(it.desc.substring(0, 100), M + 8, y); y += 3;
        }
        y += 1;
      });
    });

    // Company total
    checkPage(10);
    doc.setFillColor(...hexToRgb(co.color)); doc.rect(M, y, CW, 0.5, 'F'); y += 4;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...hexToRgb(co.color));
    doc.text(co.name + ' Total', M, y);
    doc.text('$' + Math.round(coTotal).toLocaleString(), W - M, y, { align: 'right' });
    y += 10;
  });

  // Price Summary
  checkPage(30);
  doc.setFillColor(...hexToRgb(NAVY)); doc.rect(M, y, CW, 0.5, 'F'); y += 6;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(...hexToRgb(NAVY));
  doc.text('Price Summary', M, y); y += 7;

  let grandTotal = 0;
  activeCos.forEach(k => {
    const co = companies[k]; if (!co) return;
    const t = cTot(cats[k] || {}, sels[k] || {}).g;
    grandTotal += t;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...hexToRgb(co.color));
    doc.text(co.name, M, y);
    doc.setFont('helvetica', 'bold'); doc.setTextColor(51, 51, 51);
    doc.text('$' + Math.round(t).toLocaleString(), M + 100, y, { align: 'right' });
    y += 5;
  });

  doc.setLineWidth(0.3); doc.line(M, y, M + 100, y); y += 5;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(...hexToRgb(NAVY));
  doc.text(mode === 'bundle' ? 'BUNDLE TOTAL:' : 'TOTAL:', M, y);
  doc.text('$' + Math.round(grandTotal).toLocaleString(), M + 100, y, { align: 'right' });
  y += 10;

  // Terms
  if (terms && terms.trim()) {
    checkPage(20);
    doc.setDrawColor(221, 221, 221); doc.line(M, y, W - M, y); y += 6;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...hexToRgb(NAVY));
    doc.text('Terms & Conditions', M, y); y += 5;

    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(85, 85, 85);
    terms.split('\n').forEach(line => {
      if (!line.trim()) { y += 2; return; }
      checkPage(5);
      const isHeader = /^\d+\./.test(line.trim());
      if (isHeader) { doc.setFont('helvetica', 'bold'); doc.setTextColor(51, 51, 51); }
      else { doc.setFont('helvetica', 'normal'); doc.setTextColor(85, 85, 85); }
      const wrapped = doc.splitTextToSize(line, CW);
      doc.text(wrapped, M, y);
      y += wrapped.length * 3 + 1;
    });
  }

  // Bottom stripe on last page
  doc.setFillColor(...hexToRgb(NAVY)); doc.rect(0, H - 3, W * 0.4, 3, 'F');
  doc.setFillColor(...hexToRgb(BLUE)); doc.rect(W * 0.4, H - 3, W * 0.3, 3, 'F');
  doc.setFillColor(...hexToRgb(RED)); doc.rect(W * 0.7, H - 3, W * 0.3, 3, 'F');

  return doc;
}

// ═══ MARGIN REPORT PDF ═══
export function generateMarginPDF({ cats, sels, companies, ci, gP, itemDN, cTot }) {
  const doc = new jsPDF('l', 'mm', 'letter'); // landscape
  const W = doc.internal.pageSize.getWidth();
  const M = 15;
  let y = M;

  // Header
  doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(...hexToRgb(NAVY));
  doc.text('Margin Calculator', M, y);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...hexToRgb(MUTED));
  doc.text(`${ci.name || '—'} • Rev. ${ci.revision}`, M, y + 5);
  doc.setFontSize(7); doc.setTextColor(220, 38, 38);
  doc.text('ADMIN ONLY', W - M, y, { align: 'right' });
  y += 12;

  // Build data
  const sections = [];
  let tMat = 0, tLH = 0, tLC = 0, tPO = 0, tList = 0, t3rd = 0;
  

  Object.entries(cats).forEach(([k, cat]) => {
    const co = companies[k]; if (!co) return;
    const rates = co.rates || {};
    Object.entries(cat).forEach(([sn, sec]) => {
      const rows = [];
      (sec.items || []).forEach(it => {
        const s = (sels[k] || {})[it.id]; if (!s || !s.on) return;
        const q = it.hq && s.q > 0 ? s.q : 1;
        const mat = (it.mc || 0) * q; const lh = (it.lh || 0) * q;
        const lc = Math.round(lh * (rates.laborRate || 30));
        const po = Math.round(lc * (rates.pohr || 2));
        const cost = mat + lc + po;
        let lp = gP(it, s);
        const is3 = sn.toLowerCase().includes('3rd');
        if (!is3) lp = Math.round(lp * (1 + (rates.markup || 10) / 100));
        const mg = lp - cost; const mp = lp > 0 ? Math.round(mg / lp * 100) : 0;
        rows.push([itemDN(it, s), q, mat, lh.toFixed(1), lc, po, cost, lp, mg, mp + '%']);
        tMat += mat; tLH += lh; tLC += lc; tPO += po; tList += lp; if (is3) t3rd += lp;
      });
      if (rows.length > 0) sections.push({ co: co.name, color: co.color, sn, rows });
    });
  });

  if (sections.length === 0) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(...hexToRgb(MUTED));
    doc.text('No items selected for margin analysis.', M, y);
    return doc;
  }

  // KPIs
  const manC = tMat + tLC + tPO;
  const mRev = tList - manC;
  const mPct = tList > 0 ? Math.round(mRev / tList * 100) : 0;
  const kpis = [
    ['Total List Price', '$' + Math.round(tList).toLocaleString()],
    ['Manufacturing Cost', '$' + Math.round(manC).toLocaleString()],
    ['Margin Revenue', '$' + Math.round(mRev).toLocaleString()],
    ['Gross Margin', mPct + '%'],
  ];
  const kpiW = (W - 2 * M) / 4;
  kpis.forEach((kpi, i) => {
    const x = M + i * kpiW;
    doc.setDrawColor(...hexToRgb('#e2e4e9')); doc.roundedRect(x, y, kpiW - 4, 14, 1, 1, 'S');
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6); doc.setTextColor(...hexToRgb(MUTED));
    doc.text(kpi[0].toUpperCase(), x + 3, y + 5);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(...hexToRgb(NAVY));
    doc.text(kpi[1], x + 3, y + 11);
  });
  y += 20;

  // Group by company
  const coGroups = {};
  sections.forEach(sec => {
    if (!coGroups[sec.co]) coGroups[sec.co] = { color: sec.color, rows: [] };
    // Section header row
    coGroups[sec.co].rows.push({ isHeader: true, name: sec.sn });
    sec.rows.forEach(r => coGroups[sec.co].rows.push({ isHeader: false, data: r }));
  });

  const cols = ['Item', 'Qty', 'Material', 'Labor Hrs', 'Labor $', 'POHR', 'Cost', 'List Price', 'Margin', 'M%'];

  Object.entries(coGroups).forEach(([coName, grp]) => {
    // Company header
    doc.setFillColor(...hexToRgb(grp.color));
    doc.roundedRect(M, y, W - 2 * M, 8, 1, 1, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(255, 255, 255);
    doc.text(coName, M + 4, y + 5.5);
    y += 12;

    // Table
    const tableRows = [];
    grp.rows.forEach(r => {
      if (r.isHeader) {
        tableRows.push([{ content: r.name, colSpan: 10, styles: { fontStyle: 'bold', textColor: hexToRgb(grp.color), fillColor: [248, 249, 251] } }]);
      } else {
        tableRows.push(r.data.map((v, i) => {
          const val = typeof v === 'number' ? '$' + Math.round(v).toLocaleString() : v;
          return i === 0 ? val : val;
        }));
      }
    });

    doc.autoTable({
      startY: y,
      head: [cols],
      body: tableRows,
      margin: { left: M, right: M },
      styles: { fontSize: 7, cellPadding: 1.5 },
      headStyles: { fillColor: hexToRgb('#f8f9fb'), textColor: hexToRgb(MUTED), fontStyle: 'bold', fontSize: 6 },
      columnStyles: {
        0: { cellWidth: 55 },
        1: { halign: 'center', cellWidth: 12 },
        2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' },
        5: { halign: 'right' }, 6: { halign: 'right' }, 7: { halign: 'right' },
        8: { halign: 'right' }, 9: { halign: 'right', cellWidth: 14 },
      },
    });

    y = doc.lastAutoTable.finalY + 10;
  });

  // Summary cards at bottom
  if (y + 30 > doc.internal.pageSize.getHeight() - 15) { doc.addPage(); y = M; }

  const cardW = (W - 2 * M - 10) / 3;
  const summaries = [
    ['Contract Info', [['Middleby Equipment', '$' + Math.round(tList - t3rd).toLocaleString()], ['3rd Party', '$' + Math.round(t3rd).toLocaleString()], ['Total Package', '$' + Math.round(tList).toLocaleString()]]],
    ['POC Info', [['Material Cost', '$' + Math.round(tMat).toLocaleString()], ['Labor Hours', tLH.toFixed(1) + ' hrs'], ['Labor Cost', '$' + Math.round(tLC).toLocaleString()], ['POHR', '$' + Math.round(tPO).toLocaleString()]]],
    ['Margin Summary', [['Equipment + 3rd Party', '$' + Math.round(tList).toLocaleString()], ['Manufacturing Cost', '-$' + Math.round(manC).toLocaleString()], ['Margin Revenue', '$' + Math.round(mRev).toLocaleString()], ['Gross Margin', mPct + '%']]],
  ];

  summaries.forEach((card, ci) => {
    const x = M + ci * (cardW + 5);
    doc.setDrawColor(...hexToRgb('#e2e4e9')); doc.roundedRect(x, y, cardW, 32, 1, 1, 'S');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...hexToRgb(NAVY));
    doc.text(card[0], x + 3, y + 5);
    doc.setDrawColor(...hexToRgb(NAVY)); doc.line(x + 3, y + 7, x + cardW - 3, y + 7);

    card[1].forEach((row, ri) => {
      const ry = y + 11 + ri * 5;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(51, 51, 51);
      doc.text(row[0], x + 3, ry);
      doc.setFont('helvetica', 'bold');
      doc.text(row[1], x + cardW - 3, ry, { align: 'right' });
    });
  });

  return doc;
}
