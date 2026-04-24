// lib/email.js
// Supports two email providers:
// 1. Gmail SMTP: Set GMAIL_USER + GMAIL_APP_PASSWORD
// 2. Resend API: Set RESEND_API_KEY + EMAIL_FROM

import nodemailer from 'nodemailer';

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_APP_PASSWORD;
const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM || GMAIL_USER || 'QuoteCraft <onboarding@resend.dev>';

async function sendViaGmail({ to, subject, html }) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: GMAIL_USER, pass: GMAIL_PASS },
  });
  const result = await transporter.sendMail({
    from: FROM, to: Array.isArray(to) ? to.join(',') : to, subject, html,
  });
  console.log('Gmail sent:', result.messageId);
  return { success: true, id: result.messageId };
}

async function sendViaResend({ to, subject, html }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: Array.isArray(to) ? to : [to], subject, html }),
  });
  const data = await res.json();
  console.log('Resend result:', res.status, JSON.stringify(data));
  if (!res.ok) return { success: false, error: data };
  return { success: true, id: data.id };
}

export async function sendEmail({ to, subject, html }) {
  if (!GMAIL_USER && !RESEND_KEY) {
    console.log('EMAIL SKIP (no email provider configured):', { to, subject });
    return { success: false, reason: 'No email provider' };
  }
  console.log('EMAIL SENDING:', { to, subject, provider: GMAIL_USER ? 'Gmail' : 'Resend' });
  try {
    if (GMAIL_USER && GMAIL_PASS) return await sendViaGmail({ to, subject, html });
    if (RESEND_KEY) return await sendViaResend({ to, subject, html });
  } catch (e) {
    console.error('Email error:', e.message);
    return { success: false, error: e.message };
  }
}

// ─── Notification templates ───

const emailWrapper = (content, accentColor) => `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:520px;margin:0 auto;background:#fff">
  <div style="background:#003250;padding:16px 24px;display:flex;align-items:center">
    <span style="color:#fff;font-size:16px;font-weight:800;font-style:italic;letter-spacing:.5px">MIDDLEBY</span>
    <span style="color:rgba(255,255,255,.4);font-size:8px;margin-left:8px">FOOD PROCESSING</span>
  </div>
  <div style="border-top:3px solid ${accentColor||'#0074BB'}"></div>
  <div style="padding:24px">${content}</div>
  <div style="padding:16px 24px;background:#f8f9fb;border-top:1px solid #eef0f2">
    <p style="margin:0;font-size:11px;color:#8b919e">QuoteCraft by Middleby Food Processing</p>
  </div>
</div>`;

export function quoteSubmittedEmail(quote, reviewer) {
  return {
    to: reviewer.email,
    subject: `[Action Required] Quote ${quote.quoteNumber} submitted for review`,
    html: emailWrapper(`
      <h2 style="color:#003250;margin:0 0 8px;font-size:18px">Quote Submitted for Review</h2>
      <p style="color:#555;margin:0 0 16px;font-size:13px"><strong>${quote.quoteNumber}</strong> needs your review.</p>
      <div style="background:#f8f9fb;border-radius:8px;padding:14px 18px;margin-bottom:16px">
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:6px 0;color:#8b919e;font-size:12px;width:100px">Customer</td><td style="padding:6px 0;font-weight:600;font-size:13px;color:#003250">${quote.customerName || '—'}</td></tr>
          <tr><td style="padding:6px 0;color:#8b919e;font-size:12px">Amount</td><td style="padding:6px 0;font-weight:800;font-size:16px;color:#003250">$${Math.round(quote.grandTotal || 0).toLocaleString()}</td></tr>
          <tr><td style="padding:6px 0;color:#8b919e;font-size:12px">Type</td><td style="padding:6px 0;font-size:13px">${quote.mode === 'bundle' ? 'Bundle Quote' : 'Individual Quote'}</td></tr>
          ${quote.submitNote ? `<tr><td style="padding:6px 0;color:#8b919e;font-size:12px">Note</td><td style="padding:6px 0;font-size:13px;font-style:italic;color:#555">"${quote.submitNote}"</td></tr>` : ''}
        </table>
      </div>
      <p style="color:#8b919e;font-size:11px;margin:0">Log in to QuoteCraft to review this quote.</p>
    `, '#d97706'),
  };
}

export function quoteReviewedEmail(quote, manager) {
  return {
    to: manager.email,
    subject: `[Approval Needed] Quote ${quote.quoteNumber} ready for approval`,
    html: emailWrapper(`
      <h2 style="color:#003250;margin:0 0 8px;font-size:18px">Quote Ready for Approval</h2>
      <p style="color:#555;margin:0 0 16px;font-size:13px"><strong>${quote.quoteNumber}</strong> has been reviewed and needs your final approval.</p>
      <div style="background:#f8f9fb;border-radius:8px;padding:14px 18px;margin-bottom:16px">
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:6px 0;color:#8b919e;font-size:12px;width:100px">Customer</td><td style="padding:6px 0;font-weight:600;font-size:13px;color:#003250">${quote.customerName || '—'}</td></tr>
          <tr><td style="padding:6px 0;color:#8b919e;font-size:12px">Amount</td><td style="padding:6px 0;font-weight:800;font-size:16px;color:#003250">$${Math.round(quote.grandTotal || 0).toLocaleString()}</td></tr>
        </table>
      </div>
      <p style="color:#8b919e;font-size:11px;margin:0">Log in to QuoteCraft to approve this quote.</p>
    `, '#2563eb'),
  };
}

export function quoteApprovedEmail(quote, creator) {
  return {
    to: creator.email,
    subject: `Quote ${quote.quoteNumber} has been approved ✓`,
    html: emailWrapper(`
      <div style="text-align:center;margin-bottom:16px">
        <div style="display:inline-block;width:48px;height:48px;border-radius:24px;background:#dcfce7;line-height:48px;font-size:24px">✓</div>
      </div>
      <h2 style="color:#16a34a;margin:0 0 8px;font-size:18px;text-align:center">Quote Approved</h2>
      <p style="color:#555;margin:0 0 16px;font-size:13px;text-align:center"><strong>${quote.quoteNumber}</strong> has been approved and is ready to send to the customer.</p>
      <div style="background:#f8f9fb;border-radius:8px;padding:14px 18px;margin-bottom:16px">
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:6px 0;color:#8b919e;font-size:12px;width:100px">Customer</td><td style="padding:6px 0;font-weight:600;font-size:13px;color:#003250">${quote.customerName || '—'}</td></tr>
          <tr><td style="padding:6px 0;color:#8b919e;font-size:12px">Amount</td><td style="padding:6px 0;font-weight:800;font-size:16px;color:#16a34a">$${Math.round(quote.grandTotal || 0).toLocaleString()}</td></tr>
        </table>
      </div>
    `, '#16a34a'),
  };
}

export function infoRequestedEmail(quote, creator, note) {
  return {
    to: creator.email,
    subject: `[Action Required] Quote ${quote.quoteNumber} — more info needed`,
    html: emailWrapper(`
      <h2 style="color:#9333ea;margin:0 0 8px;font-size:18px">More Information Requested</h2>
      <p style="color:#555;margin:0 0 16px;font-size:13px">The reviewer needs more information for <strong>${quote.quoteNumber}</strong>.</p>
      ${note ? `<div style="padding:14px 18px;background:#f3e8ff;border-radius:8px;border-left:3px solid #9333ea;margin-bottom:16px"><p style="color:#7c3aed;font-weight:600;margin:0;font-size:13px">"${note}"</p></div>` : ''}
      <p style="color:#8b919e;font-size:11px;margin:0">Log in to QuoteCraft to update and resubmit.</p>
    `, '#9333ea'),
  };
}
