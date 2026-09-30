import Link from "next/link";
import { Card } from "./ui";
import type { WorldEvent } from "@/lib/types";

export const statusStyle: Record<WorldEvent["status"], string> = {
  scheduled: "bg-zinc-800 text-zinc-300",
  gathering: "bg-amber-900 text-amber-200",
  active: "bg-emerald-900 text-emerald-200",
  completed: "bg-zinc-900 text-zinc-500",
};

export function StatusBadge({ status }: { status: WorldEvent["status"] }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs ${statusStyle[status]}`}>{status}</span>;
}

export function EventList({ events }: { events: WorldEvent[] }) {
  return (
    <Card title="World events">
      {events.length === 0 && <p className="text-sm text-zinc-500">No events yet.</p>}
      <ul className="space-y-2">
        {events.map((e) => (
          <li key={e.id}>
            <Link href={`/events/${e.id}`} className="block rounded-xl border border-zinc-800 p-3 hover:bg-zinc-800">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{e.title}</span>
                <StatusBadge status={e.status} />
              </div>
              <p className="text-sm text-zinc-400">{e.spot_label}</p>
              <p className="text-xs text-zinc-500">
                {new Date(e.scheduled_at).toLocaleString()} | {e.attendees} here
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
