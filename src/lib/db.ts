import "server-only";
import pg from "pg";

const globalForPg = globalThis as unknown as { __gudPool?: pg.Pool };

const url = process.env.DATABASE_URL ?? "";
const isLocal = /@(127\.0\.0\.1|localhost)[:/]/.test(url);

export const pool =
  globalForPg.__gudPool ??
  new pg.Pool({
    // Database di luar komputer ini wajib memakai koneksi terenkripsi.
    connectionString: isLocal ? url : url.replace(/([?&])sslmode=[^&]*&?/, "$1").replace(/[?&]$/, ""),
    // Bila DATABASE_CA (sertifikat CA dalam format PEM) diisi, identitas server diverifikasi penuh.
    ssl: isLocal ? undefined : process.env.DATABASE_CA ? { ca: process.env.DATABASE_CA, rejectUnauthorized: true } : { rejectUnauthorized: false },
    max: Number(process.env.DB_POOL_MAX ?? 5),
  });

// Tanpa handler ini, koneksi idle yang terputus bisa menjatuhkan seluruh proses Node.
if (!globalForPg.__gudPool) {
  pool.on("error", (err) => console.error("Koneksi database idle terputus:", err.message));
}

if (process.env.NODE_ENV !== "production") globalForPg.__gudPool = pool;

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const res = await pool.query<T>(text, params);
  return res.rows;
}

export async function queryOne<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}
