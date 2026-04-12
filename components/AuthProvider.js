'use client';
import { createContext, useContext, useState } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext(null);

export function AuthProvider({ children, initialUser }) {
  const [user, setUser] = useState(initialUser || null);
  const router = useRouter();
  const logout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); setUser(null); router.push('/login'); router.refresh(); };
  const canAdmin = user && (user.role === 'supervisor' || user.role === 'reviewer' || user.isAdmin);
  return <AuthContext.Provider value={{ user, setUser, logout, canAdmin }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be within AuthProvider');
  return ctx;
}
