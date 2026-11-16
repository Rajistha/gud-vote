import "server-only";
import type { Settings, getStats } from "./election";
import { fmtDate, fmtDateLong, fmtTime, pct } from "./format";

type Stats = Awaited<ReturnType<typeof getStats>>;

export const PRESIDENT = "Putu Wina Sadiva Karang";
export const PRESIDENT_TITLE = "Presiden Girl Up Diponegoro 2026";

const num = (n: number) => new Intl.NumberFormat("id-ID").format(n);
/** Tanggal dan jam tidak boleh terpotong di akhir baris. */
const nb = (t: string) => t.replace(/ /g, " ");
const lowerFirst = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);

/** Isi berita acara, dipakai bersama oleh halaman cetak dan unduhan Word agar keduanya selalu sama. */
export function buildBeritaAcara(s: Settings, st: Stats) {
  const reconciledAt = s.reconciled_at as Date;
  const top = st.perCandidate.length ? Math.max(...st.perCandidate.map((c) => c.total)) : 0;
  const leaders = st.perCandidate.filter((c) => c.total === top);
  const leader = st.votes > 0 && top > 0 && leaders.length === 1 && top >= st.blank ? leaders[0] : null;

  return {
    title: s.title,
    heading: ["Pemungutan dan Rekapitulasi Suara", s.title],
    opening:
      `Pada hari ini, ${s.opens_at ? nb(fmtDate(s.opens_at)) : "………………………"}, telah dilaksanakan pemungutan suara secara elektronik dalam rangka ${lowerFirst(s.title)}. ` +
      `Pemungutan suara dibuka pada pukul ${s.opens_at ? nb(fmtTime(s.opens_at)) : "………"} dan ditutup pada pukul ${s.closes_at ? nb(fmtTime(s.closes_at)) : "………"}. ` +
      `Seluruh suara yang masuk telah dihitung dan hasilnya ditetapkan pada ${nb(fmtDate(reconciledAt))} pukul ${nb(fmtTime(reconciledAt))} dengan rincian sebagai berikut:`,
    voters: [
      ["Jumlah anggota yang memiliki hak pilih", s.eligible_total != null ? `${num(s.eligible_total)} orang` : "–"],
      ["Jumlah suara yang masuk", `${num(st.votes)} suara`],
      ["Tingkat partisipasi", pct(st.votes, s.eligible_total)],
    ] as [string, string][],
    rows: [
      ...st.perCandidate.map((c) => ({
        no: String(c.number), name: `${c.president_name} & ${c.vice_name}`, votes: num(c.total), pct: pct(c.total, st.votes),
      })),
      ...(st.blank > 0 ? [{ no: "–", name: "Kotak Kosong", votes: num(st.blank), pct: pct(st.blank, st.votes) }] : []),
    ],
    total: { votes: num(st.votes), pct: st.votes > 0 ? "100%" : "0%" },
    leaderText: leader
      ? `Berdasarkan perolehan tersebut, Pasangan Calon Nomor Urut ${leader.number}, yaitu ${leader.president_name} & ${leader.vice_name}, memperoleh suara terbanyak dengan ${num(leader.total)} suara (${pct(leader.total, st.votes)}).`
      : null,
    note: s.reconciliation_note,
    closing: "Demikian berita acara ini dibuat dengan sebenar-benarnya untuk dipergunakan sebagaimana mestinya.",
    signDate: `Semarang, ${nb(fmtDateLong(reconciledAt))}`,
    president: PRESIDENT,
    presidentTitle: PRESIDENT_TITLE,
  };
}
