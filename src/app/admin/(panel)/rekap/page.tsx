import Link from "next/link";
import { getSettings, getStats, phaseOf } from "@/lib/election";
import { fmtDateTime, pct } from "@/lib/format";
import { requireAdmin } from "@/lib/session";
import { paslonTheme } from "@/lib/voter";
import { ReconcileForm } from "@/components/admin/forms";
import { IconDownload } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function Rekap() {
  await requireAdmin();
  const [s, st] = await Promise.all([getSettings(), getStats()]);
  const phase = phaseOf(s);

  if (phase !== "closed") {
    return (
      <>
        <div className="main-h"><h1 className="d lc">rekap <span className="mk">hasil</span></h1></div>
        <div className="panel"><p style={{ margin: 0 }}>Rekap hanya tersedia setelah voting ditutup. Saat ini status: <b>{phase === "open" ? "berlangsung" : "belum dibuka"}</b>.</p></div>
      </>
    );
  }

  const locked = !!s.reconciled_at;
  const top = [...st.perCandidate].sort((a, b) => b.total - a.total);
  const tie = top.length > 1 && top[0].total === top[1].total;

  return (
    <>
      <div className="main-h">
        <h1 className="d lc">rekap <span className="mk">hasil</span></h1>
        <div className="sp" />
        <span className="chip chip-closed"><span className="dot" />ditutup{s.closes_at ? ` · ${fmtDateTime(s.closes_at)}` : ""}</span>
      </div>

      {top.length > 0 && top[0].total > 0 && (
        <div className={`win ${paslonTheme(top[0].number)}`}>
          <span className="num" style={{ width: 92, height: 120, fontSize: 64, borderRadius: 12, flex: "none" }}>{top[0].number}</span>
          <div>
            <small>{tie ? "Suara terbanyak sama, perlu keputusan panitia" : "Perolehan suara terbanyak"}</small>
            <h2>{top[0].president_name} &amp; {top[0].vice_name}</h2>
            <span>{top[0].total} suara · {pct(top[0].total, st.votes)} dari {st.votes} suara masuk{tie ? ` · seri dengan paslon ${top[1].number}` : ""}</span>
          </div>
        </div>
      )}

      <div className="g2" style={{ gridTemplateColumns: "1.4fr 1fr", alignItems: "start" }}>
        <div className="panel" style={{ padding: 8 }}>
          <table className="tbl">
            <thead><tr><th>No.</th><th>Pasangan calon</th><th style={{ textAlign: "right" }}>Suara</th><th style={{ textAlign: "right" }}>%</th></tr></thead>
            <tbody>
              {st.perCandidate.map((c) => (
                <tr key={c.id}>
                  <td><span className={`num ${paslonTheme(c.number)}`} style={{ width: 28, height: 28, fontSize: 14, borderRadius: 8 }}>{c.number}</span></td>
                  <td>{c.president_name} &amp; {c.vice_name}</td>
                  <td style={{ textAlign: "right" }}><b>{c.total}</b></td>
                  <td style={{ textAlign: "right" }}>{pct(c.total, st.votes)}</td>
                </tr>
              ))}
              {st.blank > 0 && (
                <tr><td><span className="num pc0" style={{ width: 28, height: 28, fontSize: 14, borderRadius: 8 }}>–</span></td><td>Kotak kosong</td><td style={{ textAlign: "right" }}><b>{st.blank}</b></td><td style={{ textAlign: "right" }}>{pct(st.blank, st.votes)}</td></tr>
              )}
              <tr><td /><td><b>Total suara masuk</b></td><td style={{ textAlign: "right" }}><b>{st.votes}</b></td><td /></tr>
            </tbody>
          </table>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="panel">
            <div className="panel-h"><b>Penetapan hasil</b>{locked && <span className="chip chip-live">terkunci</span>}</div>
            <div className="recon" style={{ gridTemplateColumns: "1fr" }}>
              <div><small>total suara masuk</small><b>{st.votes}</b></div>
            </div>
            {locked ? (
              <p className="muted" style={{ fontSize: 13, margin: 0 }}>Dikunci {fmtDateTime(s.reconciled_at!)}.{s.reconciliation_note ? ` Catatan: ${s.reconciliation_note}` : ""}</p>
            ) : (
              <ReconcileForm />
            )}
          </div>

          <div className="panel">
            <div className="panel-h"><b>Ekspor laporan</b></div>
            {!locked && <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>Ekspor dibuka setelah hasil dikunci.</p>}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {locked ? (
                <>
                  <Link href="/admin/rekap/berita-acara" className="btn btn-g btn-sm"><IconDownload />Berita acara (cetak / PDF)</Link>
                  <a href="/api/admin/rekap.xlsx" className="btn btn-g btn-sm"><IconDownload />Rekap data (Excel)</a>
                </>
              ) : (
                <>
                  <span className="btn btn-sm btn-dis">Berita acara (cetak / PDF)</span>
                  <span className="btn btn-sm btn-dis">Rekap data (Excel)</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
