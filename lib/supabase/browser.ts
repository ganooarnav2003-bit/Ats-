import { createClient } from "@supabase/supabase-js";

/**
 * Browser/anon client. Never pass SUPABASE_SERVICE_ROLE_KEY here.
 * Clerk JWT (email + sub) is attached by the caller when available so RLS
 * current_employee_id() can resolve.
 */
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error("Supabase anon client is not configured.");
  }
  return createClient(url, anon, {
    auth: { persistSession: false },
  });
}
