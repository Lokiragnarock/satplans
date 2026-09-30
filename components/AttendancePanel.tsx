import { Button, Card, Icon } from "./ui";
import { StatusBadge, isNightEvent } from "./EventList";
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
  const night = isNightEvent(event.title);
  const accentText = night ? "text-secondary" : "text-primary-container";
  const accentVariant = night ? "cyan" : "primary";
  return (
    <Card>
      <div className="mb-2 flex items-start justify-between gap-2">
        <h1 className={`headline-lg ${night ? "text-secondary" : ""}`}>{event.title}</h1>
        <StatusBadge status={event.status} />
      </div>
      <p className="flex items-center gap-1.5 text-sm text-on-surface/80">
        <Icon name="location_on" className={`!text-[18px] ${accentText}`} />
        {event.spot_label}
      </p>
      <p className="mb-4 mt-1 flex items-center gap-1.5 text-xs text-on-surface/50">
        <Icon name="alarm" className="!text-[16px]" />
        {new Date(event.scheduled_at).toLocaleString()} | hosted by {hostName}
      </p>
      <ul className="mb-4 space-y-2 text-sm">
        {members.map((m) => {
          const here = attendees.includes(m.id);
          return (
            <li key={m.id} className="flex items-center justify-between">
              <span>{m.display_name}</span>
              <span className={`label-sm ${here ? "text-tertiary" : "text-on-surface/30"}`}>{here ? "here" : "not yet"}</span>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-col gap-2">
        {!over && (
          <Button
            variant={iAmHere ? "ghost" : accentVariant}
            className="!h-14 !text-xl"
            disabled={busy || iAmHere}
            onClick={onHere}
          >
            {iAmHere ? "You are here" : "I'm here"}
          </Button>
        )}
        {canStart && (
          <>
            <Button variant={accentVariant} disabled={busy || !enough} onClick={onStart}>
              Start world event
            </Button>
            {!enough && (
              <p className="text-xs text-on-surface/50">
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
