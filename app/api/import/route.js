import { NextResponse } from 'next/server';
import { getCurrentUser, canAccessAdmin, canManageUsers } from '@/lib/auth';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!canAccessAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { type, rows, companyId, sectionId } = await request.json();
    if (!type || !rows || !Array.isArray(rows)) return NextResponse.json({ error: 'type and rows[] required' }, { status: 400 });

    let created = 0, errors = [];

    if (type === 'customers') {
      for (const row of rows) {
        try {
          if (!row.name) { errors.push('Missing name'); continue; }
          await db.customer.create({ data: { name: row.name, plant: row.plant || null, address: row.address || null, contact: row.contact || null, email: row.email || null, phone: row.phone || null, keywords: row.keywords ? row.keywords.split(',').map(k => k.trim()).filter(Boolean).slice(0, 3) : [], companyId: companyId || null } });
          created++;
        } catch (e) { errors.push(row.name + ': ' + e.message); }
      }
    }

    else if (type === 'catalog') {
      if (!companyId) return NextResponse.json({ error: 'companyId required for catalog import' }, { status: 400 });
      for (const row of rows) {
        try {
          if (!row.name || !row.section) { errors.push('Missing name or section'); continue; }
          // Get or create section
          let section = await db.catalogSection.findFirst({ where: { companyId, name: row.section } });
          if (!section) {
            const count = await db.catalogSection.count({ where: { companyId } });
            section = await db.catalogSection.create({ data: { companyId, name: row.section, sortOrder: count + 1 } });
          }
          const count = await db.catalogItem.count({ where: { sectionId: section.id } });
          await db.catalogItem.create({
            data: {
              sectionId: section.id, name: row.name,
              fixedPrice: parseFloat(row.fixedPrice) || 0,
              variablePrice: parseFloat(row.variablePrice) || 0,
              materialCost: parseFloat(row.materialCost) || 0,
              laborHours: parseFloat(row.laborHours) || 0,
              description: row.description ? row.description.replace(/\s*\|\s*/g, '\n') : null,
              note: row.note || null,
              hasQuantity: row.hasQuantity === 'true' || row.hasQuantity === true,
              quantityLabel: row.quantityLabel || null,
              sortOrder: count + 1,
            },
          });
          created++;
        } catch (e) { errors.push((row.name || '?') + ': ' + e.message); }
      }
    }

    else if (type === 'users') {
      if (!canManageUsers(user)) return NextResponse.json({ error: 'No permission to manage users' }, { status: 403 });
      for (const row of rows) {
        try {
          if (!row.name || !row.email || !row.password) { errors.push('Missing name/email/password'); continue; }
          const existing = await db.user.findUnique({ where: { email: row.email.toLowerCase() } });
          if (existing) { errors.push(row.email + ': already exists'); continue; }
          const hashed = await bcrypt.hash(row.password, 10);
          await db.user.create({
            data: {
              name: row.name, email: row.email.toLowerCase(), password: hashed,
              role: ['salesperson', 'reviewer', 'manager', 'supervisor'].includes(row.role) ? row.role : 'salesperson',
              isAdmin: row.isAdmin === 'true' || row.isAdmin === true,
              primaryCompanyId: companyId || null,
            },
          });
          created++;
        } catch (e) { errors.push((row.email || '?') + ': ' + e.message); }
      }
    }

    else { return NextResponse.json({ error: 'Unknown type: ' + type }, { status: 400 }); }

    return NextResponse.json({ created, errors, total: rows.length });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
