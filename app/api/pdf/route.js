import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request) {
  const BKEY = process.env.BROWSERLESS_KEY;
  if (!BKEY) return NextResponse.json({ error: 'BROWSERLESS_KEY not configured' }, { status: 500 });

  try {
    const { url } = await request.json();
    if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 });

    // Get the auth cookie to pass to Browserless
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token')?.value;
    const cookieStr = authToken ? 'auth-token=' + authToken : '';

    const res = await fetch('https://chrome.browserless.io/pdf?token=' + BKEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        cookies: authToken ? [{ name: 'auth-token', value: authToken, domain: new URL(url).hostname, path: '/' }] : [],
        options: {
          format: 'letter',
          printBackground: true,
          margin: { top: '12mm', bottom: '18mm', left: '15mm', right: '15mm' },
        },
        waitForSelector: '.pdf-doc',
        gotoOptions: { waitUntil: 'networkidle0', timeout: 30000 },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Browserless error:', errText);
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
