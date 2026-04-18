import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { AuthProvider } from '@/components/AuthProvider';
import { QuoteProvider } from '@/components/QuoteProvider';
import NavBar from '@/components/NavBar';

export default async function DashboardLayout({ children }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const bKey = process.env.BROWSERLESS_KEY || '';
  return (
    <AuthProvider initialUser={user}>
      <QuoteProvider>
        <div style={{ minHeight: '100vh', background: '#f4f5f7' }}>
          <NavBar />
          {children}
        </div>
        {bKey && <script dangerouslySetInnerHTML={{ __html: `window.__ENV__={BROWSERLESS_KEY:"${bKey}"}` }} />}
      </QuoteProvider>
    </AuthProvider>
  );
}
