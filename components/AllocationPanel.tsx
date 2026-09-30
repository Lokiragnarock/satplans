import { Button, Card } from "./ui";
import type { Assignment, MemberLite } from "@/lib/types";

interface Props {
  assignments: Assignment[];
  members: MemberLite[];
  submissionCount: number;
  canAllocate: boolean;
  anyDone: boolean;
  locked: string | null;
  busy: boolean;
  onAllocate: () => void;
}

export function AllocationPanel({ assignments, members, submissionCount, canAllocate, anyDone, locked, busy, onAllocate }: Props) {
  const allocated = assignments.length > 0;
  const enough = submissionCount >= members.length;
  const topicOf = (id: string) => assignments.find((a) => a.member_id === id)?.topic ?? null;
  return (
    <Card title="Allocations" icon="shuffle">
      {allocated ? (
        <ul className="mb-3 space-y-2 text-sm">
          {members.map((m) => (
            <li key={m.id} className="flex justify-between gap-3">
              <span>{m.display_name}</span>
              <span className="text-right font-semibold text-tertiary">{topicOf(m.id) ?? "?"}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-3 text-sm text-on-surface-variant/70">Nothing dealt yet.</p>
      )}
      {canAllocate && !(allocated && anyDone) && (
        <div className="flex flex-col gap-2">
          <Button disabled={busy || !enough || locked !== null} onClick={onAllocate}>
            {allocated ? "Randomly allocate again" : "Randomly allocate"}
          </Button>
          {!enough && (
            <p className="text-xs text-on-surface/50">
              Needs {members.length} topics, one per member ({submissionCount} so far).
            </p>
          )}
          {locked && <p className="text-xs text-on-surface/60">{locked}</p>}
        </div>
      )}
      {allocated && anyDone && <p className="text-xs text-on-surface/50">A presentation is done, so the topics are locked in.</p>}
    </Card>
  );
}
