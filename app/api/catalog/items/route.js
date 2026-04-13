import { NextResponse } from 'next/server';
import { getCurrentUser, canAccessAdmin } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!canAccessAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const data = await request.json();
    if (!data.sectionId || !data.name) return NextResponse.json({ error: 'Section ID and name required' }, { status: 400 });
    const count = await db.catalogItem.count({ where: { sectionId: data.sectionId } });
    const item = await db.catalogItem.create({
      data: {
        sectionId: data.sectionId, name: data.name,
        fixedPrice: data.fixedPrice || 0, variablePrice: data.variablePrice || 0,
        materialCost: data.materialCost || 0, laborHours: data.laborHours || 0,
        description: data.description || null, note: data.note || null,
        hasQuantity: data.hasQuantity || false, quantityLabel: data.quantityLabel || null,
        options: data.options || null, subOptions: data.subOptions || null,
        sortOrder: count + 1,
      },
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function PATCH(request) {
  try {
    const user = await getCurrentUser();
    if (!canAccessAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const data = await request.json();
    if (!data.id) return NextResponse.json({ error: 'Item ID required' }, { status: 400 });
    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.fixedPrice !== undefined) updateData.fixedPrice = data.fixedPrice;
    if (data.variablePrice !== undefined) updateData.variablePrice = data.variablePrice;
    if (data.materialCost !== undefined) updateData.materialCost = data.materialCost;
    if (data.laborHours !== undefined) updateData.laborHours = data.laborHours;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.note !== undefined) updateData.note = data.note;
    if (data.hasQuantity !== undefined) updateData.hasQuantity = data.hasQuantity;
    if (data.quantityLabel !== undefined) updateData.quantityLabel = data.quantityLabel;
    if (data.options !== undefined) updateData.options = data.options;
    if (data.subOptions !== undefined) updateData.subOptions = data.subOptions;
    const item = await db.catalogItem.update({ where: { id: data.id }, data: updateData });
    return NextResponse.json({ item });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function DELETE(request) {
  try {
    const user = await getCurrentUser();
    if (!canAccessAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Item ID required' }, { status: 400 });
    await db.catalogItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
