"use client";

import { use } from "react";
import { useLive } from "@/hooks/useLive";
import { useRunner } from "@/hooks/useRunner";
import {
  addQuest,
  assignRandom,
  completeEvent,
  completeQuest,
  markHere,
  revealAssignments,
  startEvent,
} from "@/app/actions";
import { AssignmentsPanel } from "@/components/AssignmentsPanel";
import { AttendancePanel } from "@/components/AttendancePanel";
import { QuestForm } from "@/components/QuestForm";
import { QuestList } from "@/components/QuestList";
import { ErrorNote } from "@/components/ui";
import type { EventDetail } from "@/lib/types";

export default function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, error, refresh } = useLive<EventDetail>(`/api/events/${id}`);
  const { run, busy, error: actionError } = useRunner(refresh);

  if (!data) return <p className="text-zinc-500">{error ?? "Loading"}</p>;

  const { event, me, members, attendees, assignments } = data;
  const isHost = event.host_id === me.id;
  const hostName = members.find((m) => m.id === event.host_id)?.display_name ?? "?";
  const topics = assignments.filter((a) => a.kind === "topic");
  const dishes = assignments.filter((a) => a.kind === "dish");

  return (
    <>
      <ErrorNote message={actionError ?? error} />
      <AttendancePanel
        event={event}
        members={members}
        attendees={attendees}
        isHost={isHost}
        hostName={hostName}
        iAmHere={attendees.includes(me.id)}
        busy={busy}
        onHere={() => run(() => markHere(id))}
        onStart={() => run(() => startEvent(id))}
        onComplete={() => run(() => completeEvent(id))}
      />
      <AssignmentsPanel
        title="Presentation topics"
        hint="One niche topic per line, at least one per member"
        assignments={topics}
        members={members}
        meId={me.id}
        isHost={isHost}
        busy={busy}
        onAssign={(items) => run(() => assignRandom(id, "topic", items))}
        onReveal={() => run(() => revealAssignments(id, "topic"))}
      />
      <QuestList
        quests={data.quests}
        completions={data.completions}
        members={members}
        meId={me.id}
        hidden={data.questsHidden}
        playable={event.status === "active"}
        busy={busy}
        onComplete={(questId, count) => run(() => completeQuest(questId, count))}
      />
      {isHost && event.status !== "completed" && (
        <QuestForm busy={busy} onAdd={(input) => run(() => addQuest({ eventId: id, ...input }))} />
      )}
      <AssignmentsPanel
        title="Who eats what"
        hint="One dish per line, at least one per member"
        assignments={dishes}
        members={members}
        meId={me.id}
        isHost={isHost}
        busy={busy}
        onAssign={(items) => run(() => assignRandom(id, "dish", items))}
        onReveal={() => run(() => revealAssignments(id, "dish"))}
      />
    </>
  );
}
