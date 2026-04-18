import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request) {
  // PDF_SERVER_URL = your Railway Puppeteer service URL
  const SERVER = process.env.PDF_SERVER_URL;
  if (!SERVER) return NextResponse.json({ error: 'PDF_SERVER_URL not configured' }, { status: 500 });

  try {
    const { url } = await request.json();
    if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 });

    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token')?.value || '';

    const res = await fetch(SERVER + '/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        cookie: 'auth-token=' + authToken,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('PDF server error:', errText);
      return NextResponse.json({ error: 'PDF generation failed' }, { status: 502 });
    }

    const pdfBuffer = await res.arrayBuffer();
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="proposal.pdf"',
      },
    });
  } catch (e) {
    console.error('PDF API error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
