"use client";

import { useState } from "react";
import { Button, Card, inputClass } from "./ui";

interface Props {
  busy: boolean;
  onAdd: (input: {
    title: string;
    description: string;
    groupWide: boolean;
    counterTarget: number | null;
    counterUnit: string;
  }) => Promise<boolean>;
}

export function QuestForm({ busy, onAdd }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [groupWide, setGroupWide] = useState(false);
  const [counterUnit, setCounterUnit] = useState("");
  const [counterTarget, setCounterTarget] = useState("");

  return (
    <Card title="Add a quest">
      <form
        className="space-y-2"
        onSubmit={async (e) => {
          e.preventDefault();
          const ok = await onAdd({
            title,
            description,
            groupWide,
            counterTarget: counterTarget ? Number(counterTarget) : null,
            counterUnit,
          });
          if (ok) {
            setTitle("");
            setDescription("");
            setCounterUnit("");
            setCounterTarget("");
          }
        }}
      >
        <input className={inputClass} placeholder="Title" required value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea
          className={inputClass}
          placeholder="Description"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="flex gap-2">
          <input className={inputClass} placeholder="Counter unit (optional)" value={counterUnit} onChange={(e) => setCounterUnit(e.target.value)} />
          <input
            className={inputClass}
            type="number"
            min="1"
            placeholder="Target"
            value={counterTarget}
            onChange={(e) => setCounterTarget(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-400">
          <input type="checkbox" checked={groupWide} onChange={(e) => setGroupWide(e.target.checked)} />
          Whole group quest (one completion counts for everyone here)
        </label>
        <Button type="submit" className="w-full" disabled={busy}>
          Add quest
        </Button>
      </form>
    </Card>
  );
}
