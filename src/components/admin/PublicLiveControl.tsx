"use client";

import { useState, useTransition } from "react";
import { setPublicLive } from "@/app/admin/(panel)/actions";
import { useNotify } from "@/components/ui/Toast";
import { Tooltip } from "@/components/ui/Tooltip";

/** Kontrol cepat layar live count publik (/live). */
export function PublicLiveControl({ initial }: { initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [pending, start] = useTransition();
  const notify = useNotify();

  function toggle() {
    start(async () => {
      const r = await setPublicLive(!on);
      notify(r);
      if (r.on !== undefined) setOn(r.on);
    });
  }

  return (
    <div className="live-ctl">
      <Tooltip text={on ? "Halaman /live sedang tampil ke publik." : "Halaman /live belum ditampilkan ke publik."} side="bottom">
        <span className={`live-state${on ? " on" : ""}`} tabIndex={0}>Layar publik: <b>{on ? "aktif" : "nonaktif"}</b></span>
      </Tooltip>
      <button type="button" className={`btn btn-sm ${on ? "btn-g" : "btn-s"}`} disabled={pending} onClick={toggle}>
        {pending ? "Menyimpan…" : on ? "Sembunyikan" : "Tampilkan ke publik"}
      </button>
      <a className="btn btn-g btn-sm" href="/live" target="_blank" rel="noopener noreferrer">Buka layar ↗</a>
    </div>
  );
}
