"use client";

import { useEffect, useState } from "react";
import { Tooltip } from "@/components/ui/Tooltip";

export type LiveData = {
  phase: "upcoming" | "open" | "closed";
  showBreakdown: boolean;
  votes: number;
  eligible: number | null;
  perCandidate: { id: string; number: number; president_name: string; vice_name: string; total: number }[] | null;
  blank: number | null;
};

const fmtPct = (a: number, b: number | null) => (b ? `${((a / b) * 100).toFixed(1).replace(".", ",")}%` : "–");
const theme = (n: number) => `pc${((n - 1) % 3) + 1}`;

export function LiveDashboard({ initial }: { initial: LiveData }) {
  const [d, setD] = useState(initial);
  const [stale, setStale] = useState(false);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const r = await fetch("/api/admin/stats", { cache: "no-store" });
        if (!r.ok) throw new Error(String(r.status));
        const j = (await r.json()) as LiveData;
        if (alive) { setD(j); setStale(false); }
      } catch {
        if (alive) setStale(true);
      }
    };
    const id = setInterval(tick, 5000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  const maxVotes = Math.max(1, ...(d.perCandidate ?? []).map((c) => c.total), d.blank ?? 0);
  const totalVotes = Math.max(d.votes, 1);

  return (
    <>
      <div className="kpis">
        <div className="kpi hl">
          <small>Partisipasi</small>
          <b>{fmtPct(d.votes, d.eligible)}</b>
          <span>{d.votes} suara masuk{d.eligible ? ` dari ${d.eligible} anggota` : ""}</span>
          <div className="meter"><i style={{ width: d.eligible ? `${Math.min(100, (d.votes / d.eligible) * 100)}%` : "0%" }} /></div>
        </div>
        <div className="kpi"><small>Suara masuk</small><b>{d.votes}</b><span>suara tersimpan</span></div>
        <div className="kpi"><small>Anggota hak pilih</small><b>{d.eligible ?? "–"}</b><span>{d.eligible ? "diatur di halaman Jadwal" : "belum diisi di halaman Jadwal"}</span></div>
      </div>

      <div className="panel">
        <div className="panel-h">
          <b>Live count</b>
          <Tooltip text="Setiap kali dashboard dibuka, aksesnya dicatat di audit log." side="bottom">
            <span className="chip chip-warn" tabIndex={0}>Akses Tercatat</span>
          </Tooltip>
          <div className="sp" />
          {stale && <small role="status">koneksi terputus, mencoba lagi…</small>}
        </div>
        {d.perCandidate ? (
          <>
            <div className="hbars">
              {d.perCandidate.map((c) => (
                <div className={`hb ${theme(c.number)}`} key={c.id}>
                  <div className="who"><span className="num">{c.number}</span><div><b>{c.president_name} &amp; {c.vice_name}</b></div></div>
                  <div className="track"><i style={{ width: `${(c.total / maxVotes) * 100}%` }} /></div>
                  <div className="val"><b>{c.total}</b><span>{fmtPct(c.total, d.votes || null)}</span></div>
                </div>
              ))}
              {(d.blank ?? 0) > 0 && (
                <div className="hb pc0">
                  <div className="who"><span className="num">–</span><div><b>Kotak Kosong</b></div></div>
                  <div className="track"><i style={{ width: `${((d.blank ?? 0) / maxVotes) * 100}%` }} /></div>
                  <div className="val"><b>{d.blank}</b><span>{fmtPct(d.blank ?? 0, totalVotes)}</span></div>
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="muted">Rincian per paslon disembunyikan oleh pengaturan panitia. Hanya total suara masuk yang tampil.</p>
        )}
      </div>
    </>
  );
}
