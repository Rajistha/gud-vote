"use client";

import Link from "next/link";
import { useActionState, useTransition } from "react";
import {
  addAdmin, emergencyClose, extendTime, reconcile, reopenVoting, saveCandidate, saveSettings, type Result,
} from "@/app/admin/(panel)/actions";
import { ConfirmSubmit } from "@/components/ui/ConfirmDialog";
import { DateTimePicker } from "@/components/ui/DateTimePicker";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { Select } from "@/components/ui/Select";
import { useNotify, useResultToast } from "@/components/ui/Toast";
import { InfoTip } from "@/components/ui/Tooltip";

/** Galat tampil di dekat tombol (tetap terlihat); keberhasilan tampil sebagai toast. */
function ErrorLine({ r }: { r: Result }) {
  return r?.error ? <div className="err-msg" role="alert">{r.error}</div> : null;
}

const FIELDSET = { border: 0, padding: 0, margin: 0, minWidth: 0 } as const;

type CandidateValues = {
  id?: string; number?: number; president_name?: string; vice_name?: string;
  president_info?: string | null; vice_info?: string | null; photo_url?: string | null; vision?: string | null;
  mission?: string | null; programs?: string | null; video_url?: string | null;
};

export function CandidateForm({ c, nextNumber, locked }: { c?: CandidateValues; nextNumber: number; locked: boolean }) {
  const [state, action, pending] = useActionState<Result, FormData>(saveCandidate, undefined);
  useResultToast(state);
  return (
    <form action={action} className="panel" noValidate>
      {c?.id && <input type="hidden" name="id" value={c.id} />}
      {locked && <div className="err-msg" style={{ margin: "0 0 14px" }}>Voting sedang berlangsung. Data paslon terkunci.</div>}
      <fieldset disabled={locked} style={FIELDSET}>
        <div className="formgrid">
          <div className="field full"><ImageUploader current={c?.photo_url} disabled={locked} /></div>
          <div className="field"><label htmlFor="number">Nomor urut</label><input id="number" name="number" type="number" min={1} max={99} className="input" defaultValue={c?.number ?? nextNumber} /></div>
          <div className="field"><label htmlFor="president_name">Calon presiden</label><input id="president_name" name="president_name" className="input" defaultValue={c?.president_name ?? ""} /></div>
          <div className="field"><label htmlFor="vice_name">Calon wakil presiden</label><input id="vice_name" name="vice_name" className="input" defaultValue={c?.vice_name ?? ""} /></div>
          <div className="field"><label htmlFor="president_info">Fakultas/angkatan presiden</label><input id="president_info" name="president_info" className="input" defaultValue={c?.president_info ?? ""} placeholder="Teknik Industri '24" /></div>
          <div className="field"><label htmlFor="vice_info">Fakultas/angkatan wakil</label><input id="vice_info" name="vice_info" className="input" defaultValue={c?.vice_info ?? ""} placeholder="Hukum '24" /></div>
          <div className="field full"><label htmlFor="video_url">Tautan video <InfoTip text="Video ditampilkan di halaman profil Pasangan Calon." /></label><input id="video_url" name="video_url" type="url" className="input" defaultValue={c?.video_url ?? ""} placeholder="https://…" /></div>
          <div className="field full"><label htmlFor="vision">Visi</label><textarea id="vision" name="vision" className="input" defaultValue={c?.vision ?? ""} /></div>
          <div className="field"><label htmlFor="mission">Misi <InfoTip text="Satu baris = satu poin bernomor di landing page." /></label><textarea id="mission" name="mission" className="input" style={{ minHeight: 140 }} defaultValue={c?.mission ?? ""} /></div>
          <div className="field"><label htmlFor="programs">Program unggulan <InfoTip text="Satu baris = satu poin bernomor di landing page." /></label><textarea id="programs" name="programs" className="input" style={{ minHeight: 140 }} defaultValue={c?.programs ?? ""} /></div>
        </div>
        <ErrorLine r={state} />
        <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "flex-end" }}>
          <Link href="/admin/paslon" className="btn btn-g btn-sm">Batal</Link>
          <button className="btn btn-p btn-sm" disabled={pending}>{pending ? "Menyimpan…" : "Simpan paslon"}</button>
        </div>
      </fieldset>
    </form>
  );
}

type SettingsValues = {
  title: string; opens_at: string; closes_at: string; eligible_total: number | null; show_live_breakdown: boolean;
  allow_blank: boolean; public_live: boolean; require_venue_code: boolean; has_venue_code: boolean; require_device_guard: boolean;
};

export function SettingsForm({ v, locked }: { v: SettingsValues; locked: boolean }) {
  const [state, action, pending] = useActionState<Result, FormData>(saveSettings, undefined);
  useResultToast(state);
  return (
    <form action={action} className="panel" noValidate>
      <div className="panel-h"><b>Pengaturan waktu</b><small>zona waktu WIB</small></div>
      <fieldset disabled={locked} style={FIELDSET}>
        <div className="formgrid">
          <div className="field full"><label htmlFor="title">Judul pemilihan</label><input id="title" name="title" className="input" defaultValue={v.title} /></div>
          <div className="field"><label htmlFor="opens_at">Dibuka <InfoTip text="Sebelum waktu ini, halaman E-Vote menampilkan hitung mundur." /></label><DateTimePicker id="opens_at" name="opens_at" defaultValue={v.opens_at} disabled={locked} /></div>
          <div className="field"><label htmlFor="closes_at">Ditutup <InfoTip text="Setelah waktu ini, suara tidak lagi diterima." /></label><DateTimePicker id="closes_at" name="closes_at" defaultValue={v.closes_at} disabled={locked} /></div>
          <div className="field full"><label htmlFor="eligible_total">Jumlah anggota hak pilih <InfoTip text="Dipakai untuk menghitung persentase partisipasi." /></label><input id="eligible_total" name="eligible_total" type="number" min={0} className="input" defaultValue={v.eligible_total ?? ""} /></div>
        </div>
        <label className="toggle"><input type="checkbox" name="show_live_breakdown" defaultChecked={v.show_live_breakdown} /><span><b>Tampilkan rincian live count</b><small>Jika dimatikan, dashboard hanya menampilkan total suara masuk.</small></span></label>
        <label className="toggle"><input type="checkbox" name="public_live" defaultChecked={v.public_live} /><span><b>Tampilkan live count ke publik</b><small>Halaman <span className="mono">/live</span> dapat dilihat siapa saja. Menampilkannya selama voting dapat memengaruhi pemilih.</small></span></label>
        <label className="toggle"><input type="checkbox" name="allow_blank" defaultChecked={v.allow_blank} /><span><b>Sediakan kotak kosong</b><small>Aktifkan hanya bila diatur AD/ART.</small></span></label>
        <label className="toggle"><input type="checkbox" name="require_venue_code" defaultChecked={v.require_venue_code} /><span><b>Wajib kode lokasi (opsional)</b><small>Pemilih memasukkan kode yang hanya terlihat di lokasi.</small></span></label>
        <div className="field" style={{ marginTop: 10 }}>
          <label htmlFor="venue_code">{v.has_venue_code ? "Ganti kode lokasi (kosongkan bila tidak diubah)" : "Kode lokasi"}</label>
          <input id="venue_code" name="venue_code" className="input" autoComplete="off" placeholder="mis. GUD2027" />
        </div>
        <label className="toggle"><input type="checkbox" name="require_device_guard" defaultChecked={v.require_device_guard} /><span><b>Satu suara per perangkat (opsional)</b><small>Penghalang ringan, bukan pengganti verifikasi panitia.</small></span></label>
        <ErrorLine r={state} />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
          <button className="btn btn-p btn-sm" disabled={pending}>{pending ? "Menyimpan…" : "Simpan perubahan"}</button>
        </div>
      </fieldset>
    </form>
  );
}

const DURATIONS = [
  { value: "15", label: "15 menit" },
  { value: "30", label: "30 menit" },
  { value: "60", label: "1 jam" },
  { value: "120", label: "2 jam" },
  { value: "240", label: "4 jam" },
  { value: "480", label: "8 jam" },
];

export function EmergencyPanel({ locked, phase }: { locked: boolean; phase: "upcoming" | "open" | "closed" }) {
  const notify = useNotify();
  const [pending, start] = useTransition();
  const [closeState, closeAction, closing] = useActionState<Result, FormData>(emergencyClose, undefined);
  const [openState, openAction, opening] = useActionState<Result, FormData>(reopenVoting, undefined);
  useResultToast(closeState);
  useResultToast(openState);

  return (
    <div className="panel" style={{ borderColor: phase === "closed" ? "var(--ink)" : "var(--err)" }}>
      <div className="panel-h"><b>{phase === "closed" ? "Voting ditutup" : "Aksi darurat"}</b></div>

      {locked && <div className="err-msg" role="status" style={{ margin: "0 0 12px" }}>Hasil sudah dikunci. Voting tidak dapat dibuka lagi.</div>}

      {phase === "closed" ? (
        <form action={openAction} noValidate style={{ padding: 14, borderRadius: 14, background: "var(--teal-l)" }}>
          <b>Buka kembali voting</b>
          <p className="muted" style={{ margin: "4px 0 10px", fontSize: 13 }}>
            Voting dapat dibuka kembali selama hasil belum dikunci.
          </p>
          <div className="field">
            <label htmlFor="minutes">Dibuka selama</label>
            <Select id="minutes" name="minutes" options={DURATIONS} defaultValue="60" disabled={locked} />
          </div>
          <ErrorLine r={openState} />
          <button className="btn btn-p btn-sm" style={{ marginTop: 12 }} disabled={locked || opening}>{opening ? "Membuka…" : "Buka kembali"}</button>
        </form>
      ) : (
        <>
          <div style={{ padding: 14, borderRadius: 14, background: "var(--warn-bg)" }}>
            <b>Perpanjang waktu</b>
            <p className="muted" style={{ margin: "4px 0 10px", fontSize: 13 }}>Misalnya karena kendala teknis atau jaringan.</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[15, 30, 60].map((m) => (
                <button key={m} type="button" className="btn btn-g btn-sm" disabled={locked || pending} onClick={() => start(async () => notify(await extendTime(m)))}>+{m} menit</button>
              ))}
            </div>
          </div>
          <form action={closeAction} noValidate style={{ padding: 14, borderRadius: 14, background: "var(--err-bg)", marginTop: 12 }}>
            <input type="hidden" name="confirm" value="TUTUP" />
            <b style={{ color: "var(--err)" }}>Tutup darurat</b>
            <p className="muted" style={{ margin: "4px 0 10px", fontSize: 13 }}>Menghentikan voting segera. Dapat dibuka kembali selama hasil belum dikunci.</p>
            <ConfirmSubmit
              className="btn btn-danger btn-sm"
              title="Tutup voting sekarang?"
              description="Pemilih tidak akan bisa memilih lagi. Voting masih bisa dibuka kembali dari halaman ini selama hasil belum dikunci."
              confirmLabel="Ya, tutup voting"
              disabled={locked || closing}
            >Tutup voting</ConfirmSubmit>
            <ErrorLine r={closeState} />
          </form>
        </>
      )}
    </div>
  );
}

export function ReconcileForm() {
  const [state, action, pending] = useActionState<Result, FormData>(reconcile, undefined);
  useResultToast(state);
  return (
    <form action={action} noValidate>
      <div className="field">
        <label htmlFor="note">Catatan <span style={{ fontWeight: 400, color: "var(--ink-3)" }}>(opsional)</span></label>
        <textarea id="note" name="note" className="input" placeholder="Mis. hasil penghitungan di lokasi telah dicocokkan panitia." />
      </div>
      <ErrorLine r={state} />
      <div style={{ marginTop: 12 }}>
        <ConfirmSubmit
          className="btn btn-p btn-sm btn-block"
          tone="primary"
          title="Kunci hasil sekarang?"
          description="Setelah dikunci, voting tidak bisa dibuka lagi dan hasil dinyatakan final. Berita acara dan Excel baru bisa diekspor setelah ini."
          confirmLabel="Ya, kunci hasil"
          disabled={pending}
        >{pending ? "Mengunci…" : "Kunci hasil"}</ConfirmSubmit>
      </div>
    </form>
  );
}

export function AddAdminForm() {
  const [state, action, pending] = useActionState<Result, FormData>(addAdmin, undefined);
  useResultToast(state);
  return (
    <form action={action} className="panel" noValidate>
      <div className="panel-h"><b>Tambah panitia</b></div>
      <div className="formgrid">
        <div className="field"><label htmlFor="email">Email panitia</label><input id="email" name="email" type="email" className="input" placeholder="nama@email.com" /></div>
        <div className="field"><label htmlFor="name">Nama</label><input id="name" name="name" className="input" /></div>
        <div className="field full">
          <label htmlFor="password">Password awal (opsional) <InfoTip text="Isi untuk membuat akun login baru. Kosongkan bila panitia sudah memiliki akun." /></label>
          <input id="password" name="password" type="password" minLength={8} autoComplete="new-password" className="input" placeholder="Kosongkan bila akun sudah ada" />
        </div>
      </div>
      <ErrorLine r={state} />
      <button className="btn btn-p btn-sm" style={{ marginTop: 14 }} disabled={pending}>{pending ? "Menyimpan…" : "Tambah"}</button>
    </form>
  );
}
