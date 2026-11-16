# GUD Vote

Sistem e-voting Regenerasi Girl Up Diponegoro 2027. *Rooted In Care, Equality Everywhere.*

Stack: Next.js 16, TypeScript, Tailwind CSS 4, PostgreSQL dan Authentication (Supabase).

---

## Ringkasan

Pemilih memberikan suara **tanpa login**. Verifikasi pemilih dilakukan panitia di lokasi, lalu total suara
dicocokkan dengan jumlah pemilih yang hadir. Panitia mengelola pemilihan lewat panel admin dengan akun email dan password.

| | |
|---|---|
| **Rahasia** | Tabel suara hanya menyimpan ID paslon, tanpa identitas dan tanpa waktu. |
| **Satu peran** | Seluruh panitia memiliki akses penuh, dibatasi oleh tabel `admins` di database. |
| **Real-time** | Halaman hitung suara publik diperbarui otomatis dan siap ditampilkan di layar besar. |
| **Responsif** | Pemilih, landing page, dan panel admin nyaman dipakai dari HP sampai layar lebar. |

## Halaman

### Pemilih

| Alamat | Isi |
|---|---|
| `/` | Landing page publik: paslon beserta visi, misi, program, video, komparasi, dan cara memilih |
| `/e-vote` | Sebelum jadwal: hitung mundur. Saat voting: surat suara. Setelah tutup: layar ditutup |
| `/selesai` | Konfirmasi suara tercatat, kembali ke beranda otomatis dalam 10 detik |
| `/live` | Perolehan suara langsung untuk ditampilkan di layar. Diaktifkan panitia dari dashboard |

### Panel admin

| Menu | Fungsi |
|---|---|
| Dashboard | Ringkasan suara langsung dan pengaturan tampilan hitung suara publik |
| Paslon | Data Pasangan Calon, visi, misi, program, video, dan unggah foto |
| Jadwal | Waktu buka dan tutup, kotak kosong, kode lokasi, buka kembali, perpanjang, tutup darurat |
| Rekap | Hasil suara dan ekspor ke Excel |
| Berita acara | Pencocokan jumlah suara dengan kehadiran, lalu hasil dikunci |
| Audit | Riwayat seluruh tindakan admin |

## Mulai cepat

Prasyarat: Node.js 20 atau lebih baru.

```bash
npm install
cp .env.example .env.local        # isi SESSION_SECRET (dan Supabase bila ada)

npm run db:dev                    # terminal 1: database lokal, biarkan terbuka
npm run db:seed:demo              # terminal 2: skema, 3 paslon contoh, jadwal contoh
npm run dev                       # http://localhost:3000
```

Tanpa Supabase, panel admin di `/admin/login` bisa dimasuki lewat tombol **Masuk (dev)** selama
`DEV_ADMIN_LOGIN=1`. Fitur ini otomatis ditolak di produksi.

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm run dev` / `build` / `start` | Menjalankan, membangun, dan menyajikan aplikasi |
| `npm run db:dev` | Database lokal untuk pengembangan |
| `npm run db:check` | Memeriksa koneksi, tabel, dan daftar panitia |
| `npm run db:migrate` | Membuat atau memperbarui tabel |
| `npm run db:seed` | Migrasi dan mendaftarkan panitia dari `ADMIN_EMAILS` |
| `npm run db:seed:demo` | Seed beserta data contoh (hanya database lokal) |
| `npm run db:reset:demo` | Mengosongkan suara dan log (hanya database lokal) |
| `npm run db:copy-local` | Menyalin data paslon dari database lokal ke online |
| `npm run storage:clean` | Menampilkan foto di storage yang tidak dipakai paslon (`--delete` untuk menghapus) |
| `npm run security:check` | Simulasi penyerang read-only terhadap database online |

## Menghubungkan Supabase

Data (paslon, suara, jadwal) disimpan di **database**, sedangkan **Authentication** hanya dipakai untuk login panitia.
Selama `DATABASE_URL` masih `127.0.0.1`, data tersimpan di komputer sendiri.

**Database**

1. Di project Supabase, klik **Connect**, pilih **Transaction pooler**, lalu salin connection string-nya.
2. Lupa password? **Project Settings** > **Database** > **Reset database password**. Hindari karakter `@ # / ? :`.
3. Isi `DATABASE_URL` di `.env.local` dan ubah `DB_POOL_MAX` menjadi `5`.
4. Jalankan `npm run db:check`, lalu `npm run db:seed`, dan `npm run db:check` sekali lagi.
5. Mulai ulang `npm run dev`. Tabel kini muncul di **Table Editor**.

**Login panitia dan foto**

1. `SUPABASE_URL` dan `SUPABASE_ANON_KEY`: **Project Settings** > **API Keys**.
2. Buat akun di **Authentication** > **Users** > **Add user** (centang *Auto Confirm User*).
3. Isi `SUPABASE_SERVICE_ROLE_KEY` untuk unggah foto paslon.
4. Daftarkan email panitia di `ADMIN_EMAILS`, lalu jalankan `npm run db:seed`. Email yang tidak terdaftar di tabel `admins` tidak dapat masuk panel.
5. Nonaktifkan **Allow new users to sign up** di **Authentication** > **Sign In / Providers**.

## Foto paslon

Unggah dari **Paslon > Edit** (JPG, PNG, atau WebP, maksimal 3 MB, dikecilkan otomatis di browser).
Gunakan **PNG berlatar transparan** berisi kedua calon agar tampil besar dan menyatu dengan warna paslon
(rasio sekitar 4:5). Foto disimpan di bucket publik `candidate-photos` dan membutuhkan `SUPABASE_SERVICE_ROLE_KEY`.
Tanpa kunci itu, foto lokal disimpan di `public/uploads/` hanya saat pengembangan.

## Keamanan

- Row Level Security aktif di semua tabel dan fungsi `cast_vote` tidak bisa dipanggil lewat API publik. Hanya server yang menulis suara.
- Sesi admin berupa cookie `httpOnly` bertanda tangan, berlaku 12 jam. Akses ditentukan tabel `admins`, bukan sekadar akun Supabase.
- Pembatasan percobaan, validasi input, header keamanan, dan CSP (produksi).
- Halaman `/live` dan `/api/live` hanya menampilkan angka agregat.
- Di produksi isi `DATABASE_CA` agar identitas server database diverifikasi penuh, dan jangan aktifkan `DEV_ADMIN_LOGIN`.

## Alur hari pemilihan

1. Panitia mengatur jadwal dan kotak kosong di **Jadwal**, lalu mengaktifkan hitung suara publik bila perlu.
2. Pemilih diverifikasi di lokasi, lalu memilih di `/e-vote`.
3. Voting ditutup otomatis sesuai jadwal. Selama hasil belum dikunci, voting bisa dibuka kembali atau diperpanjang.
4. Di **Berita acara**, jumlah suara dicocokkan dengan kehadiran, lalu hasil dikunci.
5. Hasil diunduh dari **Rekap** dalam format Excel.

## Variabel lingkungan

Lihat [.env.example](.env.example) untuk daftar lengkap beserta penjelasannya.

## Deploy ke Vercel

1. Impor repositori di Vercel. Wilayah fungsi sudah diatur ke Singapura (`vercel.json`) agar dekat dengan Supabase.
2. Isi Environment Variables: `DATABASE_URL` (Transaction pooler, port 6543), `SESSION_SECRET`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_HOST`, dan `DB_POOL_MAX=2`. Jangan isi `DEV_ADMIN_LOGIN`.
3. Sebelum hari-H: pastikan project Supabase aktif (paket Free menjeda project yang tidak dipakai seminggu), jalankan `npm run db:check`, dan coba satu kali alur lengkap di domain produksi.
4. Tampilkan `/live` di satu layar saja (proyektor), bukan di banyak ponsel, untuk menghemat kuota.
