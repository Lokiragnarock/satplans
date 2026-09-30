"use client";

import { useState } from "react";
import { Button, Card, inputClass } from "./ui";
import { formatDuration } from "@/lib/window";

interface Props {
  startedAt: string | null;
  now: Date;
  busy: boolean;
  onClockIn: (note: string) => void;
  onClockOut: (note: string) => void;
}

export function ClockPanel({ startedAt, now, busy, onClockIn, onClockOut }: Props) {
  const [note, setNote] = useState("");
  const submit = () => {
    (startedAt ? onClockOut : onClockIn)(note);
    setNote("");
  };
  return (
    <Card title="Clock">
      <div className="mb-3 text-center font-mono text-4xl tabular-nums">
        {startedAt ? formatDuration(now.getTime() - new Date(startedAt).getTime()) : "00:00"}
      </div>
      <input
        className={`${inputClass} mb-3`}
        placeholder="Note (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <Button className="w-full" variant={startedAt ? "danger" : "primary"} disabled={busy} onClick={submit}>
        {startedAt ? "Clock out" : "Clock in"}
      </Button>
    </Card>
  );
}
