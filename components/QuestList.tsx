"use client";

import { useState } from "react";
import { Button, Card, inputClass } from "./ui";
import type { MemberLite, Quest, QuestCompletion } from "@/lib/types";

interface Props {
  quests: Quest[];
  completions: QuestCompletion[];
  members: MemberLite[];
  meId: string;
  hidden: boolean;
  playable: boolean;
  busy: boolean;
  onComplete: (questId: string, count: number | null) => void;
}

function CounterInput({ unit, busy, onSubmit }: { unit: string; busy: boolean; onSubmit: (n: number) => void }) {
  const [value, setValue] = useState("");
  return (
    <form
      className="mt-2 flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (value !== "") onSubmit(Number(value));
        setValue("");
      }}
    >
      <input
        className={inputClass}
        type="number"
        min="0"
        inputMode="numeric"
        placeholder={`Your ${unit} so far`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <Button type="submit" variant="ghost" disabled={busy}>
        Save
      </Button>
    </form>
  );
}

export function QuestList({ quests, completions, members, meId, hidden, playable, busy, onComplete }: Props) {
  const name = (id: string) => members.find((m) => m.id === id)?.display_name ?? "?";
  const isDone = (questId: string) => completions.some((c) => c.quest_id === questId && c.completed_at);
  const doneCount = quests.filter((q) => isDone(q.id)).length;
  return (
    <Card title="Quests">
      {!hidden && quests.length > 0 && (
        <p className="mb-3 text-sm text-zinc-300">
          {doneCount} of {quests.length} done
        </p>
      )}
      {hidden && <p className="text-sm text-zinc-500">Quests are revealed when the host starts the event.</p>}
      {!hidden && quests.length === 0 && <p className="text-sm text-zinc-500">No quests yet.</p>}
      <ul className="space-y-3">
        {quests.map((q) => {
          const done = completions.filter((c) => c.quest_id === q.id && c.completed_at);
          const mine = completions.find((c) => c.quest_id === q.id && c.member_id === meId);
          const isCounter = q.counter_unit !== null || q.counter_target !== null;
          const confirmFor = q.assigned_to && q.assigned_to !== meId ? q.assigned_to : null;
          const counts = completions.filter((c) => c.quest_id === q.id).map((c) => c.count);
          const counted = q.group_wide ? Math.max(0, ...counts) : counts.reduce((s, n) => s + n, 0);
          const assignedDone = q.assigned_to ? done.length > 0 : false;
          return (
            <li key={q.id} className="rounded-xl border border-zinc-800 p-3">
              <div className="flex justify-between gap-2">
                <span className="font-medium">{q.title}</span>
                <span className={`text-sm ${done.length > 0 ? "text-emerald-400" : "text-zinc-500"}`}>
                  {done.length > 0 ? "Done" : "Not done"}
                </span>
              </div>
              {q.description && <p className="text-sm text-zinc-400">{q.description}</p>}
              <p className="mt-1 text-xs text-zinc-500">
                {q.group_wide ? "Whole group" : q.assigned_to ? `For ${name(q.assigned_to)}` : "Each member"}
                {q.counter_target ? ` | target ${q.counter_target} ${q.counter_unit ?? ""}` : ""}
              </p>
              {done.length > 0 && (
                <p className="mt-1 text-xs text-emerald-400">
                  {q.group_wide ? "Done by the group" : `Done by ${done.map((c) => name(c.member_id)).join(", ")}`}
                </p>
              )}
              {isCounter && !q.assigned_to && (
                <p className="mt-1 text-xs text-zinc-400">
                  {counted}
                  {q.counter_target ? ` of ${q.counter_target}` : ""} {q.counter_unit ?? ""}
                </p>
              )}
              {playable && (
                <div className="mt-2">
                  {confirmFor && !assignedDone && (
                    <Button variant="ghost" disabled={busy} onClick={() => onComplete(q.id, null)}>
                      Confirm {name(confirmFor)} did it
                    </Button>
                  )}
                  {!q.assigned_to && isCounter && !mine?.completed_at && (
                    <CounterInput
                      unit={q.counter_unit ?? "count"}
                      busy={busy}
                      onSubmit={(n) => onComplete(q.id, n)}
                    />
                  )}
                  {!q.assigned_to && !isCounter && !mine?.completed_at && !done.length && (
                    <Button disabled={busy} onClick={() => onComplete(q.id, null)}>
                      Mark complete
                    </Button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
