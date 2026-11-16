"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconCal, IconChart, IconFile, IconLog, IconUsers, IconVote } from "@/components/icons";

const ICONS = { chart: IconChart, users: IconUsers, vote: IconVote, cal: IconCal, file: IconFile, log: IconLog } as const;
export type NavItem = { href: string; label: string; icon: keyof typeof ICONS };

export function AdminNav({ items }: { items: NavItem[] }) {
  const path = usePathname();
  return (
    <>
      {items.map((it) => {
        const Icon = ICONS[it.icon];
        const on = it.href === "/admin" ? path === "/admin" : path.startsWith(it.href);
        return (
          <Link key={it.href} href={it.href} className={`nav${on ? " on" : ""}`} aria-current={on ? "page" : undefined}>
            <Icon />{it.label}
          </Link>
        );
      })}
    </>
  );
}
