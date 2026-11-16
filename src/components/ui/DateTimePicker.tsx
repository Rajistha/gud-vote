"use client";

import { useEffect, useId, useRef, useState } from "react";
import { IconCal, IconChevron } from "@/components/icons";

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const WEEKDAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const HEAD = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const pad = (n: number) => String(n).padStart(2, "0");

type Parts = { y: number; m: number; d: number; h: number; min: number }; // m: 0-11

function parse(v?: string): Parts | null {
  const r = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(v ?? "");
  return r ? { y: +r[1], m: +r[2] - 1, d: +r[3], h: +r[4], min: +r[5] } : null;
}

const serialize = (p: Parts) => `${p.y}-${pad(p.m + 1)}-${pad(p.d)}T${pad(p.h)}:${pad(p.min)}`;

function label(p: Parts) {
  const wd = WEEKDAYS[new Date(p.y, p.m, p.d).getDay()].slice(0, 3);
  return `${wd}, ${p.d} ${MONTHS[p.m].slice(0, 3)} ${p.y} · ${pad(p.h)}.${pad(p.min)} WIB`;
}

/** Waktu sekarang di WIB (UTC+7), terlepas dari zona waktu perangkat. */
function nowWib(): Parts {
  const t = new Date(Date.now() + 7 * 3600 * 1000);
  return { y: t.getUTCFullYear(), m: t.getUTCMonth(), d: t.getUTCDate(), h: t.getUTCHours(), min: t.getUTCMinutes() };
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

/** Kolom angka yang bisa digulir (jam atau menit), tampil di dalam popover agar tidak meluap. */
function TimeCol({ values, current, label, onPick }: { values: number[]; current: number | null; label: string; onPick: (n: number) => void }) {
  const list = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const box = list.current;
    const el = box?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (box && el) box.scrollTop = el.offsetTop - box.clientHeight / 2 + el.clientHeight / 2;
  }, []);
  return (
    <div className="dtp-col" role="listbox" aria-label={label} ref={list}>
      {values.map((n) => (
        <button key={n} type="button" role="option" aria-selected={n === current} className={n === current ? "on" : ""} onClick={() => onPick(n)}>{pad(n)}</button>
      ))}
    </div>
  );
}

/** Pemilih tanggal & jam kustom (pengganti <input type="datetime-local">). Nilai: "YYYY-MM-DDTHH:mm" (WIB). */
export function DateTimePicker({
  name, defaultValue, id, disabled,
}: {
  name: string;
  defaultValue?: string;
  id?: string;
  disabled?: boolean;
}) {
  const [value, setValue] = useState<Parts | null>(() => parse(defaultValue));
  const [open, setOpen] = useState(false);
  const [view, setView] = useState({ y: 2026, m: 0 });
  const [today, setToday] = useState<Parts | null>(null);
  const [up, setUp] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const popId = useId();

  // Pastikan kalender yang baru dibuka terlihat penuh (menggulir halaman bila perlu).
  useEffect(() => {
    if (open) pop.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); btn.current?.focus(); } };
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("keydown", esc); };
  }, [open]);

  function toggle() {
    if (disabled) return;
    if (!open) {
      // Buka ke atas bila ruang di bawah tidak cukup untuk kalender (±400px; di HP kalender menumpuk ±600px).
      const r = root.current?.getBoundingClientRect();
      const need = window.innerWidth < 520 ? 570 : 400;
      // Balik ke atas hanya jika di atas memang muat; kalau tidak, buka ke bawah dan gulir halaman.
      if (r) setUp(window.innerHeight - r.bottom < need && r.top >= need);
      const n = nowWib();
      setToday(n);
      setView(value ? { y: value.y, m: value.m } : { y: n.y, m: n.m });
    }
    setOpen(!open);
  }

  const base = (): Parts => value ?? { ...(today ?? nowWib()), h: 8, min: 0 };
  const shift = (delta: number) => setView((v) => {
    const t = new Date(v.y, v.m + delta, 1);
    return { y: t.getFullYear(), m: t.getMonth() };
  });
  const pickDay = (d: number) => setValue({ ...base(), y: view.y, m: view.m, d });
  const goToday = () => {
    const n = nowWib();
    setToday(n);
    setView({ y: n.y, m: n.m });
    setValue({ ...base(), y: n.y, m: n.m, d: n.d });
  };

  const offset = (new Date(view.y, view.m, 1).getDay() + 6) % 7; // Senin = 0
  const days = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const isSel = (d: number) => !!value && value.y === view.y && value.m === view.m && value.d === d;
  const isToday = (d: number) => !!today && today.y === view.y && today.m === view.m && today.d === d;

  return (
    <div className="dtp" ref={root}>
      <input type="hidden" name={name} value={value ? serialize(value) : ""} />
      <button
        type="button"
        id={id}
        ref={btn}
        className="input dtp-btn"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? popId : undefined}
        disabled={disabled}
        onClick={toggle}
      >
        <IconCal />
        <span className={value ? "" : "ph-text"}>{value ? label(value) : "Pilih tanggal & jam"}</span>
      </button>

      {open && (
        <div id={popId} ref={pop} role="dialog" aria-label="Pilih tanggal dan jam" className={`dtp-pop${up ? " up" : ""}`}>
          <div className="dtp-head">
            <button type="button" className="dtp-nav" onClick={() => shift(-1)} aria-label="Bulan sebelumnya"><span style={{ transform: "rotate(90deg)", display: "grid" }}><IconChevron /></span></button>
            <b>{MONTHS[view.m]} {view.y}</b>
            <button type="button" className="dtp-nav" onClick={() => shift(1)} aria-label="Bulan berikutnya"><span style={{ transform: "rotate(-90deg)", display: "grid" }}><IconChevron /></span></button>
          </div>
          <div className="dtp-body">
            <div className="dtp-grid" role="grid">
              {HEAD.map((h) => <span key={h} className="dtp-wd" role="columnheader">{h}</span>)}
              {cells.map((d, i) =>
                d === null ? <span key={`b${i}`} /> : (
                  <button
                    key={d}
                    type="button"
                    className={`dtp-day${isSel(d) ? " on" : ""}${isToday(d) ? " today" : ""}`}
                    aria-pressed={isSel(d)}
                    aria-label={`${d} ${MONTHS[view.m]} ${view.y}`}
                    onClick={() => pickDay(d)}
                  >{d}</button>
                ),
              )}
            </div>
            <div className="dtp-time">
              <div className="dtp-tcol">
                <span className="dtp-tl">Jam</span>
                <TimeCol values={HOURS} current={value ? value.h : null} label="Jam" onPick={(h) => setValue({ ...base(), h })} />
              </div>
              <div className="dtp-tcol">
                <span className="dtp-tl">Menit</span>
                <TimeCol values={MINUTES} current={value ? value.min : null} label="Menit" onPick={(min) => setValue({ ...base(), min })} />
              </div>
            </div>
          </div>
          <div className="dtp-foot">
            <button type="button" className="btn btn-g btn-sm" onClick={goToday}>Hari ini</button>
            <button type="button" className="btn btn-p btn-sm" onClick={() => { setOpen(false); btn.current?.focus(); }}>Selesai</button>
          </div>
        </div>
      )}
    </div>
  );
}
