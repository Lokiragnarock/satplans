"use client";

import { useMemo } from "react";
import { useLive } from "@/hooks/useLive";
import { useNow } from "@/hooks/useNow";
import { useRunner } from "@/hooks/useRunner";
import { clockIn, clockOut, loadTemplate, logContribution } from "@/app/actions";
import { ClockPanel } from "@/components/ClockPanel";
import { ClockedInList } from "@/components/ClockedInList";
import { Leaderboard } from "@/components/Leaderboard";
import { PooledProgress } from "@/components/PooledProgress";
import { TargetsPanel } from "@/components/TargetsPanel";
import { ErrorNote } from "@/components/ui";
import { minutesInPeriod, periodBounds } from "@/lib/window";
import type { DashboardData } from "@/lib/types";

export default function DashboardPage() {
  const { data, error, refresh } = useLive<DashboardData>("/api/dashboard");
  const { run, busy, error: actionError } = useRunner(refresh);
  const now = useNow();

  const view = useMemo(() => {
    if (!data) return null;
    const tz = data.group.timezone;
    const build = (period: "day" | "week", goal: number) => {
      const { start, end } = periodBounds(now, tz, period);
      const perMember = data.members
        .map((m) => ({
          id: m.id,
          name: m.display_name,
          minutes: minutesInPeriod(
            data.entries.filter((e) => e.member_id === m.id),
            start,
            end,
            now,
          ),
        }))
        .sort((a, b) => b.minutes - a.minutes);
      return { goal, perMember, done: perMember.reduce((s, m) => s + m.minutes, 0) };
    };
    return {
      daily: build("day", data.group.daily_target_minutes),
      weekly: build("week", data.group.weekly_target_minutes),
    };
  }, [data, now]);

  if (!data || !view) return <p className="text-zinc-500">{error ?? "Loading"}</p>;

  const names = Object.fromEntries(data.members.map((m) => [m.id, m.display_name]));
  const open = data.entries.filter((e) => !e.ended_at);
  const mine = open.find((e) => e.member_id === data.me.id);

  return (
    <>
      <ErrorNote message={actionError ?? error} />
      <ClockPanel
        startedAt={mine?.started_at ?? null}
        now={now}
        busy={busy}
        onClockIn={(note) => run(() => clockIn(note))}
        onClockOut={(note) => run(() => clockOut(note))}
      />
      <ClockedInList
        now={now}
        people={open.map((e) => ({
          id: e.member_id,
          name: names[e.member_id] ?? "?",
          startedAt: e.started_at,
          note: e.note,
        }))}
      />
      <PooledProgress label="Today" doneMinutes={view.daily.done} goalMinutes={view.daily.goal} perMember={view.daily.perMember} />
      <PooledProgress label="This week" doneMinutes={view.weekly.done} goalMinutes={view.weekly.goal} perMember={view.weekly.perMember} />
      <TargetsPanel
        targets={data.targets}
        contributions={data.contributions}
        names={names}
        busy={busy}
        isAdmin={data.me.role === "admin"}
        templateLoaded={data.group.template_loaded}
        onLog={(id, amount) => run(() => logContribution(id, amount))}
        onLoadTemplate={() => run(() => loadTemplate())}
      />
      <Leaderboard members={data.members} meId={data.me.id} />
    </>
  );
}
