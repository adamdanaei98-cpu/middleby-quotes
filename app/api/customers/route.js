import { NextResponse } from 'next/server';
import { getCurrentUser, canManageCustomers } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const customers = await db.customer.findMany({ where: { active: true }, orderBy: { name: 'asc' } });
    return NextResponse.json({ customers });
  } catch (e) {
    console.error('Get customers error:', e);
    return NextResponse.json({ error: e.message, customers: [] }, { status: 500 });
  }
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canManageCustomers(user)) return NextResponse.json({ error: 'You do not have permission to add customers' }, { status: 403 });
  try {
    const data = await request.json();
    if (!data.name) return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
    const customer = await db.customer.create({ data: { name: data.name, plant: data.plant || null, address: data.address || null, contact: data.contact || null, email: data.email || null, phone: data.phone || null, rep: data.rep || null, industry: data.industry || null } });
    return NextResponse.json({ customer }, { status: 201 });
  } catch (e) {
    console.error('Create customer error:', e);
    return NextResponse.json({ error: e.message || 'Failed to create customer' }, { status: 500 });
  }
}
