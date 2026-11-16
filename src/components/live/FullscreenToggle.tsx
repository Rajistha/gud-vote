"use client";

import { useEffect, useState } from "react";
import { IconExitFullscreen, IconFullscreen } from "@/components/icons";

/** Tombol ikon layar penuh untuk halaman yang ditampilkan di layar besar. */
export function FullscreenToggle() {
  const [full, setFull] = useState(false);

  useEffect(() => {
    const on = () => setFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);

  function toggle() {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.().catch(() => {});
  }

  return (
    <button type="button" className="lv-fs" onClick={toggle} aria-label={full ? "Keluar dari layar penuh" : "Layar penuh"}>
      {full ? <IconExitFullscreen /> : <IconFullscreen />}
    </button>
  );
}
