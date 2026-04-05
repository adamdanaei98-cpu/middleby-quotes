// lib/auth.js
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { db } from './db';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'middleby-quotes-secret-change-in-production'
);

export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('8h')
    .sign(SECRET);
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload?.userId) return null;

  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      companyAccess: true,
      active: true,
    },
  });

  if (!user || !user.active) return null;
  return user;
}

export function canAccessAdmin(role) {
  return role === 'manager' || role === 'supervisor';
}

export const ROLES = {
  salesperson: { label: 'Salesperson', level: 1 },
  reviewer: { label: 'Reviewer', level: 2 },
  manager: { label: 'Manager', level: 3 },
  supervisor: { label: 'Supervisor', level: 4 },
};
