import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get('customerId');
  const visits = await db.visit.findMany({
    where: customerId ? { customerId } : {},
    include: { user: { select: { name: true } }, customer: { select: { name: true } } },
    orderBy: { visitDate: 'desc' },
    take: 50,
  });
  return NextResponse.json({ visits });
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const data = await request.json();
    const visit = await db.visit.create({
      data: {
        customerId: data.customerId,
        userId: user.id,
        type: data.type || 'in_person',
        notes: data.notes || null,
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
        visitDate: data.visitDate ? new Date(data.visitDate) : new Date(),
      },
      include: { user: { select: { name: true } } },
    });
    return NextResponse.json({ visit });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
