"use client";

import { useActionState } from "react";
import { enterVenueCode, type FormState } from "@/app/(voter)/actions";
import { useResultToast } from "@/components/ui/Toast";

export function VenueForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(enterVenueCode, undefined);
  useResultToast(state);
  return (
    <form action={action} noValidate style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="field">
        <label htmlFor="code">Kode lokasi</label>
        <input id="code" name="code" className="input" autoComplete="off" autoCapitalize="characters" inputMode="text" placeholder="Kode dari panitia" />
      </div>
      {state?.error && <div className="err-msg" role="alert">{state.error}</div>}
      <button className="btn btn-p btn-block" disabled={pending}>{pending ? "Memeriksa…" : "Lanjut"}</button>
    </form>
  );
}
