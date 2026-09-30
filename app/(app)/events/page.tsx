"use client";

import { useLive } from "@/hooks/useLive";
import { useRunner } from "@/hooks/useRunner";
import { createEvent } from "@/app/actions";
import { EventForm } from "@/components/EventForm";
import { EventList } from "@/components/EventList";
import { ErrorNote, LoadingNote } from "@/components/ui";
import type { Me, WorldEvent } from "@/lib/types";

export default function EventsPage() {
  const { data, error, refresh } = useLive<{ me: Me; events: WorldEvent[] }>("/api/events");
  const { run, busy, error: actionError } = useRunner(refresh);

  if (!data) return <LoadingNote message={error} />;

  return (
    <>
      <ErrorNote message={actionError ?? error} />
      <EventList events={data.events} />
      <EventForm
        busy={busy}
        onCreate={(input) => run(() => createEvent(input))}
      />
    </>
  );
}
