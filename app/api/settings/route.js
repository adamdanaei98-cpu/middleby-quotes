import { NextResponse } from 'next/server';
import { getCurrentUser, canAccessAdmin } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const settings = await db.setting.findMany();
    const obj = {};
    settings.forEach(s => { obj[s.key] = s.value; });
    return NextResponse.json({ settings: obj });
  } catch (e) { return NextResponse.json({ error: e.message, settings: {} }, { status: 500 }); }
}

export async function PUT(request) {
  try {
    const user = await getCurrentUser();
    if (!canAccessAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const data = await request.json();
    if (!data.key || data.value === undefined) return NextResponse.json({ error: 'Key and value required' }, { status: 400 });
    const setting = await db.setting.upsert({
      where: { key: data.key },
      update: { value: data.value },
      create: { key: data.key, value: data.value },
    });
    return NextResponse.json({ setting });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
