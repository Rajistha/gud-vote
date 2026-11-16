"use client";

import { useEffect, type RefObject } from "react";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Menjaga fokus keyboard tetap di dalam dialog selama terbuka (Tab berputar di dalamnya),
 * memindahkan fokus awal ke elemen `initial`, dan mengembalikannya ke pemicu saat ditutup.
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean, initial?: string) {
  useEffect(() => {
    const root = ref.current;
    if (!active || !root) return;
    const previous = document.activeElement as HTMLElement | null;
    (initial ? root.querySelector<HTMLElement>(initial) : root.querySelector<HTMLElement>(FOCUSABLE))?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const items = [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [active, ref, initial]);
}
