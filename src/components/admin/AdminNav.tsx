"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { IconCal, IconChart, IconFile, IconLog, IconUsers, IconVote } from "@/components/icons";

const ICONS = { chart: IconChart, users: IconUsers, vote: IconVote, cal: IconCal, file: IconFile, log: IconLog } as const;
export type NavItem = { href: string; label: string; icon: keyof typeof ICONS };

export function AdminNav({ items }: { items: NavItem[] }) {
  const path = usePathname();
  const box = useRef<HTMLElement>(null);

  // Di HP menu berupa baris yang bisa digeser: pastikan menu aktif selalu terlihat.
  useEffect(() => {
    const on = box.current?.querySelector<HTMLElement>(".nav.on");
    if (on && box.current && box.current.scrollWidth > box.current.clientWidth) {
      box.current.scrollTo({ left: on.offsetLeft - 12, behavior: "smooth" });
    }
  }, [path]);

  return (
    <nav className="navs" ref={box} aria-label="Menu panitia">
      {items.map((it) => {
        const Icon = ICONS[it.icon];
        const on = it.href === "/admin" ? path === "/admin" : path.startsWith(it.href);
        return (
          <Link key={it.href} href={it.href} className={`nav${on ? " on" : ""}`} aria-current={on ? "page" : undefined}>
            <Icon />{it.label}
          </Link>
        );
      })}
    </nav>
  );
}
