import { Button, Card, Icon } from "./ui";
import type { Assignment, MemberLite, Quest, QuestCompletion } from "@/lib/types";

interface Props {
  quests: Quest[];
  completions: QuestCompletion[];
  assignments: Assignment[];
  members: MemberLite[];
  meId: string;
  playable: boolean;
  busy: boolean;
  onComplete: (questId: string) => void;
}

export function PresentationList({ quests, completions, assignments, members, meId, playable, busy, onComplete }: Props) {
  const name = (id: string) => members.find((m) => m.id === id)?.display_name ?? "?";
  const done = (id: string) => completions.some((c) => c.quest_id === id && c.completed_at);
  const doneCount = quests.filter((q) => done(q.id)).length;
  return (
    <Card title="Presentations" icon="slideshow">
      <p className="mb-3 text-sm text-on-surface/70">No AI, you have to present and talk. Another member confirms each one.</p>
      {quests.length > 0 && (
        <p className="scoreboard-title mb-3">
          <span className="text-primary-container">{doneCount}</span>
          <span className="text-on-surface/40"> / {quests.length} done</span>
        </p>
      )}
      {quests.length === 0 && <p className="text-sm text-on-surface-variant/70">No presentations yet.</p>}
      <ul className="space-y-3">
        {quests.map((q) => {
          const isDone = done(q.id);
          const topic = q.assigned_to ? (assignments.find((a) => a.member_id === q.assigned_to)?.topic ?? null) : null;
          const mine = q.assigned_to === meId;
          return (
            <li key={q.id} className={`rounded-xl border bg-surface-container-low p-3 ${isDone ? "border-tertiary/40" : "border-white/5"}`}>
              <div className="flex items-start justify-between gap-2">
                <span className="label-lg">{q.assigned_to ? name(q.assigned_to) : q.title}</span>
                <span
                  className={`label-sm flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 ${
                    isDone ? "bg-tertiary/20 text-tertiary" : "bg-surface-container-highest text-on-surface-variant"
                  }`}
                >
                  <Icon name={isDone ? "check_circle" : "radio_button_unchecked"} className="!text-[14px]" />
                  {isDone ? "Done" : "Not done"}
                </span>
              </div>
              <p className={`mt-1 text-sm ${topic ? "font-semibold text-tertiary" : "text-on-surface/50"}`}>
                {topic ?? "Waiting for allocation"}
              </p>
              {playable && !isDone && q.assigned_to && (
                <div className="mt-2">
                  {mine ? (
                    <p className="text-xs text-on-surface/50">Another member must confirm</p>
                  ) : (
                    <Button variant="ghost" disabled={busy || !topic} onClick={() => onComplete(q.id)}>
                      Confirm {name(q.assigned_to)} did it
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
