import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
const ROLES = { salesperson: 'Sales Rep', reviewer: 'Reviewer', manager: 'Manager', supervisor: 'Executive' };
export async function GET() {
  try {
    const users = await db.user.findMany({ where: { active: true }, select: { name: true, email: true, role: true, isAdmin: true, primaryCompanyId: true }, orderBy: { createdAt: 'asc' }, take: 8 });
    const demos = users.map(u => ({ name: u.name, email: u.email, role: ROLES[u.role] || u.role, level: u.primaryCompanyId ? 'Company' : 'Corporate' }));
    return NextResponse.json({ demos });
  } catch { return NextResponse.json({ demos: [] }); }
}
