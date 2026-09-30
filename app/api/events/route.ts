import { adminClient } from "@/lib/supabase";
import { must, withMember } from "@/lib/api";
import { loadGame } from "@/lib/game";
import type { EventsData, WorldEvent } from "@/lib/types";

export const dynamic = "force-dynamic";

export function GET() {
  return withMember(async (me): Promise<EventsData> => {
    const db = adminClient();
    const rows = must(
      await db
        .from("world_events")
        .select("id, host_id, title, spot_label, scheduled_at, status, min_attendees, event_attendance(count)")
        .eq("group_id", me.group_id)
        .order("scheduled_at", { ascending: false }),
    ) as unknown as (Omit<WorldEvent, "attendees"> & { event_attendance: { count: number }[] })[];
    const events: WorldEvent[] = rows.map(({ event_attendance, ...e }) => ({
      ...e,
      attendees: event_attendance[0]?.count ?? 0,
    }));
    return { me, events, game: await loadGame(me.group_id) };
  });
}
