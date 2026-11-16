import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSettings } from "@/lib/election";
import { fmtDate, fmtTime } from "@/lib/format";
import { DONE_COOKIE } from "@/lib/voter";
import { AutoReturn } from "@/components/voter/Clock";
import { resetBooth } from "../actions";

export const dynamic = "force-dynamic";

export default async function Selesai() {
  // Layar ini hanya untuk yang baru saja memilih.
  if (!(await cookies()).get(DONE_COOKIE)) redirect("/");
  const s = await getSettings();
  const stampDate = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Jakarta" })
    .format(new Date()).replaceAll("/", "·");

  return (
    <div className="app">
    <div className="okscr">
      <h1 className="d lc">suara<br />anda<br />tersimpan.</h1>
      <div className="stamp" aria-hidden="true"><b>SUDAH<br />MEMILIH</b><small>{stampDate} · GUD</small></div>
      <div className="note"><b>Pilihan Anda rahasia.</b>Suara Anda tidak terhubung dengan identitas Anda.</div>
      <div className="note">
        <b>Terima kasih atas partisipasi Anda.</b>
        Layar akan kembali ke beranda dalam 10 detik.
        {s.closes_at && <> Hasil diumumkan setelah {fmtDate(s.closes_at)}, {fmtTime(s.closes_at)}.</>}
        <AutoReturn seconds={10} onDone={resetBooth} />
      </div>
    </div>
    </div>
  );
}
