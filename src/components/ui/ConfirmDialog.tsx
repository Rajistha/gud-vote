"use client";

import { useEffect, useRef, useState } from "react";
import { IconAlert } from "@/components/icons";
import { useFocusTrap } from "./useFocusTrap";

/**
 * Tombol yang meminta konfirmasi lewat dialog kustom (pengganti window.confirm)
 * lalu mengirim form tempat tombol ini berada.
 */
export function ConfirmSubmit({
  children, title, description, confirmLabel = "Ya, lanjutkan", tone = "danger", className = "btn btn-g btn-sm", disabled,
}: {
  children: React.ReactNode;
  title: string;
  description: string;
  confirmLabel?: string;
  tone?: "danger" | "primary";
  className?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const box = useRef<HTMLDivElement>(null);

  // Fokus awal di "Batal" (aksi aman) agar Enter tidak menjalankan aksi berbahaya secara tidak sengaja;
  // Tab berputar di dalam dialog dan fokus kembali ke tombol pemicu saat ditutup.
  useFocusTrap(box, open, ".btn-g");
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open]);

  function close() {
    setOpen(false);
  }

  function go() {
    setOpen(false);
    trigger.current?.form?.requestSubmit();
  }

  return (
    <>
      <button type="button" ref={trigger} className={className} disabled={disabled} onClick={() => setOpen(true)}>{children}</button>
      {open && (
        <div className="scrim center" onClick={close}>
          <div className="dialog" ref={box} role="alertdialog" aria-modal="true" aria-labelledby="dlg-t" aria-describedby="dlg-d" onClick={(e) => e.stopPropagation()}>
            <div className={`dialog-ic ${tone}`}><IconAlert size={22} /></div>
            <h2 id="dlg-t">{title}</h2>
            <p id="dlg-d">{description}</p>
            <div className="dialog-row">
              <button type="button" className="btn btn-g" onClick={close}>Batal</button>
              <button type="button" className={`btn ${tone === "danger" ? "btn-danger" : "btn-p"}`} onClick={go}>{confirmLabel}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
