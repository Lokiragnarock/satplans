import Link from "next/link";
import { Icon } from "./ui";
import type { WorldEvent } from "@/lib/types";

export function pickNextEvent(events: WorldEvent[], now: Date): WorldEvent | null {
  const open = events.filter((e) => e.status !== "completed");
  const t = (e: WorldEvent) => new Date(e.scheduled_at).getTime();
  const live = open.filter((e) => e.status === "active");
  if (live.length > 0) return live[0];
  const upcoming = open.filter((e) => t(e) >= now.getTime()).sort((a, b) => t(a) - t(b));
  if (upcoming.length > 0) return upcoming[0];
  return open.sort((a, b) => t(b) - t(a))[0] ?? null;
}

function untilLabel(event: WorldEvent, now: Date): string {
  if (event.status === "active") return "Live now";
  const mins = Math.floor((new Date(event.scheduled_at).getTime() - now.getTime()) / 60000);
  if (mins <= 0) return "Starting now";
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  if (d > 0) return `In ${d}d ${h}h`;
  if (h > 0) return `In ${h}h ${m}m`;
  return `In ${m}m`;
}

export function NextEventCard({ event, now }: { event: WorldEvent | null; now: Date }) {
  return (
    <section className="rounded-xl border border-white/5 bg-surface-container p-4">
      {event ? (
        <>
          <div className="flex items-center justify-between gap-2">
            <span className="label-sm rounded-full bg-secondary-container/15 px-3 py-1 text-secondary">Next world event</span>
            <span className="label-md flex items-center gap-1 text-on-surface-variant">
              <Icon name="schedule" className="!text-[18px]" />
              {untilLabel(event, now)}
            </span>
          </div>
          <h2 className="headline-lg mt-3">{event.title}</h2>
          <div className="mt-2 flex flex-col gap-1 text-sm text-on-surface/70">
            <p className="flex items-center gap-2">
              <Icon name="location_on" className="!text-[18px] text-primary-container" />
              {event.spot_label}
            </p>
            <p className="flex items-center gap-2">
              <Icon name="alarm" className="!text-[18px] text-primary-container" />
              {new Date(event.scheduled_at).toLocaleString([], {
                weekday: "short",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          </div>
          <Link
            href={`/events/${event.id}`}
            className="label-md mt-4 inline-flex items-center gap-1 text-primary-container"
          >
            View Event
            <Icon name="arrow_forward" className="!text-[18px]" />
          </Link>
        </>
      ) : (
        <>
          <span className="label-sm rounded-full bg-secondary-container/15 px-3 py-1 text-secondary">Next world event</span>
          <p className="mt-3 text-sm text-on-surface/60">Nothing scheduled yet.</p>
          <Link href="/events" className="label-md mt-3 inline-flex items-center gap-1 text-primary-container">
            Go to Events
            <Icon name="arrow_forward" className="!text-[18px]" />
          </Link>
        </>
      )}
    </section>
  );
}
