/**
 * Supabase client configuration for the BeatBattle Quiz Project
 * Handles both client-side (anonymous) and server-side (service role) connections
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

/**
 * Client-side Supabase client with anonymous access
 * Used for reading songs in the frontend quiz game
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persist session on the client so users stay signed in across reloads
    persistSession: true,
    // Let Supabase client auto-refresh tokens when possible
    autoRefreshToken: true
  }
});

/**
 * Server-side Supabase client with service role access
 * Used for admin operations (creating/updating songs, syncing playlists)
 * Only available on the server side
 */
export const supabaseAdmin = (() => {
  if (typeof window !== 'undefined') {
    // Client side - return null to prevent accidental usage
    return null;
  }
  
  if (!supabaseServiceKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
})();

/**
 * Get the appropriate Supabase client based on context
 */
export function getSupabaseClient(useServiceRole = false) {
  if (useServiceRole) {
    if (!supabaseAdmin) {
      throw new Error('Service role client not available on client side');
    }
    return supabaseAdmin;
  }
  return supabase;
}

/**
 * Helper to ensure we're using the service role client
 * Throws an error if called on client side
 */
export function requireServiceRole() {
  if (!supabaseAdmin) {
    throw new Error('Service role required but not available (are you on client side?)');
  }
  return supabaseAdmin;
}
