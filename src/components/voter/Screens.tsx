import Image from "next/image";
import Link from "next/link";
import { getStats, type Settings } from "@/lib/election";
import { fmtDate, fmtTime } from "@/lib/format";
import { IconBack } from "@/components/icons";
import { CountdownCard } from "./Clock";

const TICKER =
  "Rooted In Care, Equality Everywhere ✱ Rooted In Care, Equality Everywhere ✱ Rooted In Care, Equality Everywhere ✱ Rooted In Care, Equality Everywhere ✱ Rooted In Care, Equality Everywhere ✱ Rooted In Care, Equality Everywhere ✱";

/** Halaman E-Vote sebelum waktunya: hitung mundur. Berpindah ke surat suara otomatis saat nol. */
export function CountdownScreen({ s }: { s: Settings }) {
  return (
    <div className="app">
      <div className="cd">
        <div className="cd-top">
          <Link href="/" className="backlink"><IconBack size={18} />Kembali</Link>
        </div>
        <div className="cd-grid">
          <div className="cd-left">
            <Image className="cd-logo" src="/logo-gud.png" alt="Logo Girl Up Diponegoro" width={150} height={180} priority />
            <h1 className="d">E-Vote<br /><span className="mk">Belum Dibuka</span></h1>
          </div>
          <div className="cd-right">
            {s.opens_at ? (
              <>
                <p className="cd-lead">Dibuka dalam</p>
                <CountdownCard target={s.opens_at.toISOString()} serverNow={new Date().toISOString()} />
                <div className="cd-when">{fmtDate(s.opens_at)} <span>· {fmtTime(s.opens_at)}</span></div>
              </>
            ) : (
              <p className="cd-when muted">Jadwal pemilihan akan diumumkan panitia.</p>
            )}
            <div className="cd-actions">
              <Link href="/#paslon" className="btn btn-g">Kenali Pasangan Calon</Link>
            </div>
            <p className="cd-when muted" style={{ marginTop: 14, fontSize: 13 }}>Verifikasi pemilih dilakukan panitia di meja registrasi.</p>
          </div>
        </div>
        <div className="ticker" aria-hidden="true"><div>{TICKER}</div></div>
      </div>
    </div>
  );
}

/** Setelah voting ditutup. */
export async function ClosedScreen({ s }: { s: Settings }) {
  let participation: { votes: number } | null = null;
  if (s.reconciled_at) {
    const st = await getStats();
    participation = { votes: st.votes };
  }
  return (
    <div className="app">
      <div className="closedscr">
        <div className="split">
          <div className="split-l">
            <Image src="/logo-gud.png" alt="Logo Girl Up Diponegoro" width={84} height={100} />
            <h1 className="d">Voting<br /><span className="mk">Ditutup</span></h1>
            <p className="muted">
              {s.closes_at ? `Pemungutan suara berakhir ${fmtDate(s.closes_at)} pukul ${fmtTime(s.closes_at)}. ` : ""}
              Terima kasih atas partisipasi Anda.
            </p>
            <div style={{ marginTop: 18 }}><Link href="/" className="backlink"><IconBack size={18} />Kembali</Link></div>
          </div>
          <div className="split-r">
            {participation ? (
              <div className="statbox">
                <small className="mono">suara masuk</small>
                <b>{participation.votes}</b>
                <div style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 8 }}>
                  Pengumuman resmi akan disampaikan panitia.
                </div>
              </div>
            ) : (
              <div className="statbox"><div style={{ fontSize: 14 }}>Hasil akan diumumkan oleh panitia.</div></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
