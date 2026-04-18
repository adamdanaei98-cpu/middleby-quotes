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
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  return [parseInt(hex.slice(0,2),16), parseInt(hex.slice(2,4),16), parseInt(hex.slice(4,6),16)];
}

function fmtPrice(n) { return '$' + Math.round(n||0).toLocaleString('en-US'); }

// ═══ PROPOSAL PDF ═══
export function generateProposalPDF({ cats, sels, companies, ci, mode, terms, cTot, gP, itemDN }) {
  const doc = new jsPDF('p', 'mm', 'letter');
  const W = doc.internal.pageSize.getWidth(); // 215.9
  const H = doc.internal.pageSize.getHeight(); // 279.4
  const LM = 22; // left margin
  const RM = W - 22; // right edge
  const CW = RM - LM; // content width
  let y = 0;

  function newPage() { doc.addPage(); y = 0; topStripe(); }
  function need(h) { if (y + h > H - 18) newPage(); }
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
  function line(color, thickness) {
    doc.setDrawColor(...color); doc.setLineWidth(thickness||0.3);
    doc.line(LM, y, RM, y);
  }

  // ─── PAGE 1: COVER ───
  topStripe(); y = 14;

  // Logo
  doc.setFont('helvetica', 'bolditalic'); doc.setFontSize(24); doc.setTextColor(...NAVY);
  doc.text('MIDDLEBY', LM, y);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...MUTED);
  doc.text('FOOD PROCESSING', LM + 52, y - 1);
  y += 10;

  // Title
  doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.setTextColor(...NAVY);
  doc.text(mode === 'bundle' ? 'Bundle Equipment Proposal' : 'Equipment Proposal', LM, y);
  y += 7;

  // Subtitle
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...MUTED);
  doc.text('Proposal #' + (ci.proposalNumber||'—') + '  Rev. ' + (ci.revision||'1') + '  |  ' + (ci.name||'—') + '  |  ' + new Date().toLocaleDateString(), LM, y);
  y += 10;

  // Active companies
  const activeCos = Object.keys(cats).filter(k => {
    const cat = cats[k] || {};
    return Object.values(cat).some(sec => (sec.items||[]).some(it => sels[k]?.[it.id]?.on));
  });

  if (activeCos.length === 0) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(12); doc.setTextColor(...MUTED);
    doc.text('No items selected.', LM, y + 10);
    botStripe(); return doc;
  }

  // Company badges
  let bx = LM;
  activeCos.forEach(k => {
    const co = companies[k]; if (!co) return;
    const rgb = hex2rgb(co.color);
    const tw = doc.getTextWidth(co.name) + 8;
    doc.setFillColor(...rgb); doc.roundedRect(bx, y-4, tw, 7, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...WHITE);
    doc.text(co.name, bx + 4, y + 0.5);
    bx += tw + 4;
  });
  y += 12;

  // Separator
  line(NAVY, 0.6); y += 8;

  // ─── BUNDLE INTRO ───
  if (mode === 'bundle' && activeCos.length > 1) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(...NAVY);
    doc.text('The Complete Line Solution', LM, y); y += 10;

    activeCos.forEach(k => {
      const co = companies[k]; if (!co) return;
      need(28);
      const rgb = hex2rgb(co.color);
      // Card background
      doc.setFillColor(rgb[0], rgb[1], rgb[2], 0.06);
      doc.setDrawColor(...rgb); doc.setLineWidth(0.3);
      doc.roundedRect(LM, y, CW, 22, 2, 2, 'FD');
      // Icon circle
      doc.setFillColor(...rgb); doc.circle(LM + 10, y + 11, 6, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(...WHITE);
      doc.text(co.name[0], LM + 7.5, y + 13.5);
      // Company name
      doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(...rgb);
      doc.text(co.name, LM + 20, y + 8);
      // Description
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...MUTED);
      doc.text(co.desc || '', LM + 20, y + 13);
      // Exec summary preview
      if (co.execSummary) {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(100, 100, 100);
        const lines = doc.splitTextToSize(co.execSummary, CW - 25);
        doc.text(lines.slice(0, 2), LM + 20, y + 18);
      }
      y += 26;
    });
    y += 4;
  }

  // Purpose
  if (ci.purpose) {
    need(16);
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(LM, y, CW, 12, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'italic'); doc.setFontSize(9); doc.setTextColor(85, 85, 85);
    const pLines = doc.splitTextToSize(ci.purpose, CW - 10);
    doc.text(pLines.slice(0, 3), LM + 5, y + 5);
    y += Math.min(pLines.length, 3) * 4 + 8;
  }

  // ─── PER-COMPANY SECTIONS ───
  activeCos.forEach(k => {
    const co = companies[k]; if (!co) return;
    const cat = cats[k] || {};
    const coTotal = cTot(cat, sels[k]||{}).g;
    const rgb = hex2rgb(co.color);

    need(25);

    // Company section header with color bar
    doc.setFillColor(...rgb); doc.rect(LM, y, CW, 1, 'F'); y += 5;

    // Color accent bar on left
    doc.setFillColor(...rgb); doc.rect(LM, y - 1, 2, 10, 'F');

    doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.setTextColor(...rgb);
    doc.text(co.name, LM + 6, y + 4);

    doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(...rgb);
    doc.text(fmtPrice(coTotal), RM, y + 4, { align: 'right' });
    y += 8;

    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...MUTED);
    doc.text(co.desc || '', LM + 6, y); y += 5;

    // Executive summary
    if (co.execSummary) {
      need(14);
      doc.setFillColor(250, 251, 252); doc.roundedRect(LM + 4, y, CW - 8, 10, 1, 1, 'F');
      doc.setFillColor(...rgb); doc.rect(LM + 4, y, 1.5, 10, 'F');
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(68, 68, 68);
      const sLines = doc.splitTextToSize(co.execSummary, CW - 18);
      doc.text(sLines.slice(0, 3), LM + 8, y + 4);
      y += Math.min(sLines.length, 3) * 3 + 6;
    }
    y += 3;

    // Items grouped by section
    let prevSec = '';
    Object.entries(cat).forEach(([sn, sec]) => {
      (sec.items || []).forEach(it => {
        const s = sels[k]?.[it.id]; if (!s || !s.on) return;
        const pr = gP(it, s); if (pr === 0 && !(it.hq && s.q > 0)) return;
        const pr = gP(it, s);
        const dn = itemDN(it, s);
        const qtyStr = it.hq && s.q > 0 ? '  —  Qty. ' + s.q : '';

        // Section header
        if (sn !== prevSec) {
          need(10);
          doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...rgb);
          doc.text(sn, LM + 4, y); y += 5;
          prevSec = sn;
        }

        // Item line
        need(8);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(...BLACK);
        doc.text(dn + qtyStr, LM + 8, y);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...rgb);
        doc.text(fmtPrice(pr), RM, y, { align: 'right' });
        y += 4;

        // Description (first line only for brevity)
        if (it.desc) {
          doc.setFont('helvetica', 'italic'); doc.setFontSize(7); doc.setTextColor(120, 120, 120);
          const descFirst = it.desc.split('\n')[0].replace(/^[•\-]\s*/, '').substring(0, 90);
          doc.text(descFirst, LM + 12, y);
          y += 3.5;
        }
        y += 1.5;
      });
    });

    // Company total
    need(12);
    doc.setFillColor(...rgb); doc.rect(LM, y, CW, 0.6, 'F'); y += 5;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(...rgb);
    doc.text(co.name + ' Total', LM + 4, y);
    doc.text(fmtPrice(coTotal), RM, y, { align: 'right' });
    y += 14;
  });

  // ─── PRICE SUMMARY ───
  need(35);
  doc.setFillColor(...NAVY); doc.rect(LM, y, CW, 0.6, 'F'); y += 8;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(...NAVY);
  doc.text('Price Summary', LM, y); y += 8;

  let gt = 0;
  activeCos.forEach(k => {
    const co = companies[k]; if (!co) return;
    const t = cTot(cats[k]||{}, sels[k]||{}).g; gt += t;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...hex2rgb(co.color));
    doc.text(co.name, LM + 4, y);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...BLACK);
    doc.text(fmtPrice(t), LM + 110, y, { align: 'right' });
    y += 6;
  });

  // Grand total
  y += 2;
  doc.setDrawColor(...NAVY); doc.setLineWidth(0.8); doc.line(LM, y, LM + 110, y); y += 6;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(...NAVY);
  doc.text(mode === 'bundle' ? 'BUNDLE TOTAL:' : 'TOTAL:', LM + 4, y);
  doc.text(fmtPrice(gt), LM + 110, y, { align: 'right' });
  y += 14;

  // ─── TERMS ───
  if (terms && terms.trim()) {
    need(20);
    doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.2); doc.line(LM, y, RM, y); y += 8;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...NAVY);
    doc.text('Terms & Conditions', LM, y); y += 6;

    terms.split('\n').forEach(ln => {
      if (!ln.trim()) { y += 2; return; }
      need(5);
      const isH = /^\d+\./.test(ln.trim());
      doc.setFont('helvetica', isH ? 'bold' : 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(isH ? 51 : 100, isH ? 51 : 100, isH ? 51 : 100);
      const wrapped = doc.splitTextToSize(ln, CW - 4);
      doc.text(wrapped, LM + 2, y);
      y += wrapped.length * 3.2 + 1;
    });
  }

  botStripe();
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
  doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(...NAVY);
  doc.text('Margin Calculator', M, y);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...MUTED);
  doc.text((ci.name||'') + '  •  Rev. ' + (ci.revision||'1'), M, y + 5);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(220, 38, 38);
  doc.text('ADMIN ONLY', W - M, y, { align: 'right' });
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
        rows.push([itemDN(it,s), String(q), fmtPrice(mat), lh.toFixed(1), fmtPrice(lc), fmtPrice(po), fmtPrice(cost), fmtPrice(lp), fmtPrice(mg), mp+'%']);
        tMat+=mat; tLH+=lh; tLC+=lc; tPO+=po; tList+=lp; if(is3) t3rd+=lp;
      });
      if (rows.length > 0) sections.push({ co: co.name, color: co.color, sn, rows });
    });
  });

  if (sections.length === 0) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(12); doc.setTextColor(...MUTED);
    doc.text('No items selected.', M, y + 10);
    return doc;
  }

  // KPIs
  const manC = tMat + tLC + tPO;
  const mRev = tList - manC;
  const mPct = tList > 0 ? Math.round(mRev/tList*100) : 0;
  const kpis = [
    ['TOTAL LIST PRICE', fmtPrice(tList)],
    ['MANUFACTURING COST', fmtPrice(manC)],
    ['MARGIN REVENUE', fmtPrice(mRev)],
    ['GROSS MARGIN', mPct + '%'],
  ];
  const kpiW = (W - 2*M - 15) / 4;
  kpis.forEach((kpi, i) => {
    const x = M + i * (kpiW + 5);
    doc.setDrawColor(226, 228, 233); doc.setLineWidth(0.3);
    doc.roundedRect(x, y, kpiW, 16, 1.5, 1.5, 'S');
    doc.setFillColor(...NAVY); doc.rect(x, y, kpiW, 1, 'F');
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6); doc.setTextColor(...MUTED);
    doc.text(kpi[0], x + 4, y + 6);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(...NAVY);
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

    // Company header bar
    doc.setFillColor(...rgb);
    doc.roundedRect(M, y, W - 2*M, 10, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...WHITE);
    doc.text(coName, M + 5, y + 7);
    y += 14;

    // Build table body with section headers
    const body = [];
    grp.sections.forEach(sec => {
      body.push([{ content: sec.sn, colSpan: 10, styles: { fontStyle: 'bold', textColor: rgb, fillColor: [248, 249, 251], fontSize: 8 } }]);
      sec.rows.forEach(r => body.push(r));
    });

    doc.autoTable({
      startY: y,
      head: [colHeaders],
      body: body,
      margin: { left: M, right: M },
      styles: { fontSize: 7.5, cellPadding: 2, lineColor: [240, 240, 240], lineWidth: 0.1 },
      headStyles: { fillColor: [248, 249, 251], textColor: [...MUTED], fontStyle: 'bold', fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { halign: 'center', cellWidth: 14 },
        2: { halign: 'right', cellWidth: 22 },
        3: { halign: 'right', cellWidth: 20 },
        4: { halign: 'right', cellWidth: 20 },
        5: { halign: 'right', cellWidth: 20 },
        6: { halign: 'right', cellWidth: 22 },
        7: { halign: 'right', cellWidth: 24, fontStyle: 'bold' },
        8: { halign: 'right', cellWidth: 22 },
        9: { halign: 'right', cellWidth: 16 },
      },
      didParseCell: function(data) {
        // Color the margin % cell
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

  // Bottom summary
  need(40);
  const cardW = (W - 2*M - 12) / 3;
  const summaries = [
    { title: 'Contract Info', rows: [['Middleby Equipment', fmtPrice(tList - t3rd)], ['3rd Party', fmtPrice(t3rd)], ['Total Package', fmtPrice(tList)]] },
    { title: 'POC Info', rows: [['Material Cost', fmtPrice(tMat)], ['Labor Hours', tLH.toFixed(1)+' hrs'], ['Labor Cost', fmtPrice(tLC)], ['POHR', fmtPrice(tPO)]] },
    { title: 'Margin Summary', rows: [['Equipment + 3rd Party', fmtPrice(tList)], ['Manufacturing Cost', '-'+fmtPrice(manC)], ['Margin Revenue', fmtPrice(mRev)], ['Gross Margin', mPct+'%']] },
  ];

  summaries.forEach((card, ci) => {
    const x = M + ci * (cardW + 6);
    doc.setDrawColor(226, 228, 233); doc.setLineWidth(0.3);
    doc.roundedRect(x, y, cardW, 34, 1.5, 1.5, 'S');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...NAVY);
    doc.text(card.title, x + 4, y + 6);
    doc.setFillColor(...NAVY); doc.rect(x + 4, y + 8, cardW - 8, 0.5, 'F');
    card.rows.forEach((row, ri) => {
      const ry = y + 14 + ri * 5.5;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...BLACK);
      doc.text(row[0], x + 4, ry);
      doc.setFont('helvetica', 'bold');
      doc.text(row[1], x + cardW - 4, ry, { align: 'right' });
    });
  });

  return doc;
}
