// app/api/users/route.js
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getCurrentUser, canManageUsers } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const users = await db.user.findMany({
      where: { active: true },
      select: { id: true, name: true, email: true, role: true, isAdmin: true, primaryCompanyId: true, active: true, createdAt: true },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ users });
  } catch (e) {
    console.error('Get users error:', e);
    return NextResponse.json({ error: e.message, users: [] }, { status: 500 });
  }
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!canManageUsers(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const data = await request.json();
    if (!data.name || !data.email || !data.password) {
      return NextResponse.json({ error: 'Name, email, and password required' }, { status: 400 });
    }
    const existing = await db.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (existing) return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    const hashed = await bcrypt.hash(data.password, 10);
    const newUser = await db.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        password: hashed,
        role: data.role || 'salesperson',
        isAdmin: data.isAdmin || false,
        primaryCompanyId: data.primaryCompanyId || null,
      },
      select: { id: true, name: true, email: true, role: true, isAdmin: true, primaryCompanyId: true, active: true },
    });
    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (e) {
    console.error('Create user error:', e);
    return NextResponse.json({ error: e.message || 'Failed to create user' }, { status: 500 });
  }
}

export async function PATCH(request) {
  const user = await getCurrentUser();
  if (!canManageUsers(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const data = await request.json();
    if (!data.id) return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    const updateData = {};
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email.toLowerCase();
    if (data.role) updateData.role = data.role;
    if (data.isAdmin !== undefined) updateData.isAdmin = data.isAdmin;
    if (data.primaryCompanyId !== undefined) updateData.primaryCompanyId = data.primaryCompanyId || null;
    if (data.active !== undefined) updateData.active = data.active;
    if (data.password) updateData.password = await bcrypt.hash(data.password, 10);
    const updated = await db.user.update({
      where: { id: data.id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, isAdmin: true, primaryCompanyId: true, active: true },
    });
    return NextResponse.json({ user: updated });
  } catch (e) {
    console.error('Update user error:', e);
    return NextResponse.json({ error: e.message || 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const user = await getCurrentUser();
    if (!canManageUsers(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    if (id === user.id) return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
    // Soft delete - set active to false
    await db.user.update({ where: { id }, data: { active: false } });
    return NextResponse.json({ success: true });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
