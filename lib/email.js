// lib/email.js
// Email notifications using Resend (https://resend.com)
// Set RESEND_API_KEY in environment variables
// Set EMAIL_FROM in environment variables (e.g. "QuoteCraft <quotes@yourdomain.com>")

const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM || 'QuoteCraft <onboarding@resend.dev>';

export async function sendEmail({ to, subject, html }) {
  if (!RESEND_KEY) {
    console.log('EMAIL SKIP (no RESEND_API_KEY):', { to, subject });
    return { success: false, reason: 'No API key' };
  }
  console.log('EMAIL SENDING:', { to, subject, from: FROM });
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: Array.isArray(to) ? to : [to], subject, html }),
    });
    const data = await res.json();
    console.log('EMAIL RESULT:', res.status, JSON.stringify(data));
    if (!res.ok) { console.error('Email failed:', data); return { success: false, error: data }; }
    return { success: true, id: data.id };
  } catch (e) { console.error('Email error:', e); return { success: false, error: e.message }; }
}

// Notification templates
export function quoteSubmittedEmail(quote, reviewer) {
  return {
    to: reviewer.email,
    subject: `Quote ${quote.quoteNumber} submitted for review`,
    html: `<div style="font-family:sans-serif;max-width:500px">
      <h2 style="color:#003250">Quote Submitted for Review</h2>
      <p><strong>${quote.quoteNumber}</strong> has been submitted for your review.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:6px 0;color:#8b919e">Customer</td><td style="padding:6px 0;font-weight:600">${quote.customerName || '—'}</td></tr>
        <tr><td style="padding:6px 0;color:#8b919e">Amount</td><td style="padding:6px 0;font-weight:600">$${Math.round(quote.grandTotal || 0).toLocaleString()}</td></tr>
        <tr><td style="padding:6px 0;color:#8b919e">Mode</td><td style="padding:6px 0">${quote.mode}</td></tr>
        ${quote.submitNote ? `<tr><td style="padding:6px 0;color:#8b919e">Note</td><td style="padding:6px 0;font-style:italic">${quote.submitNote}</td></tr>` : ''}
      </table>
      <p style="color:#8b919e;font-size:12px">Log in to QuoteCraft to review this quote.</p>
    </div>`,
  };
}

export function quoteReviewedEmail(quote, manager) {
  return {
    to: manager.email,
    subject: `Quote ${quote.quoteNumber} ready for approval`,
    html: `<div style="font-family:sans-serif;max-width:500px">
      <h2 style="color:#003250">Quote Ready for Approval</h2>
      <p><strong>${quote.quoteNumber}</strong> has been reviewed and is ready for your final approval.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:6px 0;color:#8b919e">Customer</td><td style="padding:6px 0;font-weight:600">${quote.customerName || '—'}</td></tr>
        <tr><td style="padding:6px 0;color:#8b919e">Amount</td><td style="padding:6px 0;font-weight:600">$${Math.round(quote.grandTotal || 0).toLocaleString()}</td></tr>
      </table>
      <p style="color:#8b919e;font-size:12px">Log in to QuoteCraft to approve this quote.</p>
    </div>`,
  };
}

export function quoteApprovedEmail(quote, creator) {
  return {
    to: creator.email,
    subject: `Quote ${quote.quoteNumber} has been approved!`,
    html: `<div style="font-family:sans-serif;max-width:500px">
      <h2 style="color:#16a34a">Quote Approved \u2713</h2>
      <p><strong>${quote.quoteNumber}</strong> has been approved.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:6px 0;color:#8b919e">Customer</td><td style="padding:6px 0;font-weight:600">${quote.customerName || '—'}</td></tr>
        <tr><td style="padding:6px 0;color:#8b919e">Amount</td><td style="padding:6px 0;font-weight:600">$${Math.round(quote.grandTotal || 0).toLocaleString()}</td></tr>
      </table>
    </div>`,
  };
}

export function infoRequestedEmail(quote, creator, note) {
  return {
    to: creator.email,
    subject: `Quote ${quote.quoteNumber} — more info requested`,
    html: `<div style="font-family:sans-serif;max-width:500px">
      <h2 style="color:#9333ea">More Information Requested</h2>
      <p>The reviewer has requested more information for <strong>${quote.quoteNumber}</strong>.</p>
      ${note ? `<div style="padding:12px;background:#f3e8ff;border-radius:8px;margin:16px 0"><p style="color:#9333ea;font-weight:600;margin:0">"${note}"</p></div>` : ''}
      <p style="color:#8b919e;font-size:12px">Log in to QuoteCraft to update and resubmit.</p>
    </div>`,
  };
}
