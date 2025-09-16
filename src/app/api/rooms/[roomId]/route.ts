import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export async function GET(request: Request, context: any) {
  // In Next.js dynamic API handlers `params` can be async; await before using properties
  const { params } = context || {};
  const { roomId } = (await params) as { roomId: string } || {};
  try {
    const supabaseAdmin: any = getSupabaseClient(true);
    const resp = await supabaseAdmin.from('rooms').select('*').eq('id', roomId).limit(1).single();
    if ((resp as any).error) return NextResponse.json({ success: false, error: (resp as any).error.message }, { status: 404 });
    const data = (resp as any).data;
    return NextResponse.json({ success: true, room: data });
  } catch (err) {
    console.warn('GET room failed (maybe rooms table missing):', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
