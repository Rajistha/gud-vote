import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "candidate-photos";
const MAX_BYTES = 3 * 1024 * 1024;
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

type Result = { url: string } | { error: string };

function supa() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
}

/** Memeriksa isi berkas (bukan hanya ekstensi/MIME dari klien). */
function sniff(buf: Buffer): string | null {
  if (buf.length > 12 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.length > 12 && buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP") return "image/webp";
  return null;
}

export async function uploadCandidatePhoto(file: File): Promise<Result> {
  if (file.size > MAX_BYTES) return { error: "Ukuran foto maksimal 3 MB." };
  const buf = Buffer.from(await file.arrayBuffer());
  const type = sniff(buf);
  if (!type || !TYPES[type]) return { error: "Format foto harus JPG, PNG, atau WebP." };
  const name = `${randomUUID()}.${TYPES[type]}`;

  const client = supa();
  if (client) {
    // Bucket publik dibuat otomatis bila belum ada.
    const made = await client.storage.createBucket(BUCKET, { public: true, fileSizeLimit: MAX_BYTES, allowedMimeTypes: Object.keys(TYPES) });
    if (made.error && !/already exists|duplicate/i.test(made.error.message)) {
      console.error("Bucket foto:", made.error.message);
      return { error: "Penyimpanan foto belum tersedia. Hubungi pengelola sistem." };
    }
    const up = await client.storage.from(BUCKET).upload(name, buf, { contentType: type, upsert: false, cacheControl: "31536000" });
    if (up.error) {
      console.error("Unggah foto:", up.error.message);
      return { error: "Foto gagal diunggah. Silakan coba lagi." };
    }
    return { url: client.storage.from(BUCKET).getPublicUrl(name).data.publicUrl };
  }

  // Tanpa Supabase Storage: simpan ke folder lokal (khusus pengembangan; disk produksi tidak permanen).
  if (process.env.NODE_ENV === "production") {
    return { error: "Penyimpanan foto belum tersedia. Hubungi pengelola sistem." };
  }
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buf);
  return { url: `/uploads/${name}` };
}

/**
 * Menghapus foto dari penyimpanan. Mengembalikan false bila foto gagal dihapus
 * (dicatat di log) agar pemanggil bisa memberi tahu panitia, bukan diam-diam menyisakan berkas.
 */
export async function removeCandidatePhoto(url: string | null | undefined): Promise<boolean> {
  if (!url) return true;
  try {
    if (url.startsWith("/uploads/")) {
      await unlink(path.join(process.cwd(), "public", "uploads", path.basename(url))).catch((e: NodeJS.ErrnoException) => {
        if (e.code !== "ENOENT") throw e;
      });
      return true;
    }
    const marker = `/${BUCKET}/`;
    const i = url.indexOf(marker);
    const client = supa();
    if (!client || i < 0) return true; // bukan foto di penyimpanan kita
    const { error } = await client.storage.from(BUCKET).remove([url.slice(i + marker.length).split("?")[0]]);
    if (error) {
      console.error("Hapus foto gagal:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error("Hapus foto gagal:", e instanceof Error ? e.message : e);
    return false;
  }
}
