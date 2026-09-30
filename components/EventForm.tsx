"use client";

import { useState } from "react";
import { Button, Card, inputClass } from "./ui";

interface Props {
  busy: boolean;
  locked: string | null;
  onCreate: (input: { title: string; spot: string; scheduledAt: string; minAttendees: number }) => Promise<boolean>;
}

export function EventForm({ busy, locked, onCreate }: Props) {
  const [title, setTitle] = useState("");
  const [spot, setSpot] = useState("");
  const [when, setWhen] = useState("");
  const [min, setMin] = useState("2");

  return (
    <Card title="Schedule a world event" icon="event">
      {locked && <p className="mb-3 rounded-lg bg-surface-container-high px-3 py-2 text-sm text-on-surface/80">{locked}</p>}
      <form
        className="space-y-2"
        onSubmit={async (e) => {
          e.preventDefault();
          const ok = await onCreate({ title, spot, scheduledAt: when, minAttendees: Number(min) || 2 });
          if (ok) {
            setTitle("");
            setSpot("");
            setWhen("");
          }
        }}
      >
        <fieldset disabled={locked !== null} className="space-y-2 disabled:opacity-50">
        <input className={inputClass} placeholder="Title" required value={title} onChange={(e) => setTitle(e.target.value)} />
        <input
          className={inputClass}
          placeholder="Spot (e.g. Cafe near college gate)"
          required
          value={spot}
          onChange={(e) => setSpot(e.target.value)}
        />
        <input className={inputClass} type="datetime-local" required value={when} onChange={(e) => setWhen(e.target.value)} />
        <label className="flex items-center gap-2 text-sm text-on-surface/60">
          Members needed to start
          <input
            className={`${inputClass} w-20`}
            type="number"
            min="1"
            value={min}
            onChange={(e) => setMin(e.target.value)}
          />
        </label>
        <Button type="submit" className="w-full" disabled={busy || locked !== null}>
          Create event
        </Button>
        </fieldset>
      </form>
    </Card>
  );
}
