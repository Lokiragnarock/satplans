import type { ButtonHTMLAttributes, ReactNode } from "react";

export type Accent = "orange" | "cyan" | "green" | "peach";

export const accentStyle: Record<Accent, { text: string; bg: string; btn: string; glow: string; tile: string }> = {
  orange: {
    text: "text-primary-container",
    bg: "bg-primary-container",
    btn: "bg-primary-container text-on-primary-container",
    glow: "shadow-[0_0_12px_rgba(255,107,26,0.55)]",
    tile: "bg-primary-container/15 text-primary-container",
  },
  cyan: {
    text: "text-secondary",
    bg: "bg-secondary-container",
    btn: "bg-secondary-container text-on-secondary",
    glow: "shadow-[0_0_12px_rgba(0,203,230,0.5)]",
    tile: "bg-secondary-container/15 text-secondary",
  },
  green: {
    text: "text-tertiary",
    bg: "bg-tertiary",
    btn: "bg-tertiary text-on-tertiary",
    glow: "shadow-[0_0_12px_rgba(77,224,130,0.5)]",
    tile: "bg-tertiary/15 text-tertiary",
  },
  peach: {
    text: "text-primary",
    bg: "bg-primary",
    btn: "bg-primary text-on-primary",
    glow: "shadow-[0_0_12px_rgba(255,181,150,0.45)]",
    tile: "bg-primary/15 text-primary",
  },
};

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const letters = parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0];
  return letters.toUpperCase();
}

export function Icon({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span aria-hidden className={`material-symbols-outlined ${className}`}>
      {name}
    </span>
  );
}

export function Card({ title, icon, children }: { title?: string; icon?: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-white/5 bg-surface-container p-4">
      {title && (
        <h2 className="label-md mb-3 flex items-center gap-2 text-on-surface-variant">
          {icon && <Icon name={icon} className="!text-[18px] text-primary-container" />}
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" | "cyan" | "green" }) {
  const styles = {
    primary: "bg-primary-container text-on-primary-container hover:brightness-110",
    cyan: "bg-secondary-container text-on-secondary hover:brightness-110",
    green: "bg-tertiary text-on-tertiary hover:brightness-110",
    ghost: "border border-outline/40 text-on-surface hover:bg-surface-container-high",
    danger: "bg-error text-[#690005] hover:brightness-110",
  }[variant];
  return (
    <button
      {...props}
      className={`label-md rounded-lg px-4 py-2.5 !text-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${styles} ${className}`}
    />
  );
}

export function ProgressBar({
  pct,
  accent = "orange",
  thin = false,
}: {
  pct: number;
  accent?: Accent;
  thin?: boolean;
}) {
  const a = accentStyle[accent];
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`${thin ? "h-1.5" : "h-4"} w-full overflow-hidden rounded-full bg-surface-container-lowest`}
    >
      <div className={`h-full rounded-full transition-all ${a.bg} ${a.glow}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function ErrorNote({ message }: { message: string | null }) {
  return message ? <p className="rounded-lg bg-error/15 px-3 py-2 text-sm text-error">{message}</p> : null;
}

export function LoadingNote({ message }: { message: string | null }) {
  return <p className="label-md text-on-surface-variant/70">{message ?? "Loading"}</p>;
}

export const inputClass =
  "w-full rounded-lg border border-white/10 bg-surface-container-lowest px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface/40 focus:border-primary-container focus:outline-none";
