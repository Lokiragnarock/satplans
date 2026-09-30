"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/events", label: "Events" },
  { href: "/challenges", label: "Challenges" },
];

export function Nav({ name }: { name: string }) {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-2 px-4 py-3">
        <nav className="flex gap-1">
          {links.map((l) => {
            const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${active ? "bg-zinc-800 text-white" : "text-zinc-400"}`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <span className="truncate text-xs text-zinc-500">{name}</span>
      </div>
    </header>
  );
}
