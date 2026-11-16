import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { invalidateCache } from "./cache";
import { queryOne, query } from "./db";

export type Admin = { id: string; email: string; name: string | null };

const COOKIE = "gud_admin";
const MAX_AGE = 60 * 60 * 12; // 12 jam

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET harus diisi (minimal 32 karakter).");
  return new TextEncoder().encode(s);
}

export async function createSession(adminId: string) {
  const token = await new SignJWT({ sub: adminId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

/** Admin saat ini, divalidasi ulang ke database di setiap request. */
export const getAdmin = cache(async (): Promise<Admin | null> => {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    return await queryOne<Admin>("SELECT id, email, name FROM admins WHERE id = $1", [payload.sub]);
  } catch {
    return null;
  }
});

/** Dipakai di layout, halaman, dan server action admin. */
export async function requireAdmin(): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

export async function audit(adminId: string | null, action: string, detail: Record<string, unknown> = {}) {
  await query("INSERT INTO audit_logs (admin_id, action, detail) VALUES ($1, $2, $3)", [
    adminId,
    action,
    JSON.stringify(detail),
  ]);
  // Setiap aksi panitia yang tercatat dapat mengubah data publik: kosongkan cache agar langsung terlihat.
  invalidateCache();
}
