"use client";

import { useState } from "react";
import { Button, Icon, ProgressBar, accentStyle, inputClass } from "./ui";
import type { Accent } from "./ui";
import { progress } from "@/lib/window";
import type { GroupTarget } from "@/lib/types";

interface Props {
  targets: GroupTarget[];
  busy: boolean;
  isAdmin: boolean;
  locked: boolean;
  templateLoaded: boolean;
  onLog: (targetId: string, amount: number) => void;
  onLoadTemplate: () => void;
}

function styleFor(label: string): { accent: Accent; icon: string } {
  const l = label.toLowerCase();
  if (l.includes("run")) return { accent: "cyan", icon: "directions_run" };
  if (l.includes("squat")) return { accent: "orange", icon: "fitness_center" };
  if (l.includes("throw") || l.includes("shot")) return { accent: "green", icon: "sports_basketball" };
  if (l.includes("bottle")) return { accent: "peach", icon: "water_drop" };
  return { accent: "peach", icon: "flag" };
}

function LogForm({ unit, accent, busy, onLog }: { unit: string; accent: Accent; busy: boolean; onLog: (n: number) => void }) {
  const [value, setValue] = useState("");
  return (
    <form
      className="mt-3 flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const n = Number(value);
        if (n > 0) onLog(n);
        setValue("");
      }}
    >
      <input
        className={inputClass}
        type="number"
        min="0"
        step="any"
        inputMode="decimal"
        placeholder={`Add ${unit}`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button
        type="submit"
        disabled={busy}
        className={`label-md shrink-0 rounded-lg px-4 !text-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${accentStyle[accent].btn}`}
      >
        + Log
      </button>
    </form>
  );
}

export function TargetsPanel({ targets, busy, isAdmin, locked, templateLoaded, onLog, onLoadTemplate }: Props) {
  return (
    <section>
      <h2 className="label-md mb-3 flex items-center gap-2 text-on-surface-variant">
        <Icon name="flag" className="!text-[18px] text-primary-container" />
        Team targets
      </h2>
      {targets.length === 0 && <p className="text-sm text-on-surface-variant/70">No targets yet.</p>}
      <div className="flex flex-col gap-3">
        {targets.map((t) => {
          const p = progress(t.progress, t.goal);
          const { accent, icon } = styleFor(t.label);
          const a = accentStyle[accent];
          return (
            <div key={t.id} className="rounded-xl border border-white/5 bg-surface-container p-4">
              <div className="flex items-center gap-3">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${a.tile}`}>
                  <Icon name={icon} />
                </span>
                <div className="min-w-0">
                  <p className="label-md text-on-surface-variant">{t.label}</p>
                  <p className="scoreboard-title">
                    <span className={a.text}>{t.progress.toLocaleString("en-US")}</span>
                    <span className="text-on-surface/40">
                      {" "}
                      / {t.goal.toLocaleString("en-US")} {t.unit}
                    </span>
                  </p>
                </div>
              </div>
              <LogForm unit={t.unit} accent={accent} busy={busy || locked} onLog={(n) => onLog(t.id, n)} />
              <div className="mt-3">
                <ProgressBar pct={p.pct} accent={accent} />
              </div>
            </div>
          );
        })}
      </div>
      {isAdmin && !templateLoaded && !locked && (
        <Button className="mt-4 w-full" variant="ghost" disabled={busy} onClick={onLoadTemplate}>
          Load Saturday template
        </Button>
      )}
    </section>
  );
}
