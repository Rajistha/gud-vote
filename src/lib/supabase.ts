import "server-only";
import { createClient } from "@supabase/supabase-js";

const opts = { auth: { persistSession: false, autoRefreshToken: false } } as const;

export function supabaseConfigured(): boolean {
  return !!process.env.SUPABASE_URL && !!process.env.SUPABASE_ANON_KEY;
}

/** Memeriksa email + password ke Supabase Auth. Sesi aplikasi dibuat sendiri (lihat session.ts). */
export async function verifyPassword(email: string, password: string): Promise<{ email: string } | null> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL dan SUPABASE_ANON_KEY belum diisi.");

  const { data, error } = await createClient(url, key, opts).auth.signInWithPassword({ email, password });
  if (error || !data.user?.email) return null;
  return { email: data.user.email.toLowerCase() };
}
