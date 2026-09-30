"use client";

import { useState } from "react";
import { Button, Card, ProgressBar, inputClass } from "./ui";
import { progress } from "@/lib/window";
import type { GroupTarget } from "@/lib/types";

interface Props {
  targets: GroupTarget[];
  busy: boolean;
  isAdmin: boolean;
  templateLoaded: boolean;
  onLog: (targetId: string, amount: number) => void;
  onLoadTemplate: () => void;
}

function LogForm({ unit, busy, onLog }: { unit: string; busy: boolean; onLog: (n: number) => void }) {
  const [value, setValue] = useState("");
  return (
    <form
      className="mt-2 flex gap-2"
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
      <Button type="submit" variant="ghost" disabled={busy}>
        Log
      </Button>
    </form>
  );
}

export function TargetsPanel({ targets, busy, isAdmin, templateLoaded, onLog, onLoadTemplate }: Props) {
  return (
    <Card title="Group targets">
      {targets.length === 0 && <p className="text-sm text-zinc-500">No targets yet.</p>}
      <div className="space-y-5">
        {targets.map((t) => {
          const p = progress(t.progress, t.goal);
          return (
            <div key={t.id}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-medium">{t.label}</span>
                <span className="text-zinc-400">
                  {t.progress.toLocaleString("en-US")} / {t.goal.toLocaleString("en-US")} {t.unit}
                </span>
              </div>
              <ProgressBar pct={p.pct} />
              <LogForm unit={t.unit} busy={busy} onLog={(n) => onLog(t.id, n)} />
            </div>
          );
        })}
      </div>
      {isAdmin && !templateLoaded && (
        <Button className="mt-4 w-full" variant="ghost" disabled={busy} onClick={onLoadTemplate}>
          Load Saturday template
        </Button>
      )}
    </Card>
  );
}
