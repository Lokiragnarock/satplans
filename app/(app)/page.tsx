"use client";

import { useMemo } from "react";
import { useLive } from "@/hooks/useLive";
import { useNow } from "@/hooks/useNow";
import { useRunner } from "@/hooks/useRunner";
import { addMember, clockIn, clockOut, loadTemplate, logContribution, setGameSettings } from "@/app/actions";
import { AdminPanel } from "@/components/AdminPanel";
import { ClockPanel } from "@/components/ClockPanel";
import { ClockedInList } from "@/components/ClockedInList";
import { PooledProgress } from "@/components/PooledProgress";
import { StatusBanner } from "@/components/StatusBanner";
import { TargetsPanel } from "@/components/TargetsPanel";
import { NextEventCard, pickNextEvent } from "@/components/NextEventCard";
import { ErrorNote, LoadingNote } from "@/components/ui";
import { gamePhase, lockReason, minutesInPeriod, toLocalInput, type GamePhase } from "@/lib/window";
import type { DashboardData, WorldEvent } from "@/lib/types";

function captionFor(phase: GamePhase, startsAt: string | null, durationHours: number): string {
  if (phase === "unset" || !startsAt) return "Waiting for the admin to set the start time";
  if (phase === "before") return `Game window opens ${new Date(startsAt).toLocaleString()}`;
  if (phase === "live") return `Clocked in the ${durationHours}h game window`;
  return "Final total for the game window";
}

export default function DashboardPage() {
  const { data, error, refresh } = useLive<DashboardData>("/api/dashboard");
  const { data: eventsData } = useLive<{ events: WorldEvent[] }>("/api/events", 15000);
  const { run, busy, error: actionError } = useRunner(refresh);
  const now = useNow();

  const doneMinutes = useMemo(() => {
    if (!data || !data.game.startsAt || !data.game.endsAt) return 0;
    return minutesInPeriod(data.entries, new Date(data.game.startsAt), new Date(data.game.endsAt), now);
  }, [data, now]);

  if (!data) return <LoadingNote message={error} />;

  const { game } = data;
  const phase = gamePhase(now, game.startsAt, game.durationHours);
  const locked = lockReason(phase);
  const open = data.entries.filter((e) => !e.ended_at);
  const mine = open.find((e) => e.member_id === data.me.id);
  const isAdmin = data.me.role === "admin";

  return (
    <>
      <StatusBanner startsAt={game.startsAt} durationHours={game.durationHours} now={now} />
      <ErrorNote message={actionError ?? error} />
      <PooledProgress
        doneMinutes={phase === "before" || phase === "unset" ? 0 : doneMinutes}
        goalHours={game.targetHours}
        caption={captionFor(phase, game.startsAt, game.durationHours)}
      />
      <ClockPanel
        startedAt={mine?.started_at ?? null}
        now={now}
        busy={busy}
        locked={locked}
        onClockIn={(note) => run(() => clockIn(note))}
        onClockOut={(note) => run(() => clockOut(note))}
      />
      <ClockedInList
        now={now}
        people={data.members.map((m) => ({
          id: m.id,
          name: m.display_name,
          startedAt: phase === "live" ? (open.find((e) => e.member_id === m.id)?.started_at ?? null) : null,
        }))}
      />
      <TargetsPanel
        targets={data.targets}
        busy={busy}
        isAdmin={isAdmin}
        locked={locked !== null}
        templateLoaded={data.group.template_loaded}
        onLog={(id, amount) => run(() => logContribution(id, amount))}
        onLoadTemplate={() => run(() => loadTemplate())}
      />
      <NextEventCard event={pickNextEvent(eventsData?.events ?? [], now)} now={now} />
      {isAdmin && (
        <AdminPanel
          members={data.members}
          startsAtLocal={toLocalInput(game.startsAt)}
          targetHours={game.targetHours === game.durationHours ? null : game.targetHours}
          durationHours={game.durationHours}
          busy={busy}
          onSaveSettings={(startsAtLocal, targetHours) =>
            run(() => setGameSettings({ startsAt: new Date(startsAtLocal).toISOString(), targetHours }))
          }
          onAddMember={async (name) => {
            const r = await addMember(name);
            await refresh();
            return r;
          }}
        />
      )}
    </>
  );
}
