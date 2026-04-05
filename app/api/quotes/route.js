// app/api/quotes/route.js
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  let where = {};

  // Role-based visibility
  switch (user.role) {
    case 'salesperson':
      where.createdById = user.id;
      break;
    case 'reviewer':
      where.OR = [
        { createdById: user.id },
        { status: { in: ['submitted', 'reviewed', 'approved'] } },
      ];
      break;
    case 'manager':
      where.OR = [
        { createdById: user.id },
        { status: { in: ['reviewed', 'approved'] } },
      ];
      break;
    case 'supervisor':
      // sees everything
      break;
  }

  if (status) {
    where.status = status;
  }

  const quotes = await db.quote.findMany({
    where,
    include: {
      createdBy: { select: { id: true, name: true, role: true } },
      reviewedBy: { select: { id: true, name: true } },
      approvedBy: { select: { id: true, name: true } },
      customer: { select: { id: true, name: true, plant: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return NextResponse.json({ quotes });
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await request.json();

  // Generate quote number
  const count = await db.quote.count();
  const quoteNumber = `QC-${String(100001 + count).slice(1)}`;

  const quote = await db.quote.create({
    data: {
      quoteNumber,
      mode: data.mode || 'bundle',
      customerId: data.customerId || null,
      customerName: data.customerName,
      contactName: data.contactName,
      contactEmail: data.contactEmail,
      plantName: data.plantName,
      repName: data.repName,
      purpose: data.purpose,
      selections: data.selections || {},
      grandTotal: data.grandTotal || 0,
      companyKeys: data.companyKeys || [],
      createdById: user.id,
      terms: data.terms,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });

  // Audit log
  await db.auditLog.create({
    data: {
      quoteId: quote.id,
      userId: user.id,
      action: 'created',
      details: { quoteNumber },
    },
  });

  return NextResponse.json({ quote }, { status: 201 });
}
