// app/api/quotes/[id]/route.js
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// GET single quote
export async function GET(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const quote = await db.quote.findUnique({
    where: { id: params.id },
    include: {
      createdBy: { select: { id: true, name: true, role: true, email: true } },
      reviewedBy: { select: { id: true, name: true } },
      approvedBy: { select: { id: true, name: true } },
      customer: true,
      auditLogs: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ quote });
}

// PATCH - update quote status (submit, review, approve, reject)
export async function PATCH(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { action, note, selections, grandTotal } = await request.json();
  const quote = await db.quote.findUnique({ where: { id: params.id } });
  if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  let update = {};
  let auditAction = action;

  switch (action) {
    case 'save':
      // Update selections/pricing
      update = { selections, grandTotal };
      auditAction = 'saved';
      break;

    case 'submit':
      if (quote.status !== 'draft') {
        return NextResponse.json({ error: 'Can only submit drafts' }, { status: 400 });
      }
      update = {
        status: 'submitted',
        submittedAt: new Date(),
        submitNote: note || null,
      };
      break;

    case 'review_approve':
      if (user.role !== 'reviewer' && user.role !== 'manager' && user.role !== 'supervisor') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (quote.status !== 'submitted') {
        return NextResponse.json({ error: 'Can only review submitted quotes' }, { status: 400 });
      }
      update = {
        status: 'reviewed',
        reviewerId: user.id,
        reviewedAt: new Date(),
        reviewNote: note || null,
      };
      break;

    case 'approve':
      if (user.role !== 'manager' && user.role !== 'supervisor') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (quote.status !== 'reviewed') {
        return NextResponse.json({ error: 'Can only approve reviewed quotes' }, { status: 400 });
      }
      update = {
        status: 'approved',
        managerId: user.id,
        approvedAt: new Date(),
        managerNote: note || null,
        pricingSnapshot: selections || quote.selections,
      };
      break;

    case 'reject':
      if (user.role === 'salesperson') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      update = {
        status: 'rejected',
        reviewerId: user.role === 'reviewer' ? user.id : quote.reviewerId,
        managerId: user.role === 'manager' || user.role === 'supervisor' ? user.id : quote.managerId,
        reviewNote: user.role === 'reviewer' ? (note || null) : quote.reviewNote,
        managerNote: user.role !== 'reviewer' ? (note || null) : quote.managerNote,
      };
      break;

    case 'recall':
      if (quote.createdById !== user.id) {
        return NextResponse.json({ error: 'Only creator can recall' }, { status: 403 });
      }
      update = {
        status: 'draft',
        submittedAt: null,
        submitNote: null,
        reviewerId: null,
        reviewedAt: null,
        reviewNote: null,
      };
      break;

    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const updated = await db.quote.update({
    where: { id: params.id },
    data: update,
  });

  await db.auditLog.create({
    data: {
      quoteId: params.id,
      userId: user.id,
      action: auditAction,
      details: { note },
    },
  });

  return NextResponse.json({ quote: updated });
}
