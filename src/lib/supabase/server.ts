/*
 * Server-side Supabase client using the service-role key.
 * Returns null when Supabase isn't configured, allowing fallback to local .data/*.json store.
 * Never import this into client components.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { hasSupabase } from "@/lib/env";

let cached: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient | null {
  if (!hasSupabase()) return null;
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  cached = createClient(url, key, {
    auth: { persistSession: false },
  });
  return cached;
}
