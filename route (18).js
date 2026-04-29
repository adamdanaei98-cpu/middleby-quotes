import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const users = await db.user.findMany({
    where: { active: true },
    select: { id: true, name: true, email: true, role: true, primaryCompanyId: true, primaryCompany: { select: { name: true, color: true } } },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json({ reps: users });
}
