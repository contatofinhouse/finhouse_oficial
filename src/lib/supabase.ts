import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ovwlviiojtktuhmvqahi.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_XvvL4Sy56Q880zKPNMfudg_nAKBE7XC";

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase credentials missing. Check your environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
