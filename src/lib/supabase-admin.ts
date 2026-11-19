import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://ovwlviiojtktuhmvqahi.supabase.co";

let cachedAdminClient: SupabaseClient | null = null;

/**
 * Cliente Supabase com Service Role Key (uso exclusivo em rotas de servidor).
 * Retorna null se SUPABASE_SERVICE_ROLE_KEY não estiver configurada no ambiente.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return null;
  }
  if (!cachedAdminClient) {
    cachedAdminClient = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return cachedAdminClient;
}
