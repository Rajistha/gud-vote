import Image from "next/image";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSettings } from "@/lib/election";
import { fmtDate, fmtTime } from "@/lib/format";
import { DONE_COOKIE } from "@/lib/voter";
import { AutoReturn } from "@/components/voter/Clock";
import { resetBooth } from "../actions";

export const dynamic = "force-dynamic";

const TICKER = Array.from({ length: 6 }, () => "Rooted In Care, Equality Everywhere ✱").join(" ");

/** Konfeti dekoratif: posisi tetap agar hasil render server dan klien sama. */
const COLORS = ["#ffd84a", "#00a0a8", "#ff6fae", "#fff6ef", "#f58a5c"];
const CONFETTI = Array.from({ length: 16 }, (_, i) => ({
  k: i % 3, x: (i * 37 + 8) % 96, d: ((i * 7) % 9) / 3, s: 5 + ((i * 5) % 6), c: COLORS[i % COLORS.length],
}));

export default async function Selesai() {
  // Layar ini hanya untuk yang baru saja memilih.
  if (!(await cookies()).get(DONE_COOKIE)) redirect("/");
  const s = await getSettings();
  const stampDate = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Jakarta" })
    .format(new Date()).replaceAll("/", "·");

  return (
    <div className="app">
    <div className="okscr">
      <div className="ok-confetti" aria-hidden="true">
        {CONFETTI.map((c, i) => (
          <i key={i} className={`cf cf-${c.k}`} style={{ "--x": `${c.x}%`, "--d": `${c.d}s`, "--s": `${c.s}s`, "--c": c.c } as React.CSSProperties} />
        ))}
      </div>
      <div className="ok-body">
        <div className="ok-head">
          <div className="ok-logo"><Image src="/logo-gud.png" alt="Logo Girl Up Diponegoro" width={52} height={62} priority /></div>
          <span className="chip ok-chip">Thank you GUDies!</span>
          <h1 className="d">Suara <span className="mk">Tersimpan</span></h1>
          <div className="stamp" aria-hidden="true"><b>SUDAH<br />MEMILIH</b><small>{stampDate} · GUD</small></div>
        </div>
        <div className="ok-notes">
          <div className="note n1"><b>Pilihan Anda rahasia</b>Suara Anda tidak terhubung dengan identitas Anda.</div>
          <div className="note n2">
            <b>Terima kasih atas partisipasi Anda</b>
            Layar akan kembali ke beranda dalam 10 detik.
            {s.closes_at && <> Hasil diumumkan setelah {fmtDate(s.closes_at)}, {fmtTime(s.closes_at)}.</>}
            <AutoReturn seconds={10} onDone={resetBooth} />
          </div>
        </div>
      </div>
      <div className="ticker" aria-hidden="true"><div>{TICKER}</div></div>
    </div>
    </div>
  );
}
