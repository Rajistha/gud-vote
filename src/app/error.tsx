"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";

/** Batas galat untuk seluruh situs: pengunjung melihat pesan yang jelas, bukan layar galat bawaan. */
export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="app">
      <div className="page">
        <div><Image src="/logo-gud.png" alt="Logo Girl Up Diponegoro" width={84} height={100} /></div>
        <h1 className="d">Terjadi<br /><span className="mk">Kendala</span></h1>
        <p>Halaman tidak dapat dimuat. Silakan coba lagi. Jika masih berlanjut, hubungi panitia.</p>
        <div style={{ marginTop: 24, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" className="btn btn-p" onClick={() => retry()}>Coba lagi</button>
          <Link href="/" className="btn btn-g">Ke beranda</Link>
        </div>
      </div>
    </main>
  );
}
