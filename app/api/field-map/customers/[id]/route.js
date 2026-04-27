import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function PUT(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!user.isAdmin && user.role !== 'manager' && user.role !== 'supervisor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const data = await request.json();
    const customer = await db.$transaction(async (tx) => {
      await tx.equipment.deleteMany({ where: { customerId: params.id } });
      await tx.customerContact.deleteMany({ where: { customerId: params.id } });
      await tx.customerFieldMapRep.deleteMany({ where: { customerId: params.id } });
      return tx.customer.update({
        where: { id: params.id },
        data: {
          name: data.name,
          plant: data.plant || null,
          address: data.address || null,
          contact: data.contact || null,
          contactRole: data.contactRole || null,
          email: data.email || null,
          phone: data.phone || null,
          city: data.city || null,
          state: data.state || null,
          country: data.country || null,
          lat: data.lat ? parseFloat(data.lat) : null,
          lng: data.lng ? parseFloat(data.lng) : null,
          concept: data.concept || null,
          notes: data.notes || null,
          keywords: data.keywords || [],
          primaryCompanyId: data.primaryCompanyId || null,
          equipment: data.equipment?.length ? {
            create: data.equipment.map(e => ({
              model: e.model, serial: e.serial || null,
              year: e.year ? parseInt(e.year) : null,
              status: e.status || 'active',
              companyId: e.companyId || null,
              notes: e.notes || null,
            })),
          } : undefined,
          contacts: data.contacts?.length ? {
            create: data.contacts.map(c => ({
              name: c.name, role: c.role || null,
              email: c.email || null, phone: c.phone || null,
              isPrimary: c.isPrimary || false,
            })),
          } : undefined,
          fieldMapReps: data.repIds?.length ? {
            create: data.repIds.map(uid => ({ userId: uid })),
          } : undefined,
        },
        include: {
          primaryCompany: true,
          equipment: { include: { company: true } },
          contacts: true,
          fieldMapReps: { include: { user: true } },
        },
      });
    });
    return NextResponse.json({ customer });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function DELETE(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!user.isAdmin && user.role !== 'manager' && user.role !== 'supervisor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  await db.customer.update({ where: { id: params.id }, data: { active: false } });
  return NextResponse.json({ ok: true });
}
