import Image from "next/image";
import Link from "next/link";

export const metadata = { title: "Halaman tidak ditemukan · GUD Vote" };

export default function NotFound() {
  return (
    <main className="app">
      <div className="page">
        <div><Image src="/logo-gud.png" alt="Logo Girl Up Diponegoro" width={84} height={100} /></div>
        <h1 className="d lc">halaman<br /><span className="mk">tidak ditemukan.</span></h1>
        <p>Alamat yang Anda tuju tidak tersedia atau sudah dipindahkan.</p>
        <div style={{ marginTop: 24 }}><Link href="/" className="btn btn-p">Kembali ke beranda</Link></div>
      </div>
    </main>
  );
}
