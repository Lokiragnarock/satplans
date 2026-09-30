"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, initialsOf } from "./ui";

const tabs = [
  { href: "/", label: "Home", icon: "local_fire_department" },
  { href: "/events", label: "Events", icon: "confirmation_number" },
  { href: "/challenges", label: "Duels", icon: "swords" },
];

function pageName(path: string): string {
  if (path === "/") return "Home";
  if (path.startsWith("/events/")) return "Event";
  if (path.startsWith("/events")) return "Events";
  if (path.startsWith("/challenges")) return "Duels";
  return "";
}

export function Nav({ name }: { name: string }) {
  const path = usePathname();
  return (
    <header className="fixed inset-x-0 top-0 z-20 h-16 bg-surface/90 shadow-[0_2px_16px_rgba(0,0,0,0.4)] backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-2xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
            <Icon name="sports_basketball" />
          </span>
          <div className="leading-none">
            <p className="label-md text-primary-container">Ballin on Sats</p>
            <p className="mt-1 text-xs text-on-surface/50">{pageName(path)}</p>
          </div>
        </div>
        <span
          title={name}
          className="label-lg flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-highest text-on-surface"
        >
          {initialsOf(name)}
        </span>
      </div>
    </header>
  );
}

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 h-16 bg-surface-container-lowest/95 shadow-[0_-2px_16px_rgba(0,0,0,0.5)] backdrop-blur-md">
      <div className="mx-auto grid h-full max-w-2xl grid-cols-3">
        {tabs.map((t) => {
          const active = t.href === "/" ? path === "/" : path.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center justify-center gap-0.5 ${active ? "text-primary-container" : "text-on-surface-variant"}`}
            >
              <Icon name={t.icon} />
              <span className="label-sm">{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
