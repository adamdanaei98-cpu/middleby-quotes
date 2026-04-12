// lib/auth.js
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { db } from './db';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'middleby-dev-secret-change-in-prod'
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
  } catch { return null; }
}

export async function getCurrentUser() {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload?.userId) return null;
  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, name: true, email: true, role: true, isAdmin: true, primaryCompanyId: true, active: true },
  });
  if (!user || !user.active) return null;
  return user;
}

// ─── PERMISSION HELPERS ─────────────────────────────────────

export const ROLES = {
  salesperson: { label: 'Salesperson', level: 1 },
  reviewer:    { label: 'Reviewer', level: 2 },
  manager:     { label: 'Manager', level: 3 },
  supervisor:  { label: 'Supervisor', level: 4 },
};

// Can access admin panel (catalog, users, customers, etc.)
export function canAccessAdmin(user) {
  if (!user) return false;
  if (user.role === 'supervisor') return true;
  if (user.role === 'reviewer') return true; // reviewer = reviewer/admin at company level
  if (user.isAdmin) return true; // any role with admin flag
  return false;
}

// Can edit catalog items for a given company
export function canEditCatalog(user, companyId) {
  if (!user) return false;
  if (user.role === 'supervisor') return true;
  if (user.role === 'reviewer') return true;
  if (user.isAdmin) return true;
  return false;
}

// Can manage users
export function canManageUsers(user) {
  if (!user) return false;
  if (user.role === 'supervisor') return true;
  if (user.isAdmin) return true;
  return false;
}

// Can review quotes (approve to manager or request info)
export function canReviewQuotes(user) {
  if (!user) return false;
  return user.role === 'reviewer' || user.role === 'supervisor';
}

// Can approve quotes (final approval)
export function canApproveQuotes(user) {
  if (!user) return false;
  return user.role === 'manager' || user.role === 'supervisor';
}

// Can manage customers
export function canManageCustomers(user) {
  if (!user) return false;
  if (user.role === 'supervisor') return true;
  if (user.role === 'reviewer') return true;
  if (user.isAdmin) return true;
  return false;
}
