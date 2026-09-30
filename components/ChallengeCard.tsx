import { Button } from "./ui";
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
    <li className="rounded-xl border border-zinc-800 p-3">
      <p className="text-sm text-zinc-400">{isIssuer ? `You challenged ${other}` : `${other} challenged you`}</p>
      <p className="my-1 font-medium">{c.prompt}</p>
      <p className="text-xs text-zinc-500">
        {status}
        {status === "pending" && ` | ${formatDuration(remainingMs(c.expires_at, now))} left`}
        {status === "resolved" && c.winner_id && ` | won by ${names[c.winner_id]}`}
        {status === "proposed" && c.proposed_winner_id && ` | proposed winner ${names[c.proposed_winner_id]}`}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {status === "pending" && isTarget && (
          <>
            <Button disabled={busy} onClick={() => onRespond(true)}>
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
            <Button disabled={busy} onClick={onConfirm}>
              Confirm result
            </Button>
            <Button variant="danger" disabled={busy} onClick={onDispute}>
              Dispute
            </Button>
          </>
        )}
        {status === "proposed" && isIssuer && <span className="text-sm text-zinc-400">Waiting for {other} to confirm</span>}
      </div>
    </li>
  );
}
