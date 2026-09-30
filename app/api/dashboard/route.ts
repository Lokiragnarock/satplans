import { adminClient } from "@/lib/supabase";
import { must, withMember } from "@/lib/api";
import { gameInfoFromRow } from "@/lib/window";
import { loadGroupRow, toGroupInfo } from "@/lib/game";
import type { DashboardData, GroupTarget, MemberLite, TimeEntry } from "@/lib/types";

export const dynamic = "force-dynamic";

export function GET() {
  return withMember(async (me): Promise<DashboardData> => {
    const db = adminClient();
    const groupRow = await loadGroupRow(me.group_id);
    const game = gameInfoFromRow(groupRow);
    const entriesQuery = db
      .from("time_entries")
      .select("id, member_id, started_at, ended_at, note")
      .eq("group_id", me.group_id);
    // Only entries that can overlap the game window (clipped again on the client).
    const windowEntries = game.startsAt
      ? entriesQuery.or(`ended_at.is.null,ended_at.gte.${game.startsAt}`)
      : entriesQuery.is("ended_at", null);
    const [members, entries, targets] = await Promise.all([
      db.from("members").select("id, display_name, role").eq("group_id", me.group_id).order("display_name"),
      windowEntries,
      db.from("group_targets").select("id, label, unit, goal, progress").eq("group_id", me.group_id).order("created_at"),
    ]);
    const targetRows = must(targets) as GroupTarget[];
    return {
      me,
      group: toGroupInfo(groupRow),
      members: must(members) as MemberLite[],
      entries: must(entries) as TimeEntry[],
      targets: targetRows.map((t) => ({ ...t, goal: Number(t.goal), progress: Number(t.progress) })),
      game,
    };
  });
}
