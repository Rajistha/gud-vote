import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCandidates, getSettings, phaseOf } from "@/lib/election";
import { DONE_COOKIE, deviceUsed, paslonTheme, venueOk } from "@/lib/voter";
import { BallotForm } from "@/components/voter/BallotForm";
import { ClosedScreen, CountdownScreen } from "@/components/voter/Screens";
import { VenueForm } from "@/components/voter/VenueForm";
import { IconBack, IconShield } from "@/components/icons";

export const dynamic = "force-dynamic";
export const metadata = { title: "E-Vote · GUD Vote" };

export default async function EVote() {
  const s = await getSettings();
  const phase = phaseOf(s);

  // Belum waktunya: hitung mundur. Sudah lewat: layar ditutup.
  if (phase === "upcoming") return <CountdownScreen s={s} />;
  if (phase === "closed") return <ClosedScreen s={s} />;

  if (!(await venueOk(s))) {
    return (
      <div className="app">
        <div className="page">
          <div><Link href="/" className="backlink"><IconBack size={18} />Kembali</Link></div>
          <div><Image src="/logo-gud.png" alt="Logo Girl Up Diponegoro" width={84} height={100} /></div>
          <h1 className="d">Kode<br /><span className="mk">Lokasi</span></h1>
          <p>Masukkan kode yang ditampilkan panitia di lokasi pemilihan.</p>
          <div style={{ marginTop: 24 }}><VenueForm /></div>
          <div className="priv"><IconShield /><span>Pilihan Anda bersifat rahasia dan tidak terhubung dengan identitas Anda.</span></div>
        </div>
      </div>
    );
  }

  if (await deviceUsed(s)) {
    return (
      <div className="app">
        <div className="page">
          <div><Link href="/" className="backlink"><IconBack size={18} />Kembali</Link></div>
          <div><Image src="/logo-gud.png" alt="Logo Girl Up Diponegoro" width={84} height={100} /></div>
          <h1 className="d">Perangkat Ini<br /><span className="mk">Sudah Dipakai</span></h1>
          <p>Satu perangkat hanya dapat digunakan untuk satu suara. Jika Anda belum memilih, silakan hubungi panitia.</p>
        </div>
      </div>
    );
  }

  if ((await cookies()).get(DONE_COOKIE)) redirect("/selesai");

  const candidates = await getCandidates();
  return (
    <div className="app">
      <div className="bh">
        <Link href="/" className="backlink"><IconBack size={18} />Kembali</Link>
        <h1 className="d">Pilih <span className="mk">Satu</span></h1>
        <p>Pilih satu Pasangan Calon, lalu konfirmasi. Suara hanya dapat dikirim satu kali.</p>
        <p style={{ marginTop: 6 }}><Link href="/#paslon" style={{ color: "var(--magenta)", fontWeight: 700 }}>Kenali Pasangan Calon</Link></p>
      </div>
      {candidates.length === 0 ? (
        <p className="pad muted">Pasangan Calon belum tersedia. Silakan hubungi panitia.</p>
      ) : (
        <BallotForm
          allowBlank={s.allow_blank}
          candidates={candidates.map((c) => ({
            id: c.id,
            number: c.number,
            name: `${c.president_name} & ${c.vice_name}`,
            theme: paslonTheme(c.number),
          }))}
        />
      )}
    </div>
  );
}
