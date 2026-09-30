"use client";

import { use } from "react";
import { useLive } from "@/hooks/useLive";
import { useNow } from "@/hooks/useNow";
import { useRunner } from "@/hooks/useRunner";
import {
  addQuest,
  addTopic,
  assignRandom,
  completeEvent,
  completeQuest,
  deleteTopic,
  markHere,
  randomlyAllocate,
  revealAssignments,
  startEvent,
} from "@/app/actions";
import { AllocationPanel } from "@/components/AllocationPanel";
import { PresentationList } from "@/components/PresentationList";
import { TopicFeed } from "@/components/TopicFeed";
import { AssignmentsPanel } from "@/components/AssignmentsPanel";
import { AttendancePanel } from "@/components/AttendancePanel";
import { StatusBanner } from "@/components/StatusBanner";
import { QuestForm } from "@/components/QuestForm";
import { isNightEvent } from "@/components/EventList";
import { QuestList } from "@/components/QuestList";
import { ErrorNote, LoadingNote } from "@/components/ui";
import { gamePhase, lockReason, prepLockReason } from "@/lib/window";
import { isPptEvent, isPresentationQuest } from "@/lib/allocate";
import type { EventDetail } from "@/lib/types";

export default function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, error, refresh } = useLive<EventDetail>(`/api/events/${id}`);
  const { run, busy, error: actionError } = useRunner(refresh);
  const now = useNow();

  if (!data) return <LoadingNote message={error} />;

  const { event, me, members, attendees, assignments, game } = data;
  const phase = gamePhase(now, game.startsAt, game.durationHours);
  const locked = lockReason(phase);
  const prepLocked = prepLockReason(phase);
  const isHost = event.host_id === me.id;
  const hostName = members.find((m) => m.id === event.host_id)?.display_name ?? "?";
  const topics = assignments.filter((a) => a.kind === "topic");
  const ppt = isPptEvent(event.title);
  const presentations = data.quests.filter((q) => isPresentationQuest(q.title));
  const otherQuests = ppt ? data.quests.filter((q) => !isPresentationQuest(q.title)) : data.quests;
  const presentationIds = new Set(presentations.map((q) => q.id));
  const anyPresentationDone = data.completions.some((c) => presentationIds.has(c.quest_id) && c.completed_at);
  const dishes = assignments.filter((a) => a.kind === "dish");

  return (
    <>
      <StatusBanner startsAt={game.startsAt} durationHours={game.durationHours} now={now} />
      <ErrorNote message={actionError ?? error} />
      <AttendancePanel
        event={event}
        members={members}
        attendees={attendees}
        isHost={isHost}
        hostName={hostName}
        iAmHere={attendees.includes(me.id)}
        busy={busy}
        locked={locked}
        onHere={() => run(() => markHere(id))}
        onStart={() => run(() => startEvent(id))}
        onComplete={() => run(() => completeEvent(id))}
      />
      {ppt ? (
        <>
          <TopicFeed
            submissions={data.submissions}
            available={data.submissionsAvailable}
            members={members}
            meId={me.id}
            allocated={topics.length > 0}
            locked={prepLocked}
            busy={busy}
            now={now}
            onAdd={(topic) => run(() => addTopic(id, topic))}
            onDelete={(submissionId) => run(() => deleteTopic(id, submissionId))}
          />
          <AllocationPanel
            assignments={topics}
            members={members}
            submissionCount={data.submissions.length}
            canAllocate={isHost || me.role === "admin"}
            anyDone={anyPresentationDone}
            locked={locked}
            busy={busy}
            onAllocate={() => run(() => randomlyAllocate(id))}
          />
          <PresentationList
            quests={presentations}
            completions={data.completions}
            assignments={topics}
            members={members}
            meId={me.id}
            playable={event.status === "active" && locked === null}
            busy={busy}
            onComplete={(questId) => run(() => completeQuest(questId, null))}
          />
        </>
      ) : (
        <AssignmentsPanel
          title="Presentation topics"
          hint="One niche topic per line, at least one per member"
          assignments={topics}
          members={members}
          meId={me.id}
          isHost={isHost}
          busy={busy}
          locked={locked !== null}
          onAssign={(items) => run(() => assignRandom(id, "topic", items))}
          onReveal={() => run(() => revealAssignments(id, "topic"))}
        />
      )}
      {(!ppt || otherQuests.length > 0) && (
      <QuestList
        quests={otherQuests}
        completions={data.completions}
        members={members}
        meId={me.id}
        hidden={data.questsHidden}
        playable={event.status === "active" && locked === null}
        busy={busy}
        accent={isNightEvent(event.title) ? "cyan" : "orange"}
        onComplete={(questId, count) => run(() => completeQuest(questId, count))}
      />
      )}
      {isHost && event.status !== "completed" && locked === null && (
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
        locked={locked !== null}
        onAssign={(items) => run(() => assignRandom(id, "dish", items))}
        onReveal={() => run(() => revealAssignments(id, "dish"))}
      />
    </>
  );
}
