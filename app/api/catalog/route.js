import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const companies = await db.company.findMany({
    where: { active: true },
    include: { catalogSections: { orderBy: { sortOrder: 'asc' }, include: { items: { where: { active: true }, orderBy: { sortOrder: 'asc' } } } } },
    orderBy: { sortOrder: 'asc' },
  });
  return NextResponse.json({ companies });
}
