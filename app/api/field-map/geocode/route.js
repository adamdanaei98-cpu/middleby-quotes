import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { address } = await request.json();
    if (!address) return NextResponse.json({ error: 'Missing address' }, { status: 400 });
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`, {
      headers: { 'User-Agent': 'QuoteCraft-FieldMap/1.0' },
    });
    const data = await res.json();
    if (!data || data.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), display_name: data[0].display_name });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
