import { Button, Icon } from "./ui";
import { effectiveChallengeStatus, formatDuration, remainingMs } from "@/lib/window";
import type { Challenge } from "@/lib/types";

interface Props {
  challenge: Challenge;
  names: Record<string, string>;
  meId: string;
  now: Date;
  busy: boolean;
  onRespond: (accept: boolean) => void;
  onPropose: (winnerId: string) => void;
  onConfirm: () => void;
  onDispute: () => void;
}

export function ChallengeCard({ challenge: c, names, meId, now, busy, onRespond, onPropose, onConfirm, onDispute }: Props) {
  const status = effectiveChallengeStatus(c, now);
  const isIssuer = c.issuer_id === meId;
  const isTarget = c.target_id === meId;
  const other = isIssuer ? names[c.target_id] : names[c.issuer_id];

  return (
    <li className="rounded-xl border border-white/5 bg-surface-container-low p-3">
      <p className="label-md text-on-surface-variant">{isIssuer ? `You challenged ${other}` : `${other} challenged you`}</p>
      <p className="my-2 font-medium">{c.prompt}</p>
      <div className="flex flex-wrap items-center gap-2">
        <span className="label-sm rounded-full bg-surface-container-highest px-2.5 py-1 text-on-surface-variant">{status}</span>
        {status === "pending" && (
          <span className="scoreboard-title flex items-center gap-1 !text-[20px] text-primary-container">
            <Icon name="timer" className="!text-[18px]" />
            {formatDuration(remainingMs(c.expires_at, now))} left
          </span>
        )}
        {status === "resolved" && c.winner_id && (
          <span className="label-sm text-tertiary">won by {names[c.winner_id]}</span>
        )}
        {status === "proposed" && c.proposed_winner_id && (
          <span className="label-sm text-secondary">proposed winner {names[c.proposed_winner_id]}</span>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {status === "pending" && isTarget && (
          <>
            <Button variant="green" disabled={busy} onClick={() => onRespond(true)}>
              Accept
            </Button>
            <Button variant="ghost" disabled={busy} onClick={() => onRespond(false)}>
              Decline
            </Button>
          </>
        )}
        {(status === "accepted" || status === "disputed") && isIssuer && (
          <>
            <Button disabled={busy} onClick={() => onPropose(c.issuer_id)}>
              I won
            </Button>
            <Button variant="ghost" disabled={busy} onClick={() => onPropose(c.target_id)}>
              {other} won
            </Button>
          </>
        )}
        {status === "proposed" && isTarget && (
          <>
            <Button variant="green" disabled={busy} onClick={onConfirm}>
              Confirm result
            </Button>
            <Button variant="danger" disabled={busy} onClick={onDispute}>
              Dispute
            </Button>
          </>
        )}
        {status === "proposed" && isIssuer && <span className="text-sm text-on-surface/60">Waiting for {other} to confirm</span>}
      </div>
    </li>
  );
}
