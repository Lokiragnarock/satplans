import Link from "next/link";
import { Card, Icon } from "./ui";
import type { WorldEvent } from "@/lib/types";

export const isNightEvent = (title: string) => /house\s*party/i.test(title);

export const statusStyle: Record<WorldEvent["status"], string> = {
  scheduled: "bg-surface-container-highest text-on-surface-variant",
  gathering: "bg-primary-container/20 text-primary",
  active: "bg-tertiary/20 text-tertiary",
  completed: "bg-surface-container-low text-on-surface/40",
};

export function StatusBadge({ status }: { status: WorldEvent["status"] }) {
  return <span className={`label-sm rounded-full px-2.5 py-1 ${statusStyle[status]}`}>{status}</span>;
}

export function EventList({ events }: { events: WorldEvent[] }) {
  return (
    <Card title="World events" icon="confirmation_number">
      {events.length === 0 && <p className="text-sm text-on-surface-variant/70">No events yet.</p>}
      <ul className="space-y-3">
        {events.map((e) => {
          const night = isNightEvent(e.title);
          return (
            <li key={e.id}>
              <Link
                href={`/events/${e.id}`}
                className={`block rounded-xl border bg-surface-container-low p-3 hover:bg-surface-container-high ${
                  night ? "border-secondary-container/40" : "border-white/5"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`headline-lg !text-[22px] ${night ? "text-secondary" : ""}`}>{e.title}</span>
                  <StatusBadge status={e.status} />
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-on-surface/70">
                  <Icon name="location_on" className={`!text-[16px] ${night ? "text-secondary" : "text-primary-container"}`} />
                  {e.spot_label}
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-on-surface/50">
                  <Icon name="alarm" className="!text-[16px]" />
                  {new Date(e.scheduled_at).toLocaleString()} | {e.attendees} here
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
