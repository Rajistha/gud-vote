"use server";

import { redirect } from "next/navigation";
import { queryOne } from "@/lib/db";
import { rateLimit } from "@/lib/security";
import { audit, createSession } from "@/lib/session";
import { supabaseConfigured, verifyPassword } from "@/lib/supabase";
import { clientIp } from "@/lib/voter";

export type LoginState = { error?: string } | undefined;

export async function signIn(_prev: LoginState, fd: FormData): Promise<LoginState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  if (!email || !password) return { error: "Isi email dan password." };

  const ip = await clientIp();
  if (!rateLimit(`login:ip:${ip}`, 10, 10 * 60_000) || !rateLimit(`login:email:${email}`, 8, 10 * 60_000)) {
    return { error: "Terlalu banyak percobaan. Silakan coba beberapa menit lagi." };
  }
  if (!supabaseConfigured()) return { error: "Layanan masuk belum dikonfigurasi. Hubungi pengelola sistem." };

  let user: { email: string } | null;
  try {
    user = await verifyPassword(email, password);
  } catch (e) {
    console.error("Supabase Auth gagal:", e instanceof Error ? e.message : e);
    return { error: "Layanan masuk sedang tidak tersedia. Silakan coba lagi." };
  }
  if (!user) return { error: "Email atau password salah." };

  // Akun Supabase valid belum tentu panitia: peran ditentukan oleh tabel admins.
  const admin = await queryOne<{ id: string }>("SELECT id FROM admins WHERE lower(email) = $1", [user.email]);
  if (!admin) return { error: "Akun ini belum terdaftar sebagai panitia." };

  await createSession(admin.id);
  await audit(admin.id, "LOGIN", { method: "supabase" });
  redirect("/admin");
}

/** Hanya untuk pengembangan lokal. Ditolak di produksi walau variabelnya terisi. */
export async function devLogin(formData: FormData) {
  if (process.env.NODE_ENV === "production" || process.env.DEV_ADMIN_LOGIN !== "1") redirect("/admin/login");
  const id = String(formData.get("admin") ?? "");
  const admin = await queryOne<{ id: string }>("SELECT id FROM admins WHERE id::text = $1", [id]);
  if (!admin) redirect("/admin/login");
  await createSession(admin.id);
  await audit(admin.id, "LOGIN", { method: "dev" });
  redirect("/admin");
}
