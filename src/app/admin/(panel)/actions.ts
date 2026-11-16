"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { query, queryOne } from "@/lib/db";
import { getSettings, getStats, phaseOf } from "@/lib/election";
import { fromLocalInput } from "@/lib/format";
import { hashVenueCode } from "@/lib/security";
import { resetLiveCache } from "@/lib/live";
import { removeCandidatePhoto, uploadCandidatePhoto } from "@/lib/storage";
import { audit, destroySession, requireAdmin } from "@/lib/session";
import { createSupabaseUser } from "@/lib/supabase";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export type Result = { ok?: string; error?: string } | undefined;

/* ---------- sesi ---------- */
export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

/* ---------- paslon ---------- */
const text = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const opt = (fd: FormData, k: string) => text(fd, k) || null;

export async function saveCandidate(_prev: Result, fd: FormData): Promise<Result> {
  const admin = await requireAdmin();
  const s = await getSettings(true);
  if (phaseOf(s) === "open") return { error: "Data paslon terkunci selama voting berlangsung." };

  const id = opt(fd, "id");
  const number = Number(text(fd, "number"));
  const president = text(fd, "president_name");
  const vice = text(fd, "vice_name");
  if (!Number.isInteger(number) || number < 1 || number > 99) return { error: "Nomor urut harus angka 1–99." };
  if (!president || !vice) return { error: "Nama calon presiden dan wakil wajib diisi." };

  const video = opt(fd, "video_url");
  if (video && !/^https?:\/\//i.test(video)) return { error: "Video: tautan harus diawali http:// atau https://" };

  // Foto: pakai yang sudah ada, kecuali diganti (unggahan baru) atau dihapus.
  const existing = id ? await queryOne<{ photo_url: string | null }>("SELECT photo_url FROM candidates WHERE id = $1", [id]) : null;
  let photo = existing?.photo_url ?? null;
  let uploaded: string | null = null;
  const file = fd.get("photo");
  if (file instanceof File && file.size > 0) {
    const up = await uploadCandidatePhoto(file);
    if ("error" in up) return { error: up.error };
    photo = uploaded = up.url;
  } else if (text(fd, "remove_photo") === "1") {
    photo = null;
  }

  const values = [
    number, president, vice, opt(fd, "president_info"), opt(fd, "vice_info"),
    photo, opt(fd, "vision"), opt(fd, "mission"), opt(fd, "programs"), video,
  ];
  try {
    if (id) {
      await query(
        `UPDATE candidates SET number=$1, president_name=$2, vice_name=$3, president_info=$4, vice_info=$5,
                photo_url=$6, vision=$7, mission=$8, programs=$9, video_url=$10 WHERE id=$11`,
        [...values, id],
      );
      await audit(admin.id, "UPDATE_CANDIDATE", { number });
    } else {
      await query(
        `INSERT INTO candidates (number, president_name, vice_name, president_info, vice_info, photo_url, vision, mission, programs, video_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        values,
      );
      await audit(admin.id, "CREATE_CANDIDATE", { number });
    }
  } catch (e) {
    await removeCandidatePhoto(uploaded); // simpan gagal: jangan tinggalkan foto yatim
    if (e instanceof Error && e.message.includes("candidates_number_key")) return { error: `Nomor urut ${number} sudah dipakai paslon lain.` };
    throw e;
  }
  if (existing?.photo_url && existing.photo_url !== photo) await removeCandidatePhoto(existing.photo_url);
  revalidatePath("/admin/paslon");
  redirect("/admin/paslon?msg=saved");
}

export async function deleteCandidate(id: string): Promise<void> {
  const admin = await requireAdmin();
  if (!UUID_RE.test(id)) redirect("/admin/paslon");
  const s = await getSettings(true);
  if (phaseOf(s) === "open") redirect("/admin/paslon?msg=locked");
  const used = await queryOne<{ n: string }>("SELECT COUNT(*) AS n FROM votes WHERE candidate_id = $1", [id]);
  if (Number(used?.n ?? 0) > 0) redirect("/admin/paslon?msg=hasvotes");
  const c = await queryOne<{ number: number; photo_url: string | null }>("DELETE FROM candidates WHERE id = $1 RETURNING number, photo_url", [id]);
  if (c) {
    await audit(admin.id, "DELETE_CANDIDATE", { number: c.number });
    await removeCandidatePhoto(c.photo_url);
  }
  revalidatePath("/admin/paslon");
  redirect("/admin/paslon?msg=deleted");
}

/* ---------- jadwal & pengaturan ---------- */
export async function saveSettings(_prev: Result, fd: FormData): Promise<Result> {
  const admin = await requireAdmin();
  const cur = await getSettings(true);
  if (cur.reconciled_at) return { error: "Hasil sudah dikunci. Pengaturan tidak dapat diubah." };

  const title = text(fd, "title");
  if (!title) return { error: "Judul pemilihan wajib diisi." };
  const opens = fromLocalInput(text(fd, "opens_at"));
  const closes = fromLocalInput(text(fd, "closes_at"));
  if (!opens || !closes) return { error: "Waktu buka dan tutup wajib diisi." };
  if (closes <= opens) return { error: "Waktu tutup harus setelah waktu buka." };

  const eligibleRaw = text(fd, "eligible_total");
  const eligible = eligibleRaw ? Number(eligibleRaw) : null;
  if (eligible !== null && (!Number.isInteger(eligible) || eligible < 0)) return { error: "Jumlah anggota harus bilangan bulat." };

  const requireVenue = fd.get("require_venue_code") === "on";
  const newCode = text(fd, "venue_code");
  let venueHash = cur.venue_code_hash;
  if (newCode) {
    if (newCode.length < 4) return { error: "Kode lokasi minimal 4 karakter." };
    venueHash = hashVenueCode(newCode);
  }
  if (requireVenue && !venueHash) return { error: "Isi kode lokasi bila fitur ini diaktifkan." };

  await query(
    `UPDATE election_settings SET title=$1, opens_at=$2, closes_at=$3, eligible_total=$4,
            show_live_breakdown=$5, allow_blank=$6, require_venue_code=$7, venue_code_hash=$8,
            require_device_guard=$9, public_live=$10, updated_at=now() WHERE id=1`,
    [title, opens, closes, eligible, fd.get("show_live_breakdown") === "on", fd.get("allow_blank") === "on",
      requireVenue, venueHash, fd.get("require_device_guard") === "on", fd.get("public_live") === "on"],
  );
  resetLiveCache();
  await audit(admin.id, "UPDATE_SETTINGS", {
    opens_at: opens.toISOString(), closes_at: closes.toISOString(), eligible_total: eligible,
    venue_code_changed: !!newCode,
  });
  revalidatePath("/admin", "layout");
  return { ok: "Pengaturan disimpan." };
}

/** Menyalakan/mematikan layar live count publik (/live) dengan satu klik dari dashboard. */
export async function setPublicLive(on: boolean): Promise<Result & { on?: boolean }> {
  const admin = await requireAdmin();
  await query("UPDATE election_settings SET public_live=$1, updated_at=now() WHERE id=1", [!!on]);
  resetLiveCache();
  await audit(admin.id, "PUBLIC_LIVE", { on: !!on });
  revalidatePath("/admin", "layout");
  return { ok: on ? "Live count ditampilkan ke publik." : "Live count disembunyikan dari publik.", on: !!on };
}

export async function extendTime(minutes: number): Promise<Result> {
  const admin = await requireAdmin();
  const s = await getSettings(true);
  if (s.reconciled_at) return { error: "Hasil sudah dikunci." };
  if (![15, 30, 60].includes(minutes)) return { error: "Durasi tidak valid." };
  const base = s.closes_at && s.closes_at > new Date() ? s.closes_at : new Date();
  const next = new Date(base.getTime() + minutes * 60_000);
  // status dikembalikan ke mengikuti jadwal agar voting yang ditutup manual bisa dibuka lagi
  await query("UPDATE election_settings SET closes_at=$1, status='upcoming', updated_at=now() WHERE id=1", [next]);
  await audit(admin.id, "EXTEND_TIME", { minutes, closes_at: next.toISOString() });
  revalidatePath("/admin", "layout");
  return { ok: `Waktu diperpanjang ${minutes} menit.` };
}

export async function reopenVoting(_prev: Result, fd: FormData): Promise<Result> {
  const admin = await requireAdmin();
  const s = await getSettings(true);
  if (s.reconciled_at) return { error: "Hasil sudah dikunci. Voting tidak dapat dibuka lagi." };
  if (phaseOf(s) !== "closed") return { error: "Voting sedang tidak ditutup." };
  const minutes = Number(text(fd, "minutes"));
  if (![15, 30, 60, 120, 240, 480].includes(minutes)) return { error: "Pilih durasi pembukaan." };

  const closes = new Date(Date.now() + minutes * 60_000);
  // status kembali mengikuti jadwal; jam buka dimajukan ke sekarang bila masih di masa depan
  await query(
    `UPDATE election_settings
        SET closes_at = $1, status = 'upcoming', opens_at = LEAST(COALESCE(opens_at, now()), now()), updated_at = now()
      WHERE id = 1`,
    [closes],
  );
  await audit(admin.id, "REOPEN", { minutes, closes_at: closes.toISOString() });
  revalidatePath("/", "layout");
  const until = closes.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Jakarta" }).replace(":", ".");
  return { ok: `Voting dibuka kembali sampai ${until} WIB.` };
}

export async function emergencyClose(_prev: Result, fd: FormData): Promise<Result> {
  const admin = await requireAdmin();
  if (text(fd, "confirm") !== "TUTUP") return { error: "Ketik TUTUP (huruf besar) untuk konfirmasi." };
  await query("UPDATE election_settings SET status='closed', updated_at=now() WHERE id=1");
  await audit(admin.id, "EMERGENCY_CLOSE", {});
  revalidatePath("/admin", "layout");
  return { ok: "Voting ditutup." };
}

/* ---------- penetapan hasil ---------- */
export async function reconcile(_prev: Result, fd: FormData): Promise<Result> {
  const admin = await requireAdmin();
  const s = await getSettings(true);
  if (phaseOf(s) !== "closed") return { error: "Hasil hanya dapat dikunci setelah voting ditutup." };
  if (s.reconciled_at) return { error: "Hasil sudah dikunci." };

  const st = await getStats();
  const note = text(fd, "note");
  await query(
    `UPDATE election_settings SET reconciliation_note=$1, reconciled_at=now(), status='closed', updated_at=now() WHERE id=1`,
    [note || null],
  );
  await audit(admin.id, "RECONCILE", { votes: st.votes, note });
  revalidatePath("/admin", "layout");
  return { ok: "Hasil dikunci. Berita acara dan Excel siap diekspor." };
}

/* ---------- panitia ---------- */
export async function addAdmin(_prev: Result, fd: FormData): Promise<Result> {
  const admin = await requireAdmin();
  const email = text(fd, "email").toLowerCase();
  const name = opt(fd, "name");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "Format email tidak valid." };
  const exists = await queryOne("SELECT 1 FROM admins WHERE lower(email) = $1", [email]);
  if (exists) return { error: "Email ini sudah terdaftar sebagai panitia." };

  // Password diisi = buat juga akun Supabase-nya (butuh SUPABASE_SERVICE_ROLE_KEY).
  const password = String(fd.get("password") ?? "");
  let note = "Buat akun login panitia secara terpisah agar dapat masuk.";
  if (password) {
    if (password.length < 8) return { error: "Password minimal 8 karakter." };
    const r = await createSupabaseUser(email, password);
    if (!r.ok) return { error: r.error };
    note = r.existed ? "Akun login sudah ada; password tidak diubah." : "Akun login dibuat.";
  }

  await query("INSERT INTO admins (email, name) VALUES ($1,$2)", [email, name]);
  await audit(admin.id, "ADD_ADMIN", { email, supabase_user: !!password });
  revalidatePath("/admin/panitia");
  return { ok: `${email} ditambahkan sebagai panitia. ${note}` };
}

export async function removeAdmin(id: string): Promise<void> {
  const admin = await requireAdmin();
  if (!UUID_RE.test(id)) redirect("/admin/panitia");
  if (id === admin.id) redirect("/admin/panitia?msg=self");
  // audit_logs (dan check_ins lama) merujuk ke admin; yang sudah punya jejak tidak boleh dihapus.
  const used = await queryOne<{ n: string }>(
    `SELECT (SELECT COUNT(*) FROM audit_logs WHERE admin_id = $1) + (SELECT COUNT(*) FROM check_ins WHERE admin_id = $1) AS n`,
    [id],
  );
  if (Number(used?.n ?? 0) > 0) redirect("/admin/panitia?msg=hasdata");
  const r = await queryOne<{ email: string }>("DELETE FROM admins WHERE id = $1 RETURNING email", [id]);
  if (r) await audit(admin.id, "REMOVE_ADMIN", { email: r.email });
  revalidatePath("/admin/panitia");
  redirect("/admin/panitia?msg=removed");
}
