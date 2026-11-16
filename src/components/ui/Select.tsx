"use client";

import { useEffect, useId, useRef, useState } from "react";
import { IconCheck, IconChevron } from "@/components/icons";

export type Option = { value: string; label: string };

/** Dropdown kustom (pengganti <select>). Nilainya ikut terkirim lewat input tersembunyi. */
export function Select({
  name, options, defaultValue, id, disabled, onChange, placeholder = "Pilih…", className = "",
}: {
  name?: string;
  options: Option[];
  defaultValue?: string;
  id?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [value, setValue] = useState(defaultValue ?? options[0]?.value ?? "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [up, setUp] = useState(false);
  const [maxH, setMaxH] = useState(240);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.findIndex((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [open]);

  useEffect(() => {
    if (open) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [open, active, listId]);

  /** Hitung arah buka & tinggi daftar dari ruang kosong di layar, supaya tidak terpotong. */
  function place() {
    const r = root.current?.getBoundingClientRect();
    if (!r) return;
    const below = window.innerHeight - r.bottom - 16;
    const above = r.top - 16;
    const flip = below < 220 && above > below;
    setUp(flip);
    setMaxH(Math.max(120, Math.min(240, flip ? above : below)));
  }

  function toggle() {
    if (disabled) return;
    if (!open) { place(); setActive(selected >= 0 ? selected : 0); }
    setOpen(!open);
  }

  function choose(i: number) {
    const o = options[i];
    if (!o) return;
    setValue(o.value);
    setOpen(false);
    onChange?.(o.value);
  }

  function onKey(e: React.KeyboardEvent) {
    if (disabled) return;
    const last = options.length - 1;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) { place(); setActive(selected >= 0 ? selected : 0); setOpen(true); return; }
      setActive((a) => Math.min(last, Math.max(0, a + (e.key === "ArrowDown" ? 1 : -1))));
    } else if (e.key === "Home" && open) { e.preventDefault(); setActive(0); }
    else if (e.key === "End" && open) { e.preventDefault(); setActive(last); }
    else if ((e.key === "Enter" || e.key === " ") && open) { e.preventDefault(); choose(active); }
    else if (e.key === "Escape" && open) { e.preventDefault(); e.stopPropagation(); setOpen(false); }
    else if (e.key === "Tab") setOpen(false);
  }

  return (
    <div className={`sel ${className}`} ref={root}>
      {name && <input type="hidden" name={name} value={value} />}
      <button
        type="button"
        id={id}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        className="input sel-btn"
        disabled={disabled}
        onClick={toggle}
        onKeyDown={onKey}
      >
        <span className="sel-val">{options[selected]?.label ?? placeholder}</span>
        <span className={`sel-chev${open ? " up" : ""}`}><IconChevron /></span>
      </button>
      {open && (
        <ul id={listId} role="listbox" className={`sel-list${up ? " up" : ""}`} style={{ maxHeight: maxH }}>
          {options.map((o, i) => (
            <li
              key={o.value}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === selected}
              data-active={i === active}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(i)}
            >
              <span>{o.label}</span>
              {i === selected && <IconCheck />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
