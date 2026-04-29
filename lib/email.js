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

const emailWrapper = (statusLabel, statusColor, content) => `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:540px;margin:0 auto;background:#fff;border:1px solid #e2e4e9;border-radius:14px;overflow:hidden">
  <div style="background:#003250;padding:14px 24px">
    <span style="color:#fff;font-size:15px;font-weight:800;font-style:italic;letter-spacing:.5px">MIDDLEBY</span>
    <span style="color:rgba(255,255,255,.35);font-size:7px;margin-left:6px;letter-spacing:1px">FOOD PROCESSING</span>
  </div>
  <div style="height:3px;background:linear-gradient(90deg,#003250 40%,#0074BB 40%,#0074BB 70%,#E12C3E 70%)"></div>
  ${content}
  <div style="padding:12px 24px;background:#f8f9fb;border-top:1px solid #eef0f2;font-size:10px;color:#8b919e">
    Middleby Food Processing • Equipment Quoting Platform
  </div>
</div>`;

const statusBadge = (label, color) => `<span style="display:inline-block;padding:3px 12px;border-radius:12px;font-size:11px;font-weight:700;color:${color};background:${color}15;border:1px solid ${color}30">${label}</span>`;

const infoCard = (quote) => `
<div style="background:#f8f9fb;border-radius:10px;padding:16px 20px;margin:16px 0;border:1px solid #eef0f2">
  <table style="width:100%;border-collapse:collapse">
    <tr>
      <td style="padding:4px 0;width:50%"><span style="font-size:9px;font-weight:700;color:#8b919e;letter-spacing:.5px">CUSTOMER</span><br><span style="font-size:14px;font-weight:700;color:#003250">${quote.customerName || '—'}</span></td>
      <td style="padding:4px 0"><span style="font-size:9px;font-weight:700;color:#8b919e;letter-spacing:.5px">CONTACT</span><br><span style="font-size:13px;color:#333">${quote.contactName || '—'}</span></td>
    </tr>
    <tr>
      <td style="padding:8px 0 4px"><span style="font-size:9px;font-weight:700;color:#8b919e;letter-spacing:.5px">REP</span><br><span style="font-size:13px;color:#333">${quote.repName || '—'}</span></td>
      <td style="padding:8px 0 4px"><span style="font-size:9px;font-weight:700;color:#8b919e;letter-spacing:.5px">TOTAL</span><br><span style="font-size:20px;font-weight:800;color:#003250">$${Math.round(quote.grandTotal || 0).toLocaleString()}</span></td>
    </tr>
  </table>
</div>
<div style="margin-bottom:16px">
  ${(quote.companies || []).map(c => `<span style="display:inline-block;padding:4px 12px;border-radius:12px;font-size:10px;font-weight:700;color:#fff;background:${c.color || '#003250'};margin-right:4px">${c.name}</span>`).join('')}
  <span style="display:inline-block;padding:4px 12px;border-radius:12px;font-size:10px;font-weight:700;color:#333;background:#f3f4f6;border:1px solid #e2e4e9">${(quote.mode || 'bundle').charAt(0).toUpperCase() + (quote.mode || 'bundle').slice(1)}</span>
</div>`;

export function quoteSubmittedEmail(quote, reviewer) {
  return {
    to: reviewer.email,
    subject: `[Action Required] ${quote.quoteNumber} — Submitted for Review`,
    html: emailWrapper('Submitted', '#d97706', `
      <div style="padding:24px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px">
          <div>
            <div style="font-size:22px;font-weight:800;color:#003250;margin-bottom:2px">${quote.quoteNumber}</div>
            <div style="font-size:11px;color:#8b919e">Rev. ${quote.revision || 1} • ${(quote.mode || 'bundle').charAt(0).toUpperCase() + (quote.mode || 'bundle').slice(1)} • ${new Date().toLocaleDateString()}</div>
          </div>
          <div>${statusBadge('Submitted', '#d97706')}</div>
        </div>
        ${infoCard(quote)}
        <div style="background:#fffbeb;border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:12px;color:#92400e">
          Submitted — waiting for your review
          ${quote.submitNote ? `<div style="margin-top:6px;font-style:italic;color:#78350f">"${quote.submitNote}"</div>` : ''}
        </div>
        <div style="font-size:11px;color:#8b919e">
          Created by <strong>${quote.createdByName || 'Sales Rep'}</strong> — ${new Date().toLocaleString()}
        </div>
      </div>
    `),
  };
}

export function quoteReviewedEmail(quote, manager) {
  return {
    to: manager.email,
    subject: `[Approval Needed] ${quote.quoteNumber} — Ready for Approval`,
    html: emailWrapper('Reviewed', '#2563eb', `
      <div style="padding:24px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px">
          <div>
            <div style="font-size:22px;font-weight:800;color:#003250;margin-bottom:2px">${quote.quoteNumber}</div>
            <div style="font-size:11px;color:#8b919e">Rev. ${quote.revision || 1} • ${(quote.mode || 'bundle').charAt(0).toUpperCase() + (quote.mode || 'bundle').slice(1)}</div>
          </div>
          <div>${statusBadge('Reviewed', '#2563eb')}</div>
        </div>
        ${infoCard(quote)}
        <div style="background:#dbeafe;border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:12px;color:#1e40af">
          Reviewed — waiting for your final approval
        </div>
      </div>
    `),
  };
}

export function quoteApprovedEmail(quote, creator) {
  return {
    to: creator.email,
    subject: `${quote.quoteNumber} — Approved ✓`,
    html: emailWrapper('Approved', '#16a34a', `
      <div style="padding:24px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px">
          <div>
            <div style="font-size:22px;font-weight:800;color:#003250;margin-bottom:2px">${quote.quoteNumber}</div>
            <div style="font-size:11px;color:#8b919e">Rev. ${quote.revision || 1} • ${(quote.mode || 'bundle').charAt(0).toUpperCase() + (quote.mode || 'bundle').slice(1)}</div>
          </div>
          <div>${statusBadge('Approved', '#16a34a')}</div>
        </div>
        ${infoCard(quote)}
        <div style="background:#dcfce7;border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:12px;color:#166534">
          Approved — ready to send to customer
        </div>
      </div>
    `),
  };
}

export function infoRequestedEmail(quote, creator, note) {
  return {
    to: creator.email,
    subject: `[Action Required] ${quote.quoteNumber} — More Info Needed`,
    html: emailWrapper('Info Requested', '#9333ea', `
      <div style="padding:24px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px">
          <div>
            <div style="font-size:22px;font-weight:800;color:#003250;margin-bottom:2px">${quote.quoteNumber}</div>
            <div style="font-size:11px;color:#8b919e">Rev. ${quote.revision || 1} • ${(quote.mode || 'bundle').charAt(0).toUpperCase() + (quote.mode || 'bundle').slice(1)}</div>
          </div>
          <div>${statusBadge('Info Requested', '#9333ea')}</div>
        </div>
        ${infoCard(quote)}
        ${note ? `<div style="background:#f3e8ff;border-radius:8px;padding:12px 16px;margin-bottom:16px;border-left:3px solid #9333ea">
          <div style="font-size:12px;font-weight:600;color:#7c3aed">"${note}"</div>
        </div>` : ''}
        <div style="background:#f3e8ff;border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:12px;color:#6b21a8">
          Info requested — please update and resubmit
        </div>
      </div>
    `),
  };
}
