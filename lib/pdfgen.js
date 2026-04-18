// lib/pdfgen.js
// Captures the on-screen HTML preview and converts to a multi-page PDF
// This ensures the downloaded PDF looks identical to the web preview

export async function capturePageAsPDF(elementId, filename) {
  const html2canvas = (await import('html2canvas')).default;
  const { jsPDF } = await import('jspdf');

  const element = document.getElementById(elementId);
  if (!element) { alert('Nothing to export. Select items first.'); return; }

  // Temporarily adjust for capture
  const origBg = document.body.style.background;
  document.body.style.background = '#fff';

  // Capture at 2x for quality
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    windowWidth: element.scrollWidth,
  });

  document.body.style.background = origBg;

  // PDF dimensions (letter size in mm)
  const pdfW = 215.9;
  const pdfH = 279.4;
  const margin = 10; // mm
  const contentW = pdfW - 2 * margin;
  const contentH = pdfH - 2 * margin;

  // Calculate scaling
  const imgW = canvas.width;
  const imgH = canvas.height;
  const ratio = contentW / (imgW / 2); // divide by scale factor
  const scaledH = (imgH / 2) * ratio;

  // How many pages?
  const pageContentH = contentH;
  const totalPages = Math.ceil(scaledH / pageContentH);

  const doc = new jsPDF('p', 'mm', 'letter');

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) doc.addPage();

    // Calculate which portion of the canvas to show on this page
    const srcY = (page * pageContentH / ratio) * 2; // multiply by scale
    const srcH = (pageContentH / ratio) * 2;
    const remainingH = imgH - srcY;
    const actualSrcH = Math.min(srcH, remainingH);

    // Create a temporary canvas for this page slice
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = imgW;
    pageCanvas.height = actualSrcH;
    const ctx = pageCanvas.getContext('2d');
    ctx.drawImage(canvas, 0, srcY, imgW, actualSrcH, 0, 0, imgW, actualSrcH);

    const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.95);
    const actualPageH = (actualSrcH / 2) * ratio;

    doc.addImage(pageImgData, 'JPEG', margin, margin, contentW, actualPageH);

    // Page number
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.text(`Page ${page + 1} of ${totalPages}`, pdfW - margin, pdfH - 5, { align: 'right' });
  }

  doc.save(filename);
}
