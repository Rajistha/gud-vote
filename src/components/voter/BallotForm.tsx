"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFocusTrap } from "@/components/ui/useFocusTrap";
import { castVote, type FormState } from "@/app/(voter)/actions";
import { IconInfo } from "@/components/icons";
import { useResultToast } from "@/components/ui/Toast";

export type BallotCandidate = { id: string; number: number; name: string; theme: string };

export function BallotForm({ candidates, allowBlank }: { candidates: BallotCandidate[]; allowBlank: boolean }) {
  const [choice, setChoice] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(castVote, undefined);

  useResultToast(state);
  const sheet = useRef<HTMLDivElement>(null);
  useFocusTrap(sheet, open, ".btn-g");
  const picked = choice === "blank" ? null : candidates.find((c) => c.id === choice);
  const label = choice === "blank" ? "Kotak kosong" : picked ? `Paslon 0${picked.number}` : null;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !pending) setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, pending]);

  return (
    <form action={action} style={{ display: "contents" }}>
      <input type="hidden" name="choice" value={choice ?? ""} />

      <div role="radiogroup" aria-label="Pilih pasangan calon" className="opt-grid">
        {candidates.map((c) => (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={choice === c.id}
            className={`opt ${c.theme}`}
            onClick={() => setChoice(c.id)}
          >
            <div className="nb">{c.number}</div>
            <div className="meta"><b>{c.name}</b><span>paslon {String(c.number).padStart(2, "0")}</span></div>
            <div className="tick"><span className="radio" /></div>
          </button>
        ))}
        {allowBlank && (
          <button type="button" role="radio" aria-checked={choice === "blank"} className="opt blank pc0" onClick={() => setChoice("blank")}>
            <div className="nb">–</div>
            <div className="meta"><b>Kotak kosong</b><span>tidak memilih pasangan calon mana pun</span></div>
            <div className="tick"><span className="radio" /></div>
          </button>
        )}
      </div>

      <div className="dock">
        {!open && state?.error && <div className="err-msg" role="alert" style={{ margin: "0 0 10px" }}>{state.error}</div>}
        <button type="button" className="btn btn-p btn-block" disabled={!choice} onClick={() => setOpen(true)}>
          {label ? `Pilih ${label.toLowerCase()}` : "Pilih satu pasangan calon"}
        </button>
        <small>Suara Anda bersifat rahasia</small>
      </div>

      {open && (
        <div className="scrim" onClick={() => !pending && setOpen(false)}>
          <div className="sheet" ref={sheet} role="dialog" aria-modal="true" aria-labelledby="confirm-title" onClick={(e) => e.stopPropagation()}>
            <div className="grab" />
            <h2 id="confirm-title">konfirmasi pilihan Anda</h2>
            <div className={`pick ${picked ? picked.theme : "pc0"}`}>
              <div className="nb">{picked ? picked.number : "–"}</div>
              <div className="t">
                <small>{picked ? `paslon 0${picked.number}` : "kotak kosong"}</small>
                <b>{picked ? picked.name : "Tidak memilih pasangan calon mana pun"}</b>
              </div>
            </div>
            {state?.error && <div className="err-msg" role="alert" style={{ margin: "0 0 12px" }}>{state.error}</div>}
            <div className="warn"><IconInfo size={16} /><span>Suara yang telah dikirim <b>tidak dapat diubah atau dibatalkan</b>.</span></div>
            <div className="row">
              <button type="button" className="btn btn-g" onClick={() => setOpen(false)} disabled={pending}>Kembali</button>
              <button type="submit" className="btn btn-p" disabled={pending}>{pending ? "Mengirim…" : "Kirim suara"}</button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
