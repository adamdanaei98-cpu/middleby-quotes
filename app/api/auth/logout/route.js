import { NextResponse } from 'next/server';
export async function POST() {
  const r = NextResponse.json({ success: true });
  r.cookies.set('token', '', { maxAge: 0, path: '/' });
  r.cookies.delete('token');
  return r;
}
