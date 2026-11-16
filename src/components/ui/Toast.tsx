"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { IconAlert, IconCheck, IconClose, IconInfo } from "@/components/icons";

type Kind = "success" | "error" | "info";
type ToastInput = { kind?: Kind; message: string; title?: string; duration?: number };
type Item = Required<Pick<ToastInput, "kind" | "message">> & { id: number; title?: string };
type Result = { ok?: string; error?: string } | undefined;

const Ctx = createContext<((t: ToastInput) => void) | null>(null);

const TITLES: Record<Kind, string> = { success: "Berhasil", error: "Gagal", info: "Info" };

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const seq = useRef(0);

  const dismiss = useCallback((id: number) => setItems((xs) => xs.filter((x) => x.id !== id)), []);

  const push = useCallback((t: ToastInput) => {
    const id = ++seq.current;
    const kind = t.kind ?? "info";
    setItems((xs) => [...xs.slice(-3), { id, kind, message: t.message, title: t.title }]);
    window.setTimeout(() => dismiss(id), t.duration ?? (kind === "error" ? 7000 : 4500));
  }, [dismiss]);

  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="toasts" role="region" aria-label="Notifikasi">
        {items.map((t) => (
          <div key={t.id} className={`toast toast-${t.kind}`} role={t.kind === "error" ? "alert" : "status"}>
            <span className="toast-ic" aria-hidden="true">
              {t.kind === "success" ? <IconCheck /> : t.kind === "error" ? <IconAlert /> : <IconInfo />}
            </span>
            <div className="toast-tx"><b>{t.title ?? TITLES[t.kind]}</b><span>{t.message}</span></div>
            <button type="button" className="toast-x" onClick={() => dismiss(t.id)} aria-label="Tutup notifikasi"><IconClose size={14} /></button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const push = useContext(Ctx);
  if (!push) throw new Error("useToast harus dipakai di dalam ToastProvider.");
  return push;
}

/** Menampilkan hasil server action ({ ok } / { error }) sebagai toast. */
export function useNotify() {
  const push = useToast();
  return useCallback((r: Result) => {
    if (r?.ok) push({ kind: "success", message: r.ok });
    else if (r?.error) push({ kind: "error", message: r.error });
  }, [push]);
}

/** Toast otomatis tiap kali hasil useActionState berubah. */
export function useResultToast(state: Result) {
  const notify = useNotify();
  useEffect(() => { notify(state); }, [state, notify]);
}

/** Dipakai halaman server untuk pesan hasil redirect (?msg=…): tampil sekali lalu URL dibersihkan. */
export function FlashToast({ kind, message }: { kind: Kind; message: string }) {
  const push = useToast();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    push({ kind, message });
    window.history.replaceState(null, "", window.location.pathname);
  }, [kind, message, push]);
  return null;
}
