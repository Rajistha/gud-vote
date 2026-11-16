import "server-only";
import { cookies, headers } from "next/headers";
import { queryOne } from "./db";
import { hashDevice, safeEqual } from "./security";
import type { Settings } from "./election";

export const VENUE_COOKIE = "gud_venue";
export const DEVICE_COOKIE = "gud_device";
export const DONE_COOKIE = "gud_done";

/** Kode lokasi sudah dimasukkan (atau memang tidak diwajibkan). */
export async function venueOk(s: Settings): Promise<boolean> {
  if (!s.require_venue_code) return true;
  const v = (await cookies()).get(VENUE_COOKIE)?.value;
  return !!v && !!s.venue_code_hash && safeEqual(v, s.venue_code_hash);
}

/** Perangkat ini sudah dipakai memilih (hanya bila pengaman perangkat aktif). */
export async function deviceUsed(s: Settings): Promise<boolean> {
  if (!s.require_device_guard) return false;
  const token = (await cookies()).get(DEVICE_COOKIE)?.value;
  if (!token) return false;
  const row = await queryOne("SELECT 1 FROM device_guards WHERE token_hash = $1", [hashDevice(token)]);
  return !!row;
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

export function paslonTheme(n: number): string {
  return `pc${((n - 1) % 3) + 1}`;
}

export function toLines(text: string | null | undefined): string[] {
  return (text ?? "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
}

/** ID video YouTube dari berbagai bentuk tautan, atau null. */
export function youtubeId(url: string | null | undefined): string | null {
  const m = (url ?? "").match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  return m ? m[1] : null;
}
