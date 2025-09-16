import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, username, casual_high_score } = body || {};
    if (!id) return NextResponse.json({ success: false, error: 'missing id' }, { status: 400 });

    const supabaseAdmin: any = getSupabaseClient(true);

    // Server-side validation for username
    if (typeof username !== 'undefined') {
      const MAX_USERNAME = 30;
      const usernamePattern = /^[A-Za-z0-9_-]+$/;
      if (typeof username !== 'string' || username.length < 3 || username.length > MAX_USERNAME) {
        return NextResponse.json({ success: false, error: `username length must be between 3 and ${MAX_USERNAME}` }, { status: 400 });
      }
      if (!usernamePattern.test(username)) {
        return NextResponse.json({ success: false, error: 'username contains invalid characters' }, { status: 400 });
      }
    }

    const payload: any = { id };
    if (typeof username !== 'undefined') payload.username = username;
    if (typeof casual_high_score !== 'undefined') payload.casual_high_score = casual_high_score;

    // Use upsert so we create or update in one call
    const resp = await supabaseAdmin.from('profiles').upsert(payload, { onConflict: 'id' }).select();

    // log for server-side debugging
    if (resp.error) console.error('profiles.upsert error:', resp.error);

    // resp.data can be an array; prefer returning first element if present
    const data = Array.isArray(resp.data) ? resp.data[0] : resp.data;

    if (resp.error) {
      return NextResponse.json({ success: false, error: resp.error.message || resp.error, details: resp.error, status: resp.status }, { status: 500 });
    }

    if (!data) {
      // no row returned — still consider success if upsert reported no error
      return NextResponse.json({ success: true, profile: null, note: 'upsert completed but no row returned' });
    }

    return NextResponse.json({ success: true, profile: data });
  } catch (err: any) {
    console.error('profiles/upsert route error', err);
    return NextResponse.json({ success: false, error: err?.message || String(err) }, { status: 500 });
  }
}
