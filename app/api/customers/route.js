import { NextResponse } from 'next/server';
import { getCurrentUser, canManageCustomers } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const customers = await db.customer.findMany({
      where: { active: true },
      include: { company: { select: { id: true, key: true, name: true, color: true } } },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ customers });
  } catch (e) { return NextResponse.json({ error: e.message, customers: [] }, { status: 500 }); }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!canManageCustomers(user)) return NextResponse.json({ error: 'No permission to manage customers' }, { status: 403 });
    const data = await request.json();
    if (!data.name) return NextResponse.json({ error: 'Customer name required' }, { status: 400 });
    const customer = await db.customer.create({
      data: {
        name: data.name, plant: data.plant || null, address: data.address || null,
        contact: data.contact || null, email: data.email || null, phone: data.phone || null,
        keywords: data.keywords || [], notes: data.notes || null,
        companyId: data.companyId || null,
      },
      include: { company: { select: { id: true, key: true, name: true, color: true } } },
    });
    return NextResponse.json({ customer }, { status: 201 });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function PATCH(request) {
  try {
    const user = await getCurrentUser();
    if (!canManageCustomers(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const data = await request.json();
    if (!data.id) return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });
    const upd = {};
    if (data.name !== undefined) upd.name = data.name;
    if (data.plant !== undefined) upd.plant = data.plant;
    if (data.address !== undefined) upd.address = data.address;
    if (data.contact !== undefined) upd.contact = data.contact;
    if (data.email !== undefined) upd.email = data.email;
    if (data.phone !== undefined) upd.phone = data.phone;
    if (data.keywords !== undefined) upd.keywords = data.keywords;
    if (data.notes !== undefined) upd.notes = data.notes;
    if (data.companyId !== undefined) upd.companyId = data.companyId || null;
    const customer = await db.customer.update({
      where: { id: data.id }, data: upd,
      include: { company: { select: { id: true, key: true, name: true, color: true } } },
    });
    return NextResponse.json({ customer });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
