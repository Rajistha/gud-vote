// Memeriksa foto di Supabase Storage yang tidak dipakai paslon mana pun (foto yatim).
// Tanpa opsi: hanya menampilkan daftar. Dengan --delete: menghapus foto yatim.
import { createClient } from "@supabase/supabase-js";
import pg from "pg";

const BUCKET = "candidate-photos";
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key || !process.env.DATABASE_URL) {
  console.error("SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, dan DATABASE_URL harus diisi.");
  process.exit(1);
}

const supa = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const isLocal = /@(127\.0\.0\.1|localhost)[:/]/.test(process.env.DATABASE_URL);
const pool = new pg.Pool({
  connectionString: isLocal ? process.env.DATABASE_URL : process.env.DATABASE_URL.replace(/([?&])sslmode=[^&]*&?/, "$1").replace(/[?&]$/, ""),
  ssl: isLocal ? undefined : { rejectUnauthorized: false },
  max: 1,
});

try {
  const { rows } = await pool.query("SELECT photo_url FROM candidates WHERE photo_url IS NOT NULL");
  const used = new Set(rows.map((r) => decodeURIComponent(String(r.photo_url).split(`/${BUCKET}/`)[1]?.split("?")[0] ?? "")));

  const files = [];
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await supa.storage.from(BUCKET).list("", { limit: 100, offset });
    if (error) {
      if (/not found/i.test(error.message)) break;
      throw error;
    }
    if (!data?.length) break;
    files.push(...data.filter((f) => f.id).map((f) => f.name));
    if (data.length < 100) break;
  }

  const orphans = files.filter((f) => !used.has(f));
  console.log(`Foto di storage: ${files.length} | dipakai paslon: ${used.size} | yatim: ${orphans.length}`);
  orphans.forEach((f) => console.log("  yatim:", f));

  if (orphans.length && process.argv.includes("--delete")) {
    const { error } = await supa.storage.from(BUCKET).remove(orphans);
    if (error) throw error;
    console.log(`${orphans.length} foto yatim dihapus.`);
  } else if (orphans.length) {
    console.log("Jalankan dengan --delete untuk menghapusnya.");
  }
} catch (e) {
  console.error("Gagal:", e instanceof Error ? e.message : e);
  process.exitCode = 1;
} finally {
  await pool.end();
}
