import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Get user's company key for filtering
    let userCompanyKey = null;
    if (user.primaryCompanyId) {
      const co = await db.company.findUnique({ where: { id: user.primaryCompanyId }, select: { key: true } });
      if (co) userCompanyKey = co.key;
    }

    const isCorporate = user.role === 'supervisor' || (user.isAdmin && !user.primaryCompanyId);

    let quotes = await db.quote.findMany({
      include: {
        createdBy: { select: { id: true, name: true, role: true } },
        reviewedBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true, plant: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    // Filter by visibility
    if (!isCorporate) {
      if (userCompanyKey) {
        quotes = quotes.filter(q => {
          // User created it
          if (q.createdById === user.id) return true;
          // User is assigned as reviewer or manager
          if (q.reviewerId === user.id || q.managerId === user.id) return true;
          // Quote involves user's company (individual or bundle)
          if (q.companyKeys && q.companyKeys.includes(userCompanyKey)) return true;
          return false;
        });
      } else {
        // User with no company and not corporate — see nothing
        quotes = quotes.filter(q => q.createdById === user.id);
      }
    }
    // Corporate (supervisor or corporate admin) sees everything

    return NextResponse.json({ quotes });
  } catch (e) { return NextResponse.json({ error: e.message, quotes: [] }, { status: 500 }); }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const data = await request.json();
    const count = await db.quote.count();
    const quoteNumber = 'QC-' + String(100001 + count).slice(1);
    const quote = await db.quote.create({
      data: {
        quoteNumber, mode: data.mode || 'bundle',
        customerId: data.customerId || null, customerName: data.customerName,
        contactName: data.contactName, contactEmail: data.contactEmail,
        plantName: data.plantName, repName: data.repName, purpose: data.purpose,
        selections: data.selections || {}, grandTotal: data.grandTotal || 0,
        companyKeys: data.companyKeys || [], createdById: user.id,
        terms: data.terms, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    await db.auditLog.create({ data: { quoteId: quote.id, userId: user.id, action: 'created', details: { quoteNumber } } });
    return NextResponse.json({ quote }, { status: 201 });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
