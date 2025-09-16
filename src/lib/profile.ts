// Profile management utilities
import { supabase } from '@/lib/supabase';

export interface UserProfile {
  id: string;
  email?: string;
  username?: string;
  avatar_url?: string;
  // Highest score achieved in casual mode (time-based points)
  casual_high_score?: number | null;
  // Some deployments use `create_at` instead of `created_at`; make optional to be defensive
  created_at?: string;
  updated_at?: string;
}

export async function getProfile(userId: string): Promise<UserProfile | null> {
  try {
    // Helper to serialize error objects (some Supabase/PostgREST errors have non-enumerable props)
    const serializeError = (err: any) => {
      if (!err) return err;
      try {
        const obj: Record<string, any> = {};
        Object.getOwnPropertyNames(err).forEach((k) => {
          try { obj[k] = (err as any)[k]; } catch (e) { obj[k] = String((err as any)[k]); }
        });
        // include common fields explicitly
        obj.message = obj.message ?? (err as any).message;
        obj.code = obj.code ?? (err as any).code;
        obj.details = obj.details ?? (err as any).details;
        return obj;
      } catch (e) {
        return String(err);
      }
    };

    // Select only columns that exist in the DB schema (screenshot shows `create_at`)
    const { data, error, status } = await supabase
      .from('profiles')
      .select('id, username, casual_high_score, create_at')
      .eq('id', userId)
      .single();

    if (error) {
      // PostgREST returns PGRST116 / 406 when the result contains 0 rows.
      // For our use-case that's expected for new users without a profile row yet.
      const code = (error as any)?.code || '';
      if (status === 406 || code === 'PGRST116') {
        // silently return null (no profile yet)
        return null;
      }
      console.error('Error fetching profile', { ...(data ? { data } : {}), status, error: serializeError(error) });
      return null;
    }

    if (!data) return null;

    // Map DB `create_at` to `created_at` for compatibility
    const mapped: any = { ...data };
    if (mapped.create_at && !mapped.created_at) mapped.created_at = mapped.create_at;
    return mapped as UserProfile;
  } catch (err) {
    console.error('Unexpected error fetching profile (exception):', err);
    return null;
  }
}

export async function updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
  try {
    const { data, error, status } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .single();

    if (error) {
      // If update failed because there was no matching row (PostgREST PGRST116 / 406), prefer server-side upsert
      const code = (error as any)?.code || '';
      console.warn('Update profile failed, attempting server-side upsert fallback', { message: (error as any)?.message, code, status });

      try {
        const resp = await fetch('/api/profiles/upsert', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ id: userId, ...updates }),
        });
        const js = await resp.json().catch(() => ({ success: false, error: 'invalid-json' }));
        if (resp.ok && js?.success) {
          // Server returned upserted profile (or null if DB didn't return row)
          return js.profile ?? null;
        }
        console.warn('Server upsert fallback failed, server response:', resp.status, js);
      } catch (srvErr) {
        console.error('Exception calling server upsert fallback:', srvErr);
      }

      // Last-resort: try client-side insert (may fail under RLS)
      try {
        const toInsert: any = { id: userId, ...updates };
        const ins = await supabase.from('profiles').insert(toInsert).single();
        if ((ins as any).error) {
          console.error('Insert fallback failed for profile', { error: (ins as any).error });
          return null;
        }
        return (ins as any).data as UserProfile;
      } catch (insErr) {
        console.error('Exception during profile insert fallback:', insErr);
        return null;
      }
    }

    return data as UserProfile;
  } catch (error) {
    console.error('Unexpected error updating profile (exception):', error);
    return null;
  }
}

export async function createProfile(profile: Omit<UserProfile, 'created_at' | 'updated_at'>): Promise<UserProfile | null> {
  try {
    const { data, error, status } = await supabase
      .from('profiles')
      .insert(profile)
      .single();

    if (error) {
      console.error('Error creating profile', { message: (error as any)?.message, code: (error as any)?.code, status, error });
      return null;
    }

    return data as UserProfile;
  } catch (error) {
    console.error('Unexpected error creating profile (exception):', error);
    return null;
  }
}