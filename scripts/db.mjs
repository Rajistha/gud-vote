// Migrasi & seed.  node --env-file=.env.local scripts/db.mjs migrate|seed|seed-demo
import { readFileSync } from "node:fs";
import pg from "pg";

const cmd = process.argv[2];
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL belum diisi (lihat .env.example).");
  process.exit(1);
}

const isLocal = /@(127\.0\.0\.1|localhost)[:/]/.test(url);
const pool = new pg.Pool({
  // Database di luar komputer ini wajib memakai koneksi terenkripsi.
  connectionString: isLocal ? url : url.replace(/([?&])sslmode=[^&]*&?/, "$1").replace(/[?&]$/, ""),
  ssl: isLocal ? undefined : { rejectUnauthorized: false },
  max: 1,
});

/**
 * Menyalin data paslon dari database lokal ke database online (DATABASE_URL).
 * Hanya paslon: suara uji, jadwal contoh, dan log tidak ikut disalin. Aman diulang.
 */
async function copyLocal() {
  if (isLocal) {
    console.log("DATABASE_URL masih menunjuk ke database lokal. Arahkan ke Supabase dulu, lalu jalankan lagi.");
    return;
  }
  const src = process.env.LOCAL_DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:5433/postgres";
  const local = new pg.Pool({ connectionString: src, max: 1 });
  let rows;
  try {
    rows = (
      await local.query(
        `SELECT number, president_name, vice_name, president_info, vice_info, photo_url, vision, mission, programs, video_url
           FROM candidates ORDER BY number`,
      )
    ).rows;
  } catch (e) {
    console.log("Database lokal tidak bisa dibaca:", e.message);
    console.log("Jalankan dulu: npm run db:dev (biarkan terbuka), tutup server web (npm run dev) sebentar, lalu ulangi.");
    return;
  } finally {
    await local.end().catch(() => {});
  }
  if (rows.length === 0) {
    console.log("Database lokal tidak punya paslon untuk disalin.");
    return;
  }
  const have = (await pool.query("SELECT count(*)::int AS n FROM candidates")).rows[0].n;
  if (have > 0 && !process.argv.includes("--force")) {
    console.log(`Database online sudah punya ${have} paslon, tidak ada yang disalin. Tambahkan --force untuk menimpa berdasarkan nomor urut.`);
    return;
  }
  for (const r of rows) {
    // Foto yang tersimpan di folder lokal tidak ada di server online; unggah ulang dari halaman Paslon.
    const photo = r.photo_url && /^https?:\/\//.test(r.photo_url) ? r.photo_url : null;
    await pool.query(
      `INSERT INTO candidates (number, president_name, vice_name, president_info, vice_info, photo_url, vision, mission, programs, video_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (number) DO UPDATE SET president_name=EXCLUDED.president_name, vice_name=EXCLUDED.vice_name,
         president_info=EXCLUDED.president_info, vice_info=EXCLUDED.vice_info, photo_url=EXCLUDED.photo_url, vision=EXCLUDED.vision,
         mission=EXCLUDED.mission, programs=EXCLUDED.programs, video_url=EXCLUDED.video_url`,
      [r.number, r.president_name, r.vice_name, r.president_info, r.vice_info, photo, r.vision, r.mission, r.programs, r.video_url],
    );
    console.log(`  paslon ${r.number}: ${r.president_name} & ${r.vice_name}`);
  }
  console.log(`${rows.length} paslon disalin ke database online. Atur jadwal & jumlah anggota di halaman Jadwal.`);
}

/** Memeriksa koneksi & isi database, dengan petunjuk yang jelas bila gagal. */
async function check() {
  const host = (url.match(/@([^/:?]+)/) ?? [])[1] ?? "?";
  const port = (url.match(/@[^/:?]+:(\d+)/) ?? [])[1] ?? "5432";
  console.log(`Tujuan  : ${isLocal ? "database LOKAL di komputer ini" : "database ONLINE (Supabase/server)"}  [${host}:${port}]`);

  if (/\[YOUR-PASSWORD\]|GANTI|REGION|PROJECT-REF/i.test(url)) {
    console.log("\nGAGAL: DATABASE_URL masih berisi tulisan contoh (YOUR-PASSWORD / GANTI-… / REGION).");
    console.log("Tempel connection string asli dari Supabase dan ganti [YOUR-PASSWORD] dengan password database.");
    return;
  }
  try {
    await pool.query("SELECT 1");
  } catch (e) {
    const m = String(e.code || e.message);
    console.log("\nGAGAL terhubung:", e.message);
    if (/ENOTFOUND|EAI_AGAIN/.test(m)) console.log("-> Alamat server tidak ditemukan. Salin ulang connection string dari tombol Connect di Supabase.");
    else if (/28P01|password authentication/i.test(e.message)) console.log("-> Password salah. Reset di Project Settings > Database. Jika password mengandung karakter khusus (@ # / ? :), ganti dengan yang hanya huruf dan angka atau ubah menjadi kode URL (mis. @ menjadi %40).");
    else if (/ECONNREFUSED|ECONNRESET|timeout/i.test(m)) console.log(isLocal ? "-> Database lokal belum menyala. Jalankan: npm run db:dev" : "-> Koneksi ditolak. Pakai 'Session pooler' (port 5432) bila jaringanmu tidak mendukung IPv6.");
    else if (/Tenant or user not found/i.test(e.message)) console.log("-> Nama pengguna/ref project salah. Salin ulang connection string tanpa mengubah bagian 'postgres.xxxx'.");
    return;
  }
  console.log("Koneksi : BERHASIL");
  const t = await pool.query("SELECT to_regclass('public.candidates') AS c, to_regclass('public.admins') AS a");
  if (!t.rows[0].c) {
    console.log("Tabel   : BELUM ADA. Jalankan: npm run db:seed");
    return;
  }
  const cnt = async (sql) => (await pool.query(sql)).rows[0].n;
  console.log("Tabel   : ada");
  console.log(`Paslon  : ${await cnt("SELECT count(*)::int AS n FROM candidates")}`);
  console.log(`Suara   : ${await cnt("SELECT count(*)::int AS n FROM votes")}`);
  const admins = (await pool.query("SELECT email FROM admins ORDER BY email")).rows.map((r) => r.email);
  console.log(`Panitia : ${admins.length ? admins.join(", ") : "(kosong) -> isi ADMIN_EMAILS lalu jalankan npm run db:seed"}`);
}

async function migrate() {
  const sql = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8");
  await pool.query(sql);
  console.log("Skema siap.");
}

async function seed() {
  await migrate();
  const emails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  for (const email of emails) {
    await pool.query(
      `INSERT INTO admins (email, name) VALUES ($1, $2)
       ON CONFLICT (email) DO NOTHING`,
      [email, email.split("@")[0]],
    );
  }
  await pool.query(
    `INSERT INTO election_settings (id, title)
     VALUES (1, 'Regenerasi Girl Up Diponegoro 2027')
     ON CONFLICT (id) DO NOTHING`,
  );
  console.log(`Pengaturan awal siap. Admin: ${emails.join(", ") || "(kosong, isi ADMIN_EMAILS)"}`);
}

async function seedDemo() {
  // Data contoh membuka voting sekarang juga; jangan dijalankan ke database online tanpa sengaja.
  if (!isLocal && !process.argv.includes("--online")) {
    console.error("DATABASE_URL menunjuk ke database ONLINE. Data contoh tidak ditambahkan.");
    console.error("Gunakan 'npm run db:seed' (tanpa data contoh), atau tambahkan --online bila memang disengaja.");
    process.exit(1);
  }
  await seed();
  const { rows } = await pool.query("SELECT count(*)::int AS n FROM candidates");
  if (rows[0].n === 0) {
    const demo = [
      [1, "Nadia Kirana", "Salsabila Putri", "Teknik Industri '24", "Hukum '24",
        "Menjadikan Girl Up Diponegoro ruang aman bagi setiap perempuan untuk bersuara dan bertumbuh.",
        "Membangun kanal aduan dan pendampingan yang aman.\nMenghadirkan layanan konseling sebaya.\nMemperkuat kolaborasi dengan layanan kampus.",
        "Safe Space Circle bulanan\nKelas kesehatan mental"],
      [2, "Raisa Anindya", "Dinda Maharani", "Psikologi '24", "Kesmas '24",
        "Menjadikan Girl Up Diponegoro rumah yang aman dan inklusif bagi setiap perempuan untuk tumbuh, memimpin, dan berdampak.",
        "Memperluas kelas kepemimpinan perempuan lintas fakultas.\nMembangun kanal aduan dan pendampingan yang aman.\nKolaborasi advokasi dengan komunitas di Semarang.",
        "GUD Leadership Academy\nAdvokasi bersama komunitas"],
      [3, "Alya Ramadhani", "Tiara Kusuma", "Ilmu Komunikasi '24", "FEB '24",
        "Menjadikan Girl Up Diponegoro wadah kreatif yang menyuarakan kesetaraan lewat karya.",
        "Mengembangkan kampanye digital yang konsisten.\nMembuka ruang karya anggota.\nKolaborasi dengan media dan kreator.",
        "Her Story Content Lab\nPekan karya anggota"],
    ];
    for (const d of demo) {
      await pool.query(
        `INSERT INTO candidates (number, president_name, vice_name, president_info, vice_info, vision, mission, programs)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        d,
      );
    }
    console.log("3 paslon contoh ditambahkan (hapus sebelum hari-H).");
  }
  // Jadwal contoh: dibuka sekarang sampai 8 jam lagi, agar mudah dicoba.
  await pool.query(
    `UPDATE election_settings
        SET opens_at = now() - interval '5 minutes',
            closes_at = now() + interval '8 hours',
            status = 'upcoming', eligible_total = 312
      WHERE id = 1 AND opens_at IS NULL`,
  );
}

// Hanya untuk pengembangan: kosongkan suara, kehadiran, dan log lalu buka kembali jadwal contoh.
async function resetDemo() {
  if (!process.argv.includes("--yes")) {
    console.error("Ini MENGHAPUS semua suara, kehadiran, dan audit log. Jalankan ulang dengan --yes.");
    process.exit(1);
  }
  // Hanya database di komputer ini yang boleh dikosongkan. Semua database online dianggap produksi.
  if (!isLocal) {
    console.error("DATABASE_URL menunjuk ke database ONLINE. Reset dibatalkan demi keamanan data suara.");
    process.exit(1);
  }
  await pool.query("TRUNCATE votes, check_ins, device_guards, audit_logs");
  await pool.query(
    `UPDATE election_settings
        SET opens_at = now() - interval '5 minutes', closes_at = now() + interval '8 hours',
            status = 'upcoming', attendance_final = NULL, reconciliation_note = NULL, reconciled_at = NULL,
            updated_at = now()
      WHERE id = 1`,
  );
  console.log("Data uji dikosongkan; jadwal dibuka lagi (sekarang sampai 8 jam).");
}

try {
  if (cmd === "check") await check();
  else if (cmd === "copy-local") await copyLocal();
  else if (cmd === "migrate") await migrate();
  else if (cmd === "seed") await seed();
  else if (cmd === "seed-demo") await seedDemo();
  else if (cmd === "reset-demo") await resetDemo();
  else console.error("Perintah: migrate | seed | seed-demo | reset-demo --yes");
} finally {
  await pool.end();
}
