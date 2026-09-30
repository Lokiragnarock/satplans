"use client";

import { useState } from "react";
import { Button, Card, Icon, ProgressBar, accentStyle, inputClass } from "./ui";
import type { Accent } from "./ui";
import { progress } from "@/lib/window";
import type { MemberLite, Quest, QuestCompletion } from "@/lib/types";

interface Props {
  quests: Quest[];
  completions: QuestCompletion[];
  members: MemberLite[];
  meId: string;
  hidden: boolean;
  playable: boolean;
  busy: boolean;
  accent?: Accent;
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

export function QuestList({ quests, completions, members, meId, hidden, playable, busy, accent = "orange", onComplete }: Props) {
  const a = accentStyle[accent];
  const name = (id: string) => members.find((m) => m.id === id)?.display_name ?? "?";
  const isDone = (questId: string) => completions.some((c) => c.quest_id === questId && c.completed_at);
  const doneCount = quests.filter((q) => isDone(q.id)).length;
  return (
    <Card title="Quests" icon="emoji_events">
      {!hidden && quests.length > 0 && (
        <p className="scoreboard-title mb-3">
          <span className={a.text}>{doneCount}</span>
          <span className="text-on-surface/40"> / {quests.length} done</span>
        </p>
      )}
      {hidden && <p className="text-sm text-on-surface-variant/70">Quests are revealed when the host starts the event.</p>}
      {!hidden && quests.length === 0 && <p className="text-sm text-on-surface-variant/70">No quests yet.</p>}
      <ul className="space-y-3">
        {quests.map((q) => {
          const done = completions.filter((c) => c.quest_id === q.id && c.completed_at);
          const mine = completions.find((c) => c.quest_id === q.id && c.member_id === meId);
          const isCounter = q.counter_unit !== null || q.counter_target !== null;
          const confirmFor = q.assigned_to && q.assigned_to !== meId ? q.assigned_to : null;
          const counts = completions.filter((c) => c.quest_id === q.id).map((c) => c.count);
          const counted = q.group_wide ? Math.max(0, ...counts) : counts.reduce((s, n) => s + n, 0);
          const assignedDone = q.assigned_to ? done.length > 0 : false;
          const isComplete = done.length > 0;
          return (
            <li
              key={q.id}
              className={`rounded-xl border bg-surface-container-low p-3 ${isComplete ? "border-tertiary/40" : "border-white/5"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="label-lg">{q.title}</span>
                <span
                  className={`label-sm flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 ${
                    isComplete ? "bg-tertiary/20 text-tertiary" : "bg-surface-container-highest text-on-surface-variant"
                  }`}
                >
                  <Icon name={isComplete ? "check_circle" : "radio_button_unchecked"} className="!text-[14px]" />
                  {isComplete ? "Done" : "Not done"}
                </span>
              </div>
              {q.description && <p className="mt-1 text-sm text-on-surface/70">{q.description}</p>}
              <p className="label-sm mt-1.5 text-on-surface/50">
                {q.group_wide ? "Whole group" : q.assigned_to ? `For ${name(q.assigned_to)}` : "Each member"}
                {q.counter_target ? ` | target ${q.counter_target} ${q.counter_unit ?? ""}` : ""}
              </p>
              {isComplete && (
                <p className="mt-1 text-xs text-tertiary">
                  {q.group_wide ? "Done by the group" : `Done by ${done.map((c) => name(c.member_id)).join(", ")}`}
                </p>
              )}
              {isCounter && !q.assigned_to && (
                <div className="mt-2">
                  <p className="scoreboard-title !text-[22px]">
                    <span className={a.text}>{counted}</span>
                    <span className="text-on-surface/40">
                      {q.counter_target ? ` / ${q.counter_target}` : ""} {q.counter_unit ?? ""}
                    </span>
                  </p>
                  {q.counter_target ? (
                    <div className="mt-2">
                      <ProgressBar pct={progress(counted, q.counter_target).pct} accent={accent} thin />
                    </div>
                  ) : null}
                </div>
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
                    <Button variant={accent === "cyan" ? "cyan" : "primary"} disabled={busy} onClick={() => onComplete(q.id, null)}>
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
