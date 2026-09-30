"use client";

import { useMemo } from "react";
import { useLive } from "@/hooks/useLive";
import { useNow } from "@/hooks/useNow";
import { useRunner } from "@/hooks/useRunner";
import { clockIn, clockOut, loadTemplate, logContribution } from "@/app/actions";
import { ClockPanel } from "@/components/ClockPanel";
import { ClockedInList } from "@/components/ClockedInList";
import { PooledProgress } from "@/components/PooledProgress";
import { TargetsPanel } from "@/components/TargetsPanel";
import { NextEventCard, pickNextEvent } from "@/components/NextEventCard";
import { ErrorNote, LoadingNote } from "@/components/ui";
import { minutesInPeriod, periodBounds } from "@/lib/window";
import type { DashboardData, WorldEvent } from "@/lib/types";

export default function DashboardPage() {
  const { data, error, refresh } = useLive<DashboardData>("/api/dashboard");
  const { data: eventsData } = useLive<{ events: WorldEvent[] }>("/api/events", 15000);
  const { run, busy, error: actionError } = useRunner(refresh);
  const now = useNow();

  const view = useMemo(() => {
    if (!data) return null;
    const tz = data.group.timezone;
    const build = (period: "day" | "week", goal: number) => {
      const { start, end } = periodBounds(now, tz, period);
      return { goal, done: minutesInPeriod(data.entries, start, end, now) };
    };
    return {
      daily: build("day", data.group.daily_target_minutes),
      weekly: build("week", data.group.weekly_target_minutes),
    };
  }, [data, now]);

  if (!data || !view) return <LoadingNote message={error} />;

  const open = data.entries.filter((e) => !e.ended_at);
  const mine = open.find((e) => e.member_id === data.me.id);

  return (
    <>
      <ErrorNote message={actionError ?? error} />
      <PooledProgress
        dailyDoneMinutes={view.daily.done}
        dailyGoalMinutes={view.daily.goal}
        weeklyDoneMinutes={view.weekly.done}
        weeklyGoalMinutes={view.weekly.goal}
      />
      <ClockPanel
        startedAt={mine?.started_at ?? null}
        now={now}
        busy={busy}
        onClockIn={(note) => run(() => clockIn(note))}
        onClockOut={(note) => run(() => clockOut(note))}
      />
      <ClockedInList
        now={now}
        people={data.members.map((m) => ({
          id: m.id,
          name: m.display_name,
          startedAt: open.find((e) => e.member_id === m.id)?.started_at ?? null,
        }))}
      />
      <TargetsPanel
        targets={data.targets}
        busy={busy}
        isAdmin={data.me.role === "admin"}
        templateLoaded={data.group.template_loaded}
        onLog={(id, amount) => run(() => logContribution(id, amount))}
        onLoadTemplate={() => run(() => loadTemplate())}
      />
      <NextEventCard event={pickNextEvent(eventsData?.events ?? [], now)} now={now} />
    </>
  );
}
