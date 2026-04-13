import { NextResponse } from 'next/server';
import { getCurrentUser, canAccessAdmin } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const companies = await db.company.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } });
    return NextResponse.json({ companies });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!canAccessAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const data = await request.json();
    if (!data.name) return NextResponse.json({ error: 'Company name required' }, { status: 400 });
    const key = data.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) + '_' + Date.now().toString().slice(-4);
    const count = await db.company.count();
    const company = await db.company.create({
      data: { key, name: data.name, color: data.color || '#4A90D9', description: data.description || '', execSummary: '', rates: { laborRate: 30, pohr: 2, markup: 10, agentFee: 5, commission: 1.5, discount: 0, freight: 5000, install: 15000 }, sortOrder: count + 1 },
    });
    return NextResponse.json({ company }, { status: 201 });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function PATCH(request) {
  try {
    const user = await getCurrentUser();
    if (!canAccessAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const data = await request.json();
    if (!data.id) return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.execSummary !== undefined) updateData.execSummary = data.execSummary;
    if (data.rates !== undefined) updateData.rates = data.rates;
    if (data.logo !== undefined) updateData.logo = data.logo;
    if (data.machineImage !== undefined) updateData.machineImage = data.machineImage;
    const company = await db.company.update({ where: { id: data.id }, data: updateData });
    return NextResponse.json({ company });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
