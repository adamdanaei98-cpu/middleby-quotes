import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { signToken } from '@/lib/auth';
export async function POST(request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    const user = await db.user.findFirst({ where: { OR: [{ email: email.toLowerCase() }, { name: { equals: email, mode: 'insensitive' } }], active: true } });
    if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    const token = await signToken({ userId: user.id, role: user.role });
    const response = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, isAdmin: user.isAdmin } });
    response.cookies.set('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60*60*8, path: '/' });
    return response;
  } catch (e) { console.error('Login error:', e); return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 }); }
}
