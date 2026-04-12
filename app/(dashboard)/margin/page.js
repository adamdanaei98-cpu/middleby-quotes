'use client';
import { useQuote } from '@/components/QuoteProvider';
import { C } from '@/lib/transform';
export default function Page() {
  const { loading } = useQuote();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 56px)' }}><div style={{ fontSize: 16, color: C.muted }}>Loading...</div></div>;
  return <div style={{ maxWidth: 1320, margin: '0 auto', padding: 20 }}><h2 style={{ fontSize: 18, fontWeight: 800, color: '#003250' }}>Margin Calculator</h2><p style={{ fontSize: 12, color: '#8b919e', marginTop: 8 }}>This page will be fully built in the next session. The shared state from Builder carries here.</p></div>;
}
