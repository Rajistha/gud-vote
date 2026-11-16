import type { Metadata } from "next";
import Image from "next/image";
import QRCode from "qrcode";
import { FullscreenToggle } from "@/components/live/FullscreenToggle";
import { getSettings } from "@/lib/election";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "QR Code · E-Vote Regenerasi Girl Up Diponegoro 2027",
  robots: { index: false, follow: false },
};

const SITE_HOST = process.env.NEXT_PUBLIC_SITE_HOST ?? "gudvote.site";

/** Halaman QR Code untuk ditampilkan di layar lokasi. Memuat satu layar penuh tanpa scroll. */
export default async function Qr() {
  const url = `https://${SITE_HOST}/e-vote`;
  const [svg, s] = await Promise.all([
    QRCode.toString(url, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#1b0f1e", light: "#ffffff" } }),
    getSettings(),
  ]);

  return (
    <div className="qr">
      <header className="lv-top">
        <div className="lv-brand">
          <Image src="/logo-gud.png" alt="Logo Girl Up Diponegoro" width={44} height={53} priority />
          <div><b>{s.title}</b><small>Rooted In Care, Equality Everywhere.</small></div>
        </div>
        <FullscreenToggle />
      </header>

      <main className="qr-main">
        <div className="qr-text">
          <span className="chip">E-Vote</span>
          <h1 className="d">Pindai Untuk <span className="mk">Memilih</span></h1>
          <p>Arahkan kamera ponsel ke QR Code, lalu ikuti petunjuk di layar.</p>
          <p className="qr-url">{SITE_HOST}/e-vote</p>
        </div>
        <div className="qr-card" role="img" aria-label={`QR Code menuju ${SITE_HOST}/e-vote`} dangerouslySetInnerHTML={{ __html: svg }} />
      </main>
    </div>
  );
}
