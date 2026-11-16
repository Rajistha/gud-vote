"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconCal, IconChart, IconFile, IconLog, IconUsers, IconVote } from "@/components/icons";

const ICONS = { chart: IconChart, users: IconUsers, vote: IconVote, cal: IconCal, file: IconFile, log: IconLog } as const;
export type NavItem = { href: string; label: string; short: string; icon: keyof typeof ICONS };

/** Menu panel: sidebar di layar lebar, bilah bawah di HP dan tablet. */
export function AdminNav({ items }: { items: NavItem[] }) {
  const path = usePathname();
  return (
    <nav className="navs" aria-label="Menu panitia">
      {items.map((it) => {
        const Icon = ICONS[it.icon];
        const on = it.href === "/admin" ? path === "/admin" : path.startsWith(it.href);
        return (
          <Link key={it.href} href={it.href} className={`nav${on ? " on" : ""}`} aria-current={on ? "page" : undefined}>
            <Icon />
            <span className="lbl">{it.label}</span>
            <span className="lbl-s" aria-hidden="true">{it.short}</span>
          </Link>
        );
      })}
    </nav>
  );
}
