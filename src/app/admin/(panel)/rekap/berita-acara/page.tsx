import { redirect } from "next/navigation";
import { getSettings, getStats } from "@/lib/election";
import { fmtDateTime, pct } from "@/lib/format";
import { audit, requireAdmin } from "@/lib/session";
import { PrintButton } from "@/components/admin/PrintButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Berita acara · GUD Vote" };

export default async function BeritaAcara() {
  const admin = await requireAdmin();
  const s = await getSettings();
  if (!s.reconciled_at) redirect("/admin/rekap");
  const st = await getStats();
  await audit(admin.id, "EXPORT", { type: "berita-acara" });


  return (
    <article className="panel" style={{ maxWidth: 800, boxShadow: "none" }}>
      <div className="no-print" style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}><PrintButton /></div>
      <h1 className="d" style={{ fontSize: 30, textAlign: "center" }}>Berita Acara</h1>
      <p style={{ textAlign: "center", margin: "6px 0 22px" }}><b>{s.title}</b></p>
      <p>Pemungutan suara dilaksanakan pada {s.opens_at ? fmtDateTime(s.opens_at) : "–"} sampai {s.closes_at ? fmtDateTime(s.closes_at) : "–"}. Hasil dikunci pada {fmtDateTime(s.reconciled_at)}.</p>

      <h2 style={{ fontSize: 17, margin: "22px 0 8px" }}>Perolehan suara</h2>
      <table className="tbl">
        <thead><tr><th>No.</th><th>Pasangan Calon</th><th style={{ textAlign: "right" }}>Suara</th><th style={{ textAlign: "right" }}>%</th></tr></thead>
        <tbody>
          {st.perCandidate.map((c) => (
            <tr key={c.id}><td>{c.number}</td><td>{c.president_name} &amp; {c.vice_name}</td><td style={{ textAlign: "right" }}>{c.total}</td><td style={{ textAlign: "right" }}>{pct(c.total, st.votes)}</td></tr>
          ))}
          {st.blank > 0 && <tr><td>–</td><td>Kotak Kosong</td><td style={{ textAlign: "right" }}>{st.blank}</td><td style={{ textAlign: "right" }}>{pct(st.blank, st.votes)}</td></tr>}
          <tr><td /><td><b>Total suara masuk</b></td><td style={{ textAlign: "right" }}><b>{st.votes}</b></td><td /></tr>
        </tbody>
      </table>

      <h2 style={{ fontSize: 17, margin: "22px 0 8px" }}>Ringkasan</h2>
      <table className="tbl"><tbody>
        <tr><td>Jumlah anggota hak pilih</td><td style={{ textAlign: "right" }}>{s.eligible_total ?? "–"}</td></tr>
        <tr><td>Total suara masuk</td><td style={{ textAlign: "right" }}>{st.votes}</td></tr>
        <tr><td>Partisipasi</td><td style={{ textAlign: "right" }}>{pct(st.votes, s.eligible_total)}</td></tr>
      </tbody></table>
      {s.reconciliation_note && <p><b>Catatan:</b> {s.reconciliation_note}</p>}


      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, marginTop: 56, textAlign: "center", fontSize: 14 }}>
        <div>Ketua Panitia<div style={{ height: 70 }} /><div style={{ borderTop: "1.5px solid var(--ink)", paddingTop: 4 }}>(                              )</div></div>
        <div>Pembina<div style={{ height: 70 }} /><div style={{ borderTop: "1.5px solid var(--ink)", paddingTop: 4 }}>(                              )</div></div>
      </div>
    </article>
  );
}
