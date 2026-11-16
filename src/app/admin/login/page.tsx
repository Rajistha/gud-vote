import Image from "next/image";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import { getAdmin } from "@/lib/session";
import { LoginForm } from "@/components/admin/LoginForm";
import { Select } from "@/components/ui/Select";
import { devLogin } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Masuk panitia · GUD Vote" };

export default async function AdminLogin() {
  if (await getAdmin()) redirect("/admin");

  const dev = process.env.NODE_ENV !== "production" && process.env.DEV_ADMIN_LOGIN === "1";
  const admins = dev ? await query<{ id: string; email: string }>("SELECT id, email FROM admins ORDER BY email") : [];

  return (
    <main style={{ padding: "0 16px" }}>
      <div className="login-card">
        <Image src="/logo-gud.png" alt="Logo Girl Up Diponegoro" width={84} height={100} />
        <h1 className="d" style={{ fontSize: 44, margin: "18px 0 8px" }}>Panel <span className="mk">Panitia</span></h1>
        <p className="muted" style={{ margin: "0 0 20px" }}>Khusus panitia pemilihan. Pemilih tidak perlu masuk.</p>

        <LoginForm />

        {dev && (
          <form action={devLogin} style={{ marginTop: 22, paddingTop: 18, borderTop: "1.5px dashed var(--ink-3)" }}>
            <div className="chip chip-warn" style={{ marginBottom: 10 }}>Mode Pengembangan</div>
            <div className="field">
              <label htmlFor="admin">Masuk sebagai</label>
              <Select id="admin" name="admin" options={admins.map((a) => ({ value: a.id, label: a.email }))} />
            </div>
            <button className="btn btn-g btn-block" style={{ marginTop: 12 }}>Masuk (dev)</button>
          </form>
        )}
      </div>
    </main>
  );
}
