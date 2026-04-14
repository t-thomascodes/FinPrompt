import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Only cache a real client — never cache "null", so env changes after first import can still work after dev refresh. */
let cachedClient: SupabaseClient | undefined;

/**
 * Server-only Supabase client with the service role key (bypasses RLS).
 * Returns null when URL or service role key are not set — app runs in local-only mode.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceKey) {
    return null;
  }

  cachedClient = createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return cachedClient;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
}
