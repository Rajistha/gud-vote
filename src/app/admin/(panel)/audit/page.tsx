import { query } from "@/lib/db";
import { fmtShort } from "@/lib/format";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

const LABEL: Record<string, string> = {
  LOGIN: "Masuk ke panel",
  VIEW_LIVE_COUNT: "Membuka live count",
  CREATE_CANDIDATE: "Menambah paslon",
  UPDATE_CANDIDATE: "Mengubah paslon",
  DELETE_CANDIDATE: "Menghapus paslon",
  UPDATE_SETTINGS: "Mengubah pengaturan",
  EXTEND_TIME: "Memperpanjang waktu",
  REOPEN: "Membuka kembali voting",
  EMERGENCY_CLOSE: "Tutup darurat",
  RECONCILE: "Mengunci hasil",
  EXPORT: "Ekspor laporan",
  ADD_ADMIN: "Menambah panitia",
  REMOVE_ADMIN: "Menghapus panitia",
};

/** Aksi yang perlu perhatian lebih. */
const WARN = new Set(["VIEW_LIVE_COUNT", "EMERGENCY_CLOSE", "EXTEND_TIME", "REOPEN", "RECONCILE"]);

function describe(action: string, d: Record<string, unknown> | null): string {
  const g = (k: string) => d?.[k];
  switch (action) {
    case "CREATE_CANDIDATE":
    case "UPDATE_CANDIDATE":
    case "DELETE_CANDIDATE":
      return `Paslon ${g("number") ?? ""}`.trim();
    case "EXTEND_TIME":
      return `Ditambah ${g("minutes")} menit`;
    case "REOPEN":
      return `Dibuka selama ${g("minutes")} menit`;
    case "RECONCILE":
      return [`${g("votes")} suara`, g("note") ? String(g("note")) : ""].filter(Boolean).join(" · ");
    case "EXPORT":
      return g("type") === "xlsx" ? "Excel" : "Berita acara";
    case "ADD_ADMIN":
    case "REMOVE_ADMIN":
      return String(g("email") ?? "");
    case "VIEW_LIVE_COUNT":
      return "Dashboard";
    default:
      return "";
  }
}

export default async function Audit() {
  await requireAdmin();
  const rows = await query<{ created_at: Date; admin: string | null; action: string; detail: Record<string, unknown> | null }>(
    `SELECT l.created_at, COALESCE(a.name, a.email) AS admin, l.action, l.detail
       FROM audit_logs l LEFT JOIN admins a ON a.id = l.admin_id
      ORDER BY l.created_at DESC LIMIT 200`,
  );
  return (
    <>
      <div className="main-h"><h1 className="d">Audit <span className="mk">Log</span></h1><div className="sp" /><span className="chip chip-soon">Hanya Dibaca · 200 Terakhir</span></div>
      <div className="panel" style={{ padding: 8, overflowX: "auto" }}>
        <table className="tbl stack">
          <thead><tr><th>Waktu</th><th>Panitia</th><th>Aktivitas</th><th>Keterangan</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="mono">{fmtShort(r.created_at)}</td>
                <td>{r.admin ?? "–"}</td>
                <td><span className={`pill ${WARN.has(r.action) ? "warn" : "no"}`}>{LABEL[r.action] ?? r.action}</span></td>
                <td>{describe(r.action, r.detail) || "–"}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={4} className="muted">Belum ada aktivitas.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
