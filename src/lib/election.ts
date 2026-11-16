import "server-only";
import { cached } from "./cache";
import { queryOne, query } from "./db";

export type Phase = "upcoming" | "open" | "closed";

export type Settings = {
  title: string;
  opens_at: Date | null;
  closes_at: Date | null;
  status: Phase;
  eligible_total: number | null;
  show_live_breakdown: boolean;
  require_venue_code: boolean;
  venue_code_hash: string | null;
  require_device_guard: boolean;
  allow_blank: boolean;
  public_live: boolean;
  attendance_final: number | null;
  reconciliation_note: string | null;
  reconciled_at: Date | null;
};

export type Candidate = {
  id: string;
  number: number;
  president_name: string;
  vice_name: string;
  president_info: string | null;
  vice_info: string | null;
  photo_url: string | null;
  vision: string | null;
  mission: string | null;
  programs: string | null;
  video_url: string | null;
};

const DEFAULT_SETTINGS: Settings = {
  title: "Regenerasi Girl Up Diponegoro 2027",
  opens_at: null,
  closes_at: null,
  status: "upcoming",
  eligible_total: null,
  show_live_breakdown: true,
  require_venue_code: false,
  venue_code_hash: null,
  require_device_guard: false,
  allow_blank: false,
  public_live: false,
  attendance_final: null,
  reconciliation_note: null,
  reconciled_at: null,
};

/**
 * Pengaturan pemilihan. Untuk pengunjung publik dipakai cache 2 detik; aksi panitia yang
 * memeriksa status sebelum menulis memakai `fresh = true` agar selalu membaca data terbaru.
 */
export async function getSettings(fresh = false): Promise<Settings> {
  const load = async () => (await queryOne<Settings>("SELECT * FROM election_settings WHERE id = 1")) ?? DEFAULT_SETTINGS;
  return fresh ? load() : cached("settings", 2000, load);
}

/** Status efektif: mengikuti jadwal, kecuali ditutup manual (tutup darurat). */
export function phaseOf(s: Settings, now = new Date()): Phase {
  if (s.status === "closed") return "closed";
  if (!s.opens_at || !s.closes_at) return "upcoming";
  if (now < s.opens_at) return "upcoming";
  if (now > s.closes_at) return "closed";
  return "open";
}

export async function getCandidates(): Promise<Candidate[]> {
  return cached("candidates", 5000, () => query<Candidate>("SELECT * FROM candidates ORDER BY number"));
}

export async function getCandidateByNumber(n: number): Promise<Candidate | null> {
  return queryOne<Candidate>("SELECT * FROM candidates WHERE number = $1", [n]);
}

export type Stats = {
  votes: number;
  eligible: number | null;
  perCandidate: { id: string; number: number; president_name: string; vice_name: string; total: number }[];
  blank: number;
};

export async function getStats(): Promise<Stats> {
  const [vt] = await query<{ n: string; blank: string }>(
    "SELECT COUNT(*) AS n, COUNT(*) FILTER (WHERE is_blank) AS blank FROM votes",
  );
  const s = await getSettings();
  const perCandidate = await query<{
    id: string; number: number; president_name: string; vice_name: string; total: string;
  }>(
    `SELECT c.id, c.number, c.president_name, c.vice_name, COUNT(v.id) AS total
       FROM candidates c LEFT JOIN votes v ON v.candidate_id = c.id
      GROUP BY c.id ORDER BY c.number`,
  );
  return {
    votes: Number(vt.n),
    eligible: s.eligible_total,
    perCandidate: perCandidate.map((c) => ({ ...c, total: Number(c.total) })),
    blank: Number(vt.blank),
  };
}
