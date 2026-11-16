"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const pad = (n: number) => String(Math.max(0, n)).padStart(2, "0");

/** Selisih jam server-klien, supaya hitung mundur tidak bergeser bila jam HP salah. */
function useOffset(serverNow: string) {
  const [offset] = useState(() => new Date(serverNow).getTime() - Date.now());
  return offset;
}

export function CountdownCard({ target, serverNow }: { target: string; serverNow: string }) {
  const router = useRouter();
  const offset = useOffset(serverNow);
  const end = new Date(target).getTime();
  const [left, setLeft] = useState(() => end - (Date.now() + offset));

  useEffect(() => {
    const id = setInterval(() => {
      const l = end - (Date.now() + offset);
      setLeft(l);
      if (l <= 0) {
        clearInterval(id);
        router.refresh();
      }
    }, 1000);
    // Jaga-jaga bila panitia mengubah jadwal: periksa ulang tiap 30 detik.
    const poll = setInterval(() => router.refresh(), 30_000);
    return () => { clearInterval(id); clearInterval(poll); };
  }, [end, offset, router]);

  const s = Math.max(0, Math.floor(left / 1000));
  const parts: [string, string][] = [
    [pad(Math.floor(s / 86400)), "hari"],
    [pad(Math.floor(s / 3600) % 24), "jam"],
    [pad(Math.floor(s / 60) % 60), "menit"],
    [pad(s % 60), "detik"],
  ];
  return (
    <div className="cd-card" role="timer" aria-label="Hitung mundur pembukaan voting">
      {parts.map(([v, l]) => (
        <div key={l}><b>{v}</b><small>{l}</small></div>
      ))}
    </div>
  );
}

export function TimeLeft({ target, serverNow }: { target: string; serverNow: string }) {
  const router = useRouter();
  const offset = useOffset(serverNow);
  const end = new Date(target).getTime();
  const [left, setLeft] = useState(() => end - (Date.now() + offset));

  useEffect(() => {
    const id = setInterval(() => {
      const l = end - (Date.now() + offset);
      setLeft(l);
      if (l <= 0) { clearInterval(id); router.refresh(); }
    }, 1000);
    return () => clearInterval(id);
  }, [end, offset, router]);

  const s = Math.max(0, Math.floor(left / 1000));
  return <b>{pad(Math.floor(s / 3600))}:{pad(Math.floor(s / 60) % 60)}:{pad(s % 60)}</b>;
}

/** Layar "suara tercatat" kembali ke awal otomatis. */
export function AutoReturn({ seconds, onDone }: { seconds: number; onDone: () => Promise<void> }) {
  const router = useRouter();
  useEffect(() => {
    const t = setTimeout(async () => {
      await onDone();
      router.replace("/");
    }, seconds * 1000);
    return () => clearTimeout(t);
  }, [seconds, onDone, router]);
  return <div className="bar" aria-hidden="true"><i className="shrink" style={{ animationDuration: `${seconds}s` }} /></div>;
}
