import { Button, Card } from "./ui";
import { StatusBadge } from "./EventList";
import type { MemberLite, WorldEvent } from "@/lib/types";

interface Props {
  event: WorldEvent;
  members: MemberLite[];
  attendees: string[];
  isHost: boolean;
  hostName: string;
  iAmHere: boolean;
  busy: boolean;
  onHere: () => void;
  onStart: () => void;
  onComplete: () => void;
}

export function AttendancePanel({ event, members, attendees, isHost, hostName, iAmHere, busy, onHere, onStart, onComplete }: Props) {
  const over = event.status === "completed";
  const canStart = isHost && (event.status === "scheduled" || event.status === "gathering");
  const enough = attendees.length >= event.min_attendees;
  return (
    <Card>
      <div className="mb-1 flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold">{event.title}</h1>
        <StatusBadge status={event.status} />
      </div>
      <p className="text-zinc-400">{event.spot_label}</p>
      <p className="mb-3 text-xs text-zinc-500">
        {new Date(event.scheduled_at).toLocaleString()} | hosted by {hostName}
      </p>
      <ul className="mb-3 space-y-1 text-sm">
        {members.map((m) => (
          <li key={m.id} className="flex justify-between">
            <span>{m.display_name}</span>
            <span className={attendees.includes(m.id) ? "text-emerald-400" : "text-zinc-600"}>
              {attendees.includes(m.id) ? "here" : "not yet"}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-2">
        {!over && (
          <Button variant={iAmHere ? "ghost" : "primary"} disabled={busy || iAmHere} onClick={onHere}>
            {iAmHere ? "You are here" : "I'm here"}
          </Button>
        )}
        {canStart && (
          <>
            <Button disabled={busy || !enough} onClick={onStart}>
              Start world event
            </Button>
            {!enough && (
              <p className="text-xs text-zinc-500">
                Needs {event.min_attendees} members here ({attendees.length} so far).
              </p>
            )}
          </>
        )}
        {isHost && event.status === "active" && (
          <Button variant="ghost" disabled={busy} onClick={onComplete}>
            Complete event
          </Button>
        )}
      </div>
    </Card>
  );
}
