import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      "Supabase not configured — NEXT_PUBLIC_SUPABASE_URL and key are missing."
    );
    return null;
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
