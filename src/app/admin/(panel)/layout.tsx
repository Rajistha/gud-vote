import Image from "next/image";
import { requireAdmin } from "@/lib/session";
import { AdminNav, type NavItem } from "@/components/admin/AdminNav";
import { IconLogout } from "@/components/icons";
import { Tooltip } from "@/components/ui/Tooltip";
import { logout } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Panel panitia · GUD Vote" };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  const items: NavItem[] = [
    { href: "/admin", label: "Dashboard", short: "Beranda", icon: "chart" },
    { href: "/admin/paslon", label: "Paslon", short: "Paslon", icon: "vote" },
    { href: "/admin/jadwal", label: "Jadwal", short: "Jadwal", icon: "cal" },
    { href: "/admin/rekap", label: "Rekap & Ekspor", short: "Rekap", icon: "file" },
    { href: "/admin/audit", label: "Audit Log", short: "Audit", icon: "log" },
  ];

  return (
    <div className="adm">
      <aside className="side">
        <div className="brand">
          <Image src="/logo-gud.png" alt="Logo Girl Up Diponegoro" width={38} height={46} />
          <div><b>GUD Vote</b><small>Panel Panitia</small></div>
        </div>
        <AdminNav items={items} />
        <div className="me">
          <div className="me-top">
            <span className="avatar" aria-hidden="true">{(admin.name ?? admin.email).charAt(0)}</span>
            <div className="me-id">
              <b title={admin.name ?? undefined}>{admin.name ?? admin.email.split("@")[0]}</b>
              <small title={admin.email}>{admin.email}</small>
            </div>
          </div>
          <form action={logout}>
            <Tooltip text="Akhiri sesi di perangkat ini" side="right">
              <button className="btn btn-g btn-sm"><IconLogout />Keluar</button>
            </Tooltip>
          </form>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
