"use client";

import { useLive } from "@/hooks/useLive";
import { useNow } from "@/hooks/useNow";
import { useRunner } from "@/hooks/useRunner";
import { issueChallenge, resolveChallenge, respondChallenge } from "@/app/actions";
import { ChallengeCard } from "@/components/ChallengeCard";
import { StatusBanner } from "@/components/StatusBanner";
import { ChallengeForm } from "@/components/ChallengeForm";
import { Card, ErrorNote, LoadingNote } from "@/components/ui";
import { gamePhase, isNightWindow, lockReason } from "@/lib/window";
import type { Challenge, ChallengesData } from "@/lib/types";

export default function ChallengesPage() {
  const { data, error, refresh } = useLive<ChallengesData>("/api/challenges", 3000);
  const { run, busy, error: actionError } = useRunner(refresh);
  const now = useNow();

  if (!data) return <LoadingNote message={error} />;

  const { me, group, members, challenges, game } = data;
  const phaseLock = lockReason(gamePhase(now, game.startsAt, game.durationHours));
  const names = Object.fromEntries(members.map((m) => [m.id, m.display_name]));
  const nightOpen = isNightWindow(now, group.timezone, group.night_start_hour, group.night_end_hour);
  const open = phaseLock === null && nightOpen;
  const closedReason = phaseLock ?? `Challenges open at ${String(group.night_start_hour).padStart(2, "0")}:00 (${group.timezone}) and close at ${String(group.night_end_hour).padStart(2, "0")}:00.`;

  const list = (title: string, icon: string, items: Challenge[]) => (
    <Card title={title} icon={icon}>
      {items.length === 0 && <p className="text-sm text-on-surface-variant/70">Nothing here.</p>}
      <ul className="space-y-3">
        {items.map((c) => (
          <ChallengeCard
            key={c.id}
            challenge={c}
            names={names}
            meId={me.id}
            now={now}
            busy={busy}
            locked={phaseLock !== null}
            onRespond={(accept) => run(() => respondChallenge(c.id, accept))}
            onPropose={(winnerId) => run(() => resolveChallenge(c.id, "propose", winnerId))}
            onConfirm={() => run(() => resolveChallenge(c.id, "confirm"))}
            onDispute={() => run(() => resolveChallenge(c.id, "dispute"))}
          />
        ))}
      </ul>
    </Card>
  );

  return (
    <>
      <StatusBanner startsAt={game.startsAt} durationHours={game.durationHours} now={now} />
      <ErrorNote message={actionError ?? error} />
      {list("Inbox", "inbox", challenges.filter((c) => c.target_id === me.id))}
      {list("Sent", "send", challenges.filter((c) => c.issuer_id === me.id))}
      <ChallengeForm
        members={members.filter((m) => m.id !== me.id)}
        open={open}
        closedReason={closedReason}
        busy={busy}
        onIssue={(input) => run(() => issueChallenge(input))}
      />
    </>
  );
}
