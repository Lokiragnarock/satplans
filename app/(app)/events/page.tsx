"use client";

import { useLive } from "@/hooks/useLive";
import { useNow } from "@/hooks/useNow";
import { useRunner } from "@/hooks/useRunner";
import { createEvent } from "@/app/actions";
import { EventForm } from "@/components/EventForm";
import { StatusBanner } from "@/components/StatusBanner";
import { EventList } from "@/components/EventList";
import { ErrorNote, LoadingNote } from "@/components/ui";
import { gamePhase, lockReason } from "@/lib/window";
import type { EventsData } from "@/lib/types";

export default function EventsPage() {
  const { data, error, refresh } = useLive<EventsData>("/api/events");
  const { run, busy, error: actionError } = useRunner(refresh);
  const now = useNow();

  if (!data) return <LoadingNote message={error} />;

  const locked = lockReason(gamePhase(now, data.game.startsAt, data.game.durationHours));

  return (
    <>
      <StatusBanner startsAt={data.game.startsAt} durationHours={data.game.durationHours} now={now} />
      <ErrorNote message={actionError ?? error} />
      <EventList events={data.events} />
      <EventForm
        busy={busy}
        locked={locked}
        onCreate={(input) => run(() => createEvent(input))}
      />
    </>
  );
}
