import { NextResponse } from 'next/server';
import { requireServiceRole, supabase } from '@/lib/supabase';

const CATEGORY_TABLES = ['songs_kpop','songs_jpop','songs_thaipop','songs_pophits','songs_kdramaost','songs'];

async function findSongTableByIdOrSource(supabaseAdmin: any, id?: string, source_id?: string) {
  for (const t of CATEGORY_TABLES) {
    const q = id ? supabaseAdmin.from(t).select('id,play_count').eq('id', id).single()
                 : supabaseAdmin.from(t).select('id,play_count').eq('source_id', source_id).single();
    const { data, error } = await q;
    if (!error && data) return { table: t, row: data };
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, source_id } = body || {};
    const supabaseAdmin = requireServiceRole();
    if (!id && !source_id) return NextResponse.json({ success: false, error: 'id or source_id required' }, { status: 400 });

    const found = await findSongTableByIdOrSource(supabaseAdmin, id, source_id);
    if (!found) return NextResponse.json({ success: false, error: 'Song not found' }, { status: 404 });

    const { table, row } = found;
    const newCount = (row.play_count || 0) + 1;
    const { error: upError } = await supabaseAdmin.from(table).update({ play_count: newCount }).eq('id', row.id);
    if (upError) return NextResponse.json({ success: false, error: upError.message }, { status: 500 });

    return NextResponse.json({ success: true, id: row.id, play_count: newCount });
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'unknown' }, { status: 500 });
  }
}
