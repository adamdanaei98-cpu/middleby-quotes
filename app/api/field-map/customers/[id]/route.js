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
      // Delete all children to recreate
      await tx.equipment.deleteMany({ where: { customerId: params.id } });
      await tx.customerContact.deleteMany({ where: { customerId: params.id } });
      await tx.customerPlant.deleteMany({ where: { customerId: params.id } });
      await tx.customerFieldMapRep.deleteMany({ where: { customerId: params.id } });

      // Update customer
      await tx.customer.update({
        where: { id: params.id },
        data: {
          name: data.name, plant: data.plant || null, address: data.address || null,
          contact: data.contact || null, contactRole: data.contactRole || null,
          email: data.email || null, phone: data.phone || null,
          city: data.city || null, state: data.state || null, country: data.country || null,
          lat: data.lat ? parseFloat(data.lat) : null, lng: data.lng ? parseFloat(data.lng) : null,
          concept: data.concept || null, notes: data.notes || null, keywords: data.keywords || [],
          primaryCompanyId: data.primaryCompanyId || null,
        },
      });

      // Create contacts
      for (const c of (data.contacts || [])) {
        if (!c.name) continue;
        await tx.customerContact.create({ data: { customerId: params.id, name: c.name, role: c.role || null, email: c.email || null, phone: c.phone || null, isPrimary: c.isPrimary || false } });
      }

      // Create plants with their equipment
      for (const p of (data.plants || [])) {
        if (!p.name) continue;
        const plant = await tx.customerPlant.create({ data: { customerId: params.id, name: p.name, address: p.address || null, city: p.city || null, state: p.state || null, country: p.country || null, lat: p.lat ? parseFloat(p.lat) : null, lng: p.lng ? parseFloat(p.lng) : null, contact: p.contact || null, phone: p.phone || null, notes: p.notes || null } });
        for (const e of (p.equipment || [])) {
          if (!e.model) continue;
          await tx.equipment.create({ data: { customerId: params.id, plantId: plant.id, model: e.model, serial: e.serial || null, year: e.year ? parseInt(e.year) : null, status: e.status || 'active', companyId: e.companyId || null, notes: e.notes || null } });
        }
      }

      // Create any loose equipment (not in a plant)
      for (const e of (data.equipment || [])) {
        if (!e.model) continue;
        await tx.equipment.create({ data: { customerId: params.id, model: e.model, serial: e.serial || null, year: e.year ? parseInt(e.year) : null, status: e.status || 'active', companyId: e.companyId || null, notes: e.notes || null } });
      }

      // Create reps
      for (const uid of (data.repIds || [])) {
        await tx.customerFieldMapRep.create({ data: { customerId: params.id, userId: uid } });
      }

      return tx.customer.findUnique({
        where: { id: params.id },
        include: {
          primaryCompany: true,
          equipment: { include: { company: true, plant: true } },
          contacts: true,
          plants: { include: { equipment: { include: { company: true } } } },
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
