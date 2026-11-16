"use client";

import { useActionState } from "react";
import { signIn, type LoginState } from "@/app/admin/login/actions";
import { useResultToast } from "@/components/ui/Toast";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, undefined);
  useResultToast(state);
  return (
    <form action={action} noValidate style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="username" className="input" />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" className="input" />
      </div>
      {state?.error && <div className="err-msg" role="alert" style={{ margin: 0 }}>{state.error}</div>}
      <button className="btn btn-p btn-block" disabled={pending}>{pending ? "Memeriksa…" : "Masuk"}</button>
    </form>
  );
}
