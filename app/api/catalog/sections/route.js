import { NextResponse } from 'next/server';
import { getCurrentUser, canAccessAdmin } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!canAccessAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const data = await request.json();
    if (!data.companyId || !data.name) return NextResponse.json({ error: 'Company ID and section name required' }, { status: 400 });
    const existing = await db.catalogSection.findFirst({ where: { companyId: data.companyId, name: data.name } });
    if (existing) return NextResponse.json({ section: existing });
    const count = await db.catalogSection.count({ where: { companyId: data.companyId } });
    const section = await db.catalogSection.create({
      data: { companyId: data.companyId, name: data.name, sortOrder: count + 1 },
    });
    return NextResponse.json({ section }, { status: 201 });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function DELETE(request) {
  try {
    const user = await getCurrentUser();
    if (!canAccessAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Section ID required' }, { status: 400 });
    // Delete all items in the section first
    await db.catalogItem.deleteMany({ where: { sectionId: id } });
    await db.catalogSection.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
