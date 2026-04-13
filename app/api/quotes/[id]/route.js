import { NextResponse } from 'next/server';
import { getCurrentUser, canReviewQuotes, canApproveQuotes } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const quote = await db.quote.findUnique({
    where: { id: params.id },
    include: {
      createdBy: { select: { id: true, name: true, role: true } },
      reviewedBy: { select: { id: true, name: true } },
      approvedBy: { select: { id: true, name: true } },
      customer: true,
      auditLogs: { include: { user: { select: { name: true } } }, orderBy: { createdAt: 'desc' } },
    },
  });
  if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ quote });
}

export async function PATCH(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { action, note, reviewerId, selections, grandTotal } = await request.json();
  const quote = await db.quote.findUnique({ where: { id: params.id } });
  if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  let update = {};
  switch (action) {
    case 'submit':
      if (quote.status !== 'draft' && quote.status !== 'info_requested') return NextResponse.json({ error: 'Invalid state' }, { status: 400 });
      update = { status: 'submitted', submittedAt: new Date(), submitNote: note, reviewerId: reviewerId || null };
      break;
    case 'request_info':
      if (!canReviewQuotes(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      update = { status: 'info_requested', infoRequestNote: note, infoRequestedAt: new Date(), reviewerId: user.id };
      break;
    case 'review_approve':
      if (!canReviewQuotes(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      update = { status: 'reviewed', reviewerId: user.id, reviewedAt: new Date(), reviewNote: note };
      break;
    case 'approve':
      if (!canApproveQuotes(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      update = { status: 'approved', managerId: user.id, approvedAt: new Date(), managerNote: note, pricingSnapshot: quote.selections };
      break;
    case 'recall':
      if (quote.createdById !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      update = { status: 'draft', submittedAt: null, submitNote: null, reviewerId: null, reviewedAt: null, reviewNote: null };
      break;
    case 'save':
      update = { selections, grandTotal };
      break;
    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const updated = await db.quote.update({ where: { id: params.id }, data: update });
  await db.auditLog.create({ data: { quoteId: params.id, userId: user.id, action, details: { note } } });
  return NextResponse.json({ quote: updated });
}
