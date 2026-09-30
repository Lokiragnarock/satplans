"use client";

import { useState } from "react";
import { Icon, inputClass } from "./ui";
import { formatDuration } from "@/lib/window";

interface Props {
  startedAt: string | null;
  now: Date;
  busy: boolean;
  locked: string | null;
  onClockIn: (note: string) => void;
  onClockOut: (note: string) => void;
}

export function ClockPanel({ startedAt, now, busy, locked, onClockIn, onClockOut }: Props) {
  const [note, setNote] = useState("");
  const submit = () => {
    (startedAt ? onClockOut : onClockIn)(note);
    setNote("");
  };
  return (
    <section className="flex flex-col gap-3">
      <button
        type="button"
        disabled={busy || locked !== null}
        onClick={submit}
        className={`label-lg flex h-[54px] w-full items-center justify-center gap-2 rounded-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${
          locked
            ? "bg-surface-container-high text-on-surface-variant"
            : startedAt
            ? "bg-tertiary text-on-tertiary shadow-[0_0_20px_rgba(77,224,130,0.4)]"
            : "bg-primary-container text-on-primary-container shadow-[0_0_20px_rgba(255,107,26,0.45)]"
        }`}
      >
        <Icon name={locked ? "lock" : startedAt ? "stop_circle" : "timer"} />
        {locked ? (
          "Clock locked"
        ) : startedAt ? (
          <>
            <span>Clock out (grinding live)</span>
            <span className="tabular-nums">{formatDuration(now.getTime() - new Date(startedAt).getTime())}</span>
          </>
        ) : (
          "Tap to clock in"
        )}
      </button>
      <p className="label-sm text-center text-on-surface-variant">{locked ?? (startedAt ? "Clocked in now" : "Clocked out")}</p>
      <label className="flex items-center gap-2 rounded-full border border-white/10 bg-surface-container-lowest px-4">
        <Icon name="edit_note" className="text-on-surface-variant" />
        <input
          className={`${inputClass} !border-0 !bg-transparent !px-0 focus:!outline-none`}
          placeholder="Note (optional)"
          value={note}
          disabled={locked !== null}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>
    </section>
  );
}
