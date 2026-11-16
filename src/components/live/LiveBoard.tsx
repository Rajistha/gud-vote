"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { IconExitFullscreen, IconFullscreen } from "@/components/icons";
import type { LiveSnapshot } from "@/lib/live";

const POLL_MS = 3000;
const pad = (n: number) => String(Math.max(0, n)).padStart(2, "0");
const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 1000) / 10 : 0);
const fmtPct = (n: number) => `${String(n).replace(".", ",")}%`;
const clock = (iso: string) =>
  new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: "Asia/Jakarta" })
    .format(new Date(iso)).replaceAll(":", ".");
const theme = (n: number) => `pc${((n - 1) % 3) + 1}`;

type WakeLockSentinelLike = { release: () => Promise<void> };
type NavWithWakeLock = Navigator & { wakeLock?: { request: (t: "screen") => Promise<WakeLockSentinelLike> } };

/** Sisa waktu menuju target, memakai jam server agar semua layar menunjukkan angka yang sama. */
function remaining(targetIso: string | null, nowMs: number) {
  if (!targetIso) return null;
  const s = Math.max(0, Math.floor((new Date(targetIso).getTime() - nowMs) / 1000));
  const days = Math.floor(s / 86400);
  const hms = `${pad(Math.floor(s / 3600) % 24)}.${pad(Math.floor(s / 60) % 60)}.${pad(s % 60)}`;
  return { days, hms };
}

/** Angka yang naik perlahan saat nilai berubah (count-up animation). */
function AnimatedCount({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(value);
  const [bump, setBump] = useState(false);
  const prev = useRef(value);
  const raf = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (value === prev.current) return;
    const from = prev.current;
    prev.current = value;
    if (raf.current) cancelAnimationFrame(raf.current);

    const duration = Math.min(600, Math.abs(value - from) * 20);
    const start = performance.now();
    setBump(true);

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // ease-out cubic
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (value - from) * ease));
      if (t < 1) {
        raf.current = requestAnimationFrame(step);
      } else {
        setDisplay(value);
        setTimeout(() => setBump(false), 400);
      }
    };
    raf.current = requestAnimationFrame(step);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [value]);

  return (
    <b className={`${className ?? ""} ${bump ? "lv-bump" : ""}`.trim()}>
      {display}
    </b>
  );
}

/** Ikon mahkota kecil untuk paslon terdepan */
function IconCrown() {
  return (
    <svg className="lv-crown" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M2 20h20v-2H2v2zM4 17l4-8 4 4 4-7 4 11H4z" />
    </svg>
  );
}

export function LiveBoard({ initial }: { initial: LiveSnapshot }) {
  const [d, setD] = useState(initial);
  const [online, setOnline] = useState(true);
  const [nowMs, setNowMs] = useState(() => new Date(initial.now).getTime());
  const [full, setFull] = useState(false);
  const offset = useRef(0);
  const fails = useRef(0);

  // --- sinkronisasi data: ambil ulang tiap beberapa detik, pulih sendiri bila koneksi putus ---
  useEffect(() => {
    let alive = true;
    let timer: number | undefined;

    const run = async () => {
      try {
        // Batas waktu 8 detik (AbortSignal.timeout tidak ada di Safari lama).
        const ctrl = new AbortController();
        const to = window.setTimeout(() => ctrl.abort(), 8000);
        const r = await fetch("/api/live", { cache: "no-store", signal: ctrl.signal }).finally(() => window.clearTimeout(to));
        if (!r.ok) throw new Error(String(r.status));
        const j = (await r.json()) as LiveSnapshot;
        if (!alive) return;
        fails.current = 0;
        offset.current = new Date(j.now).getTime() - Date.now();
        setOnline(true);
        setD(j);
      } catch {
        if (!alive) return;
        fails.current += 1;
        if (fails.current >= 2) setOnline(false);
      }
      if (alive) timer = window.setTimeout(run, document.hidden ? 15000 : POLL_MS * Math.min(2, 1 + fails.current));
    };

    const resume = () => {
      if (document.hidden) return;
      window.clearTimeout(timer);
      void run();
    };
    offset.current = new Date(initial.now).getTime() - Date.now();
    timer = window.setTimeout(run, POLL_MS);
    document.addEventListener("visibilitychange", resume);
    window.addEventListener("online", resume);
    return () => {
      alive = false;
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", resume);
      window.removeEventListener("online", resume);
    };
  }, [initial.now]);

  // --- jam: satu detik sekali, berdasarkan waktu server ---
  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now() + offset.current), 1000);
    return () => window.clearInterval(id);
  }, []);

  // --- layar tetap menyala selama ditampilkan ---
  useEffect(() => {
    let lock: WakeLockSentinelLike | null = null;
    const ask = async () => {
      try { lock = (await (navigator as NavWithWakeLock).wakeLock?.request("screen")) ?? null; } catch { /* tidak didukung */ }
    };
    void ask();
    const again = () => { if (!document.hidden) void ask(); };
    document.addEventListener("visibilitychange", again);
    return () => { document.removeEventListener("visibilitychange", again); void lock?.release().catch(() => {}); };
  }, []);

  useEffect(() => {
    const on = () => setFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);

  function toggleFull() {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.().catch(() => {});
  }

  const status = online ? `Tersambung · ${clock(d.now)}` : "Menyambung ulang…";

  const top = (
    <header className="lv-top">
      <div className="lv-brand">
        <Image src="/logo-gud.png" alt="Logo Girl Up Diponegoro" width={44} height={53} priority />
        <div><b>{d.title}</b><small>Rooted In Care, Equality Everywhere.</small></div>
      </div>
      <div className="lv-tools">
          <span className={`lv-conn${online ? "" : " off"}`} role="status" aria-live="polite">
            <i aria-hidden="true" />
            <span className="lv-conn-t">{status}</span>
          </span>
          <button type="button" className="lv-fs" onClick={toggleFull} aria-label={full ? "Keluar dari layar penuh" : "Layar penuh"}>
            {full ? <IconExitFullscreen /> : <IconFullscreen />}
          </button>
        </div>
    </header>
  );

  if (!d.enabled) {
    return (
      <div className="lv">
        {top}
        <main className="lv-wait">
          <h1 className="d">Live Count <span className="mk">Belum Tampil</span></h1>
          <p>Perolehan suara akan ditampilkan di sini oleh panitia. Halaman ini diperbarui otomatis.</p>
        </main>
      </div>
    );
  }

  const max = Math.max(1, ...d.candidates.map((c) => c.total));
  const leading = d.phase !== "upcoming" && d.votes > 0 ? d.candidates.find((c) => c.total === max)?.number : undefined;
  const rowCount = Math.max(1, d.candidates.length + (d.blank > 0 ? 1 : 0));

  const sub =
    d.phase === "upcoming" ? "Voting belum dibuka."
      : d.phase === "open" ? "Penghitungan berlangsung · diperbarui otomatis setiap 3 detik."
        : d.finalized ? "Hasil final."
          : "Voting telah ditutup. Menunggu penetapan hasil.";

  const left = d.phase === "upcoming" ? remaining(d.opensAt, nowMs) : d.phase === "open" ? remaining(d.closesAt, nowMs) : null;
  const leftLabel = d.phase === "upcoming" ? "Dibuka dalam" : d.phase === "open" ? "Sisa waktu" : "Status";
  const leftValue = left ? left.hms : d.finalized ? "Final" : "Ditutup";
  // Hari dipisah dari jam agar hitung mundur panjang tetap muat di layar sempit.
  const leftDays = left && left.days > 0 ? `${left.days} hari` : null;

  return (
    <div className="lv">
      {top}
      <main className="lv-main">
        <div className="lv-head">
          <h1 className="d">Perolehan <span className="mk">Suara</span></h1>
          <p className="lv-sub">{sub}</p>
        </div>

        <ol className="lv-rows" data-dense={rowCount >= 4} style={{ "--n": rowCount } as React.CSSProperties}>
          {d.candidates.map((c) => {
            const share = pct(c.total, d.votes);
            const isLeading = leading === c.number;
            return (
              <li key={c.number} className={`lv-row ${theme(c.number)}${isLeading ? " lead" : ""}`}>
                <div className="lv-num">
                  {isLeading && <IconCrown />}
                  {c.number}
                </div>
                <div className="lv-body">
                  <div className="lv-name">{c.name}</div>
                  <div className="lv-track" aria-hidden="true">
                    <i style={{ width: `${share}%` }} />
                    <span className="lv-track-pct">{fmtPct(share)}</span>
                  </div>
                </div>
                <div className="lv-val">
                  <AnimatedCount value={c.total} className="lv-count" />
                  <span>{fmtPct(share)}</span>
                </div>
              </li>
            );
          })}
          {d.blank > 0 && (
            <li className="lv-row pc0">
              <div className="lv-num">–</div>
              <div className="lv-body">
                <div className="lv-name">Kotak Kosong</div>
                <div className="lv-track" aria-hidden="true">
                  <i style={{ width: `${pct(d.blank, d.votes)}%` }} />
                  <span className="lv-track-pct">{fmtPct(pct(d.blank, d.votes))}</span>
                </div>
              </div>
              <div className="lv-val">
                <AnimatedCount value={d.blank} className="lv-count" />
                <span>{fmtPct(pct(d.blank, d.votes))}</span>
              </div>
            </li>
          )}
          {d.candidates.length === 0 && <li className="lv-empty">Pasangan Calon belum tersedia.</li>}
        </ol>
      </main>

      <footer
        className="lv-foot"
        style={{ "--foot-cols": d.eligible ? 3 : 2 } as React.CSSProperties}
      >
        {/* Kolom 1: total suara */}
        <div>
          <small>Total suara</small>
          <AnimatedCount value={d.votes} className="lv-count" />
        </div>

        {/* Kolom 2 (opsional): partisipasi — label gabung sub-teks agar tinggi sama */}
        {d.eligible ? (
          <div>
            <small>Partisipasi · {d.eligible} anggota</small>
            <b>{fmtPct(pct(d.votes, d.eligible))}</b>
          </div>
        ) : null}

        {/* Kolom terakhir: countdown / status */}
        <div>
          <small>{leftLabel}</small>
          <b className="lv-time">{leftValue}</b>
          {leftDays && <span>{leftDays}</span>}
        </div>
      </footer>
    </div>
  );
}
