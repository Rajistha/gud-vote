import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { AddAdminForm } from "@/components/admin/forms";
import { ConfirmSubmit } from "@/components/ui/ConfirmDialog";
import { FlashToast } from "@/components/ui/Toast";
import { removeAdmin } from "../actions";

export const dynamic = "force-dynamic";

const MSG: Record<string, ["success" | "error", string]> = {
  removed: ["success", "Panitia dihapus."],
  self: ["error", "Anda tidak bisa menghapus akun sendiri."],
  hasdata: ["error", "Panitia ini sudah punya riwayat aktivitas, tidak bisa dihapus (jejak audit)."],
};

export default async function Panitia(props: PageProps<"/admin/panitia">) {
  const me = await requireAdmin();
  const sp = await props.searchParams;
  const flash = typeof sp.msg === "string" ? MSG[sp.msg] : undefined;
  const admins = await query<{ id: string; email: string; name: string | null }>(
    "SELECT id, email, name FROM admins ORDER BY email",
  );

  return (
    <>
      {flash && <FlashToast key={String(sp.msg)} kind={flash[0]} message={flash[1]} />}
      <div className="main-h"><h1 className="d lc">panitia <span className="mk">&amp; akses</span></h1></div>
      <div className="g2" style={{ "--cols": "1.3fr 1fr", alignItems: "start" } as React.CSSProperties}>
        <div className="panel" style={{ padding: 8 }}>
          <table className="tbl stack">
            <thead><tr><th>Nama</th><th>Email</th><th /></tr></thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.id}>
                  <td><b>{a.name ?? "–"}</b></td>
                  <td className="mono">{a.email}</td>
                  <td style={{ textAlign: "right" }}>
                    {a.id !== me.id && (
                      <form action={removeAdmin.bind(null, a.id)}>
                        <ConfirmSubmit
                          title="Hapus panitia ini?"
                          description={`${a.email} tidak akan dapat masuk ke panel lagi.`}
                          confirmLabel="Ya, hapus"
                        >Hapus</ConfirmSubmit>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <AddAdminForm />
      </div>
      <p className="muted" style={{ fontSize: 13 }}>Panitia masuk dengan email dan password. Hanya email yang terdaftar di daftar ini yang dapat mengakses panel.</p>
    </>
  );
}
