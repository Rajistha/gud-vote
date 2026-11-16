import "server-only";
import { cached, invalidateCache } from "./cache";
import { getSettings, getStats, phaseOf, type Phase } from "./election";

export type LiveSnapshot = {
  /** false = panitia belum menampilkan live count ke publik; data suara tidak disertakan. */
  enabled: boolean;
  title: string;
  phase: Phase;
  finalized: boolean;
  opensAt: string | null;
  closesAt: string | null;
  votes: number;
  eligible: number | null;
  candidates: { number: number; name: string; total: number }[];
  blank: number;
  /** Waktu server saat data dibuat (ISO), dipakai klien untuk menyelaraskan jam. */
  now: string;
};

async function build(): Promise<LiveSnapshot> {
  const s = await getSettings(true);
  const base = {
    title: s.title,
    phase: phaseOf(s),
    finalized: !!s.reconciled_at,
    opensAt: s.opens_at?.toISOString() ?? null,
    closesAt: s.closes_at?.toISOString() ?? null,
    now: new Date().toISOString(),
  };
  if (!s.public_live) {
    return { ...base, enabled: false, votes: 0, eligible: null, candidates: [], blank: 0 };
  }
  const st = await getStats();
  return {
    ...base,
    enabled: true,
    votes: st.votes,
    eligible: st.eligible,
    candidates: st.perCandidate.map((c) => ({ number: c.number, name: `${c.president_name} & ${c.vice_name}`, total: c.total })),
    blank: st.blank,
  };
}

/**
 * Berapa pun jumlah penonton, database hanya dibaca sekali per ~1,5 detik per instance;
 * permintaan yang bersamaan berbagi satu pembacaan.
 */
export async function getLiveSnapshot(): Promise<LiveSnapshot> {
  const data = await cached("live", 1500, build);
  return { ...data, now: new Date().toISOString() };
}

/** Dipanggil setelah panitia mengubah data agar perubahan langsung terlihat. */
export function resetLiveCache() {
  invalidateCache();
}
