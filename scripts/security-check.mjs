// Uji keamanan hanya-baca terhadap project Supabase: meniru penyerang yang memegang kunci publik (anon).
import pg from "pg";
const url = process.env.SUPABASE_URL, anon = process.env.SUPABASE_ANON_KEY;
const out = (k, v) => console.log(k.padEnd(52), v);

// 1) Apakah tabel dapat dibaca lewat API publik?
for (const t of ["votes", "admins", "candidates", "election_settings", "audit_logs", "device_guards", "check_ins"]) {
  const r = await fetch(`${url}/rest/v1/${t}?select=*&limit=3`, { headers: { apikey: anon, Authorization: `Bearer ${anon}` } });
  const body = await r.text();
  const leaked = r.ok && body.trim() !== "[]";
  out(`API publik GET /${t}`, `${r.status} ${leaked ? "!!! DATA TERBACA: " + body.slice(0, 80) : "aman (tidak ada data)"}`);
}
// 2) Apakah anon bisa menulis?
const w = await fetch(`${url}/rest/v1/votes`, { method: "POST", headers: { apikey: anon, Authorization: `Bearer ${anon}`, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify({ is_blank: true }) });
out("API publik POST /votes (sisip suara langsung)", `${w.status} ${w.ok ? "!!! BERHASIL MENYISIPKAN" : "ditolak"}`);
// 3) Apakah fungsi cast_vote bisa dipanggil lewat RPC publik?
const rpc = await fetch(`${url}/rest/v1/rpc/cast_vote`, { method: "POST", headers: { apikey: anon, Authorization: `Bearer ${anon}`, "Content-Type": "application/json" }, body: JSON.stringify({ p_candidate: "00000000-0000-0000-0000-000000000000", p_blank: false }) });
out("API publik RPC cast_vote", `${rpc.status} ${(await rpc.text()).slice(0, 110)}`);

// 4) Keadaan sebenarnya di database (RLS, hak fungsi)
const ssl = { rejectUnauthorized: false };
const c = new pg.Client({ connectionString: process.env.DATABASE_URL.replace(/([?&])sslmode=[^&]*&?/, "$1"), ssl });
await c.connect();
const rls = await c.query("select relname, relrowsecurity from pg_class where relnamespace='public'::regnamespace and relkind='r' order by 1");
out("Tabel & RLS aktif", rls.rows.map((r) => `${r.relname}:${r.relrowsecurity ? "ON" : "OFF!!!"}`).join("  "));
const fn = await c.query("select has_function_privilege('anon','public.cast_vote(uuid,boolean,text)','EXECUTE') as anon, has_function_privilege('authenticated','public.cast_vote(uuid,boolean,text)','EXECUTE') as auth");
out("anon/authenticated boleh EXECUTE cast_vote?", JSON.stringify(fn.rows[0]));
const pol = await c.query("select count(*)::int n from pg_policies where schemaname='public'");
out("Jumlah policy RLS (0 = semua ditolak untuk publik)", pol.rows[0].n);
const b = await c.query("select id, public from storage.buckets");
out("Bucket penyimpanan", JSON.stringify(b.rows));
await c.end();
