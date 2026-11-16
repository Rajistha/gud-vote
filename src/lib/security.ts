import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

function key() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET belum diisi.");
  return s;
}

export function hmac(value: string): string {
  return createHmac("sha256", key()).update(value).digest("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function hashVenueCode(code: string): string {
  return hmac(`venue:${code.trim().toLowerCase()}`);
}

export function newDeviceToken(): string {
  return randomBytes(24).toString("hex");
}

export function hashDevice(token: string): string {
  return hmac(`device:${token}`);
}

// Pembatas laju sederhana (per proses). Untuk skala besar pakai penyimpanan bersama (mis. Redis).
const buckets = new Map<string, { n: number; reset: number }>();

let lastSweep = 0;

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  // Bersihkan catatan kedaluwarsa secara berkala agar memori tidak terus bertambah.
  if (now - lastSweep > 60_000) {
    lastSweep = now;
    for (const [k, v] of buckets) if (now > v.reset) buckets.delete(k);
  }
  const b = buckets.get(key);
  if (!b || now > b.reset) {
    buckets.set(key, { n: 1, reset: now + windowMs });
    return true;
  }
  b.n += 1;
  return b.n <= max;
}
