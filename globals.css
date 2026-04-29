import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const customers = await db.customer.findMany({
    where: { active: true },
    include: {
      primaryCompany: { select: { id: true, key: true, name: true, color: true } },
      company: { select: { id: true, key: true, name: true, color: true } },
      equipment: { include: { company: { select: { id: true, name: true, color: true } } } },
      contacts: { orderBy: { isPrimary: 'desc' } },
      plants: true,
      fieldMapReps: { include: { user: { select: { id: true, name: true, email: true, role: true, primaryCompanyId: true, primaryCompany: { select: { name: true, color: true } } } } } },
      visits: { orderBy: { visitDate: 'desc' }, take: 1, include: { user: { select: { name: true } } } },
    },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json({ customers });
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!user.isAdmin && user.role !== 'manager' && user.role !== 'supervisor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const data = await request.json();
    const customer = await db.customer.create({
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
        companyId: data.companyId || data.primaryCompanyId || null,
        equipment: data.equipment?.length ? {
          create: data.equipment.map(e => ({ model: e.model, serial: e.serial || null, year: e.year ? parseInt(e.year) : null, status: e.status || 'active', companyId: e.companyId || null, notes: e.notes || null })),
        } : undefined,
        contacts: data.contacts?.length ? {
          create: data.contacts.map(c => ({ name: c.name, role: c.role || null, email: c.email || null, phone: c.phone || null, isPrimary: c.isPrimary || false })),
        } : undefined,
        plants: data.plants?.length ? {
          create: data.plants.map(p => ({ name: p.name, address: p.address || null, city: p.city || null, state: p.state || null, country: p.country || null, lat: p.lat ? parseFloat(p.lat) : null, lng: p.lng ? parseFloat(p.lng) : null, contact: p.contact || null, phone: p.phone || null, notes: p.notes || null })),
        } : undefined,
        fieldMapReps: data.repIds?.length ? {
          create: data.repIds.map(uid => ({ userId: uid })),
        } : undefined,
      },
      include: { primaryCompany: true, equipment: { include: { company: true } }, contacts: true, plants: true, fieldMapReps: { include: { user: true } } },
    });
    return NextResponse.json({ customer });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
