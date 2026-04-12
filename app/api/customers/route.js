import { NextResponse } from 'next/server';
import { getCurrentUser, canManageCustomers } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const customers = await db.customer.findMany({ where: { active: true }, orderBy: { name: 'asc' } });
  return NextResponse.json({ customers });
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!canManageCustomers(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const data = await request.json();
  const customer = await db.customer.create({ data });
  return NextResponse.json({ customer }, { status: 201 });
}
