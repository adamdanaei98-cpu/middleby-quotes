// app/(dashboard)/layout.js
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { AuthProvider } from '@/components/AuthProvider';
import NavBar from '@/components/NavBar';

export default async function DashboardLayout({ children }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <AuthProvider initialUser={user}>
      <div style={{ minHeight: '100vh', background: '#f4f5f7' }}>
        <NavBar />
        {children}
      </div>
    </AuthProvider>
  );
}
