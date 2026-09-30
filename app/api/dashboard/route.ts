import { adminClient } from "@/lib/supabase";
import { must, withMember } from "@/lib/api";
import { periodBounds } from "@/lib/window";
import type { DashboardData, GroupInfo, GroupTarget, MemberLite, TimeEntry } from "@/lib/types";

export const dynamic = "force-dynamic";

export function GET() {
  return withMember(async (me): Promise<DashboardData> => {
    const db = adminClient();
    const group = must(await db.from("groups").select("*").eq("id", me.group_id).single()) as GroupInfo;
    const weekStart = periodBounds(new Date(), group.timezone, "week").start.toISOString();
    const [members, entries, targets] = await Promise.all([
      db.from("members").select("id, display_name, role").eq("group_id", me.group_id).order("display_name"),
      db
        .from("time_entries")
        .select("id, member_id, started_at, ended_at, note")
        .eq("group_id", me.group_id)
        .or(`ended_at.is.null,ended_at.gte.${weekStart}`),
      db.from("group_targets").select("id, label, unit, goal, progress").eq("group_id", me.group_id).order("created_at"),
    ]);
    const targetRows = must(targets) as GroupTarget[];
    return {
      me,
      group,
      members: must(members) as MemberLite[],
      entries: must(entries) as TimeEntry[],
      targets: targetRows.map((t) => ({ ...t, goal: Number(t.goal), progress: Number(t.progress) })),
    };
  });
}
