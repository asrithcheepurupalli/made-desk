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
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  cached = createClient(url, key, {
    auth: { persistSession: false },
  });
  return cached;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(v: string): boolean {
  return UUID_RE.test(v);
}

/** PostgREST filter matching a slug, and the id column only when the value is a real uuid. */
export function slugOrIdFilter(v: string): string {
  const safe = v.replace(/[,()]/g, "");
  return isUuid(safe) ? `slug.eq.${safe},id.eq.${safe}` : `slug.eq.${safe}`;
}

/** Throw on Supabase errors so writes never fail silently or fall back to ephemeral storage. */
export function must<T extends { error: { message: string } | null }>(res: T, what: string): T {
  if (res.error) throw new Error(`Supabase ${what} failed: ${res.error.message}`);
  return res;
}
