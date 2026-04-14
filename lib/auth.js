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
  try {
    const cookieStore = await cookies();
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
  } catch (e) {
    console.error('getCurrentUser error:', e);
    return null;
  }
}

// ─── PERMISSION HELPERS ─────────────────────────────────────

export const ROLES = {
  salesperson: { label: 'Sales Rep', level: 1 },
  reviewer:    { label: 'Reviewer', level: 2 },
  manager:     { label: 'Manager', level: 3 },
  supervisor:  { label: 'Executive', level: 4 },
};

// Corporate admin = isAdmin flag + no primary company (or supervisor with isAdmin)
export function isCorporateAdmin(user) {
  if (!user) return false;
  return user.isAdmin && (!user.primaryCompanyId || user.role === 'supervisor');
}

// Corporate supervisor = supervisor role (view-only unless also admin)
export function isCorporateSupervisor(user) {
  if (!user) return false;
  return user.role === 'supervisor';
}

// Can access admin panel
export function canAccessAdmin(user) {
  if (!user) return false;
  if (user.role === 'supervisor') return true; // can view everything
  if (user.isAdmin) return true; // company or corporate admin
  if (user.role === 'reviewer') return true; // reviewer = company admin
  return false;
}

// Can edit data for a specific company
export function canEditCompanyData(user, companyId) {
  if (!user) return false;
  if (isCorporateAdmin(user)) return true; // corporate admin edits anything
  if (user.role === 'supervisor' && !user.isAdmin) return false; // supervisor without admin = view only
  // Company-level admin can edit own company only
  if (user.isAdmin || user.role === 'reviewer') {
    return user.primaryCompanyId === companyId;
  }
  return false;
}

// Can manage users
export function canManageUsers(user) {
  if (!user) return false;
  if (isCorporateAdmin(user)) return true;
  if (user.isAdmin) return true; // company admin
  return false;
}

// Can review quotes — company level only
export function canReviewQuotes(user) {
  if (!user) return false;
  return user.role === 'reviewer';
}

// Can approve quotes — company level only
export function canApproveQuotes(user) {
  if (!user) return false;
  return user.role === 'manager';
}

// Can manage customers
export function canManageCustomers(user) {
  if (!user) return false;
  if (isCorporateAdmin(user)) return true;
  if (user.isAdmin) return true;
  if (user.role === 'reviewer') return true;
  return false;
}
