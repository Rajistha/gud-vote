import Link from "next/link";
import { redirect } from "next/navigation";
import { Noto_Sans_JP } from "next/font/google";
import { IconBack, IconDownload } from "@/components/icons";
import { buildBeritaAcara } from "@/lib/berita-acara";
import { getSettings, getStats } from "@/lib/election";
import { audit, requireAdmin } from "@/lib/session";
import { PrintButton } from "@/components/admin/PrintButton";
import { FitSheet } from "@/components/admin/FitSheet";

const noto = Noto_Sans_JP({ subsets: ["latin"], weight: ["400", "500", "700"], display: "swap" });

export const dynamic = "force-dynamic";
export const metadata = { title: "Berita acara · GUD Vote" };

/** Berita acara resmi: lembar A4 dengan kop surat Girl Up Diponegoro. */
export default async function BeritaAcara() {
  const admin = await requireAdmin();
  const s = await getSettings();
  if (!s.reconciled_at) redirect("/admin/rekap");
  const st = await getStats();
  await audit(admin.id, "EXPORT", { type: "berita-acara" });
  const ba = buildBeritaAcara(s, st);

  return (
    <>
      <div className="no-print ba-toolbar">
        <Link href="/admin/rekap" className="btn btn-g btn-sm"><IconBack size={16} />Kembali ke Rekap Hasil</Link>
        <div className="ba-actions">
          <a href="/api/admin/berita-acara.docx" className="btn btn-g btn-sm"><IconDownload />Unduh Word (.docx)</a>
          <PrintButton />
        </div>
      </div>
      <FitSheet>
        <div className={`ba-sheet ${noto.className}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="ba-kop" src="/kop-surat.jpeg" alt="" />
          <table className="ba-flow">
            <thead><tr><td><div className="ba-sp-top" /></td></tr></thead>
            <tfoot><tr><td><div className="ba-sp-bot" /></td></tr></tfoot>
            <tbody>
              <tr>
                <td>
                  <div className="ba-body">
                    <div className="ba-title">
                      <h1>{`Berita Acara ${ba.heading[0]}`}</h1>
                      <h2>{ba.heading[1]}</h2>
                    </div>

                    <p>{ba.opening}</p>

                    <h3>A.   Data Pemilih</h3>
                    <table className="ba-tbl ba-kv">
                      <tbody>
                        {ba.voters.map(([k, v]) => <tr key={k}><td>{k}</td><td>{v}</td></tr>)}
                      </tbody>
                    </table>

                    <h3>B.   Perolehan Suara</h3>
                    <table className="ba-tbl">
                      <thead>
                        <tr><th style={{ width: "10%" }}>No.</th><th>Pasangan Calon</th><th style={{ width: "16%" }}>Suara</th><th style={{ width: "16%" }}>Persentase</th></tr>
                      </thead>
                      <tbody>
                        {ba.rows.map((r, i) => (
                          <tr key={i}>
                            <td className="c">{r.no}</td>
                            <td>{r.name}</td>
                            <td className="r">{r.votes}</td>
                            <td className="r">{r.pct}</td>
                          </tr>
                        ))}
                        <tr className="total"><td colSpan={2}>Jumlah suara masuk</td><td className="r">{ba.total.votes}</td><td className="r">{ba.total.pct}</td></tr>
                      </tbody>
                    </table>

                    {ba.leaderText && <p>{ba.leaderText}</p>}
                    {ba.note && <p><b>Catatan:</b> {ba.note}</p>}

                    <p>{ba.closing}</p>

                    <div className="ba-sign">
                      <p>{ba.signDate}</p>
                      <div className="ba-sign-row">
                        <div>
                          <span>{ba.presidentTitle}</span>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img className="ba-ttd" src="/ttd-presiden.png" alt="Tanda tangan dan cap Presiden Girl Up Diponegoro" />
                          <b><u>{ba.president}</u></b>
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </FitSheet>
    </>
  );
}
