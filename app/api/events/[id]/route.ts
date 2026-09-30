import { adminClient } from "@/lib/supabase";
import { must, withMember } from "@/lib/api";
import { loadGame } from "@/lib/game";
import type { Assignment, EventDetail, MemberLite, Quest, QuestCompletion, WorldEvent } from "@/lib/types";

export const dynamic = "force-dynamic";

export function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return withMember(async (me): Promise<EventDetail> => {
    const { id } = await ctx.params;
    const db = adminClient();
    const found = await db
      .from("world_events")
      .select("id, host_id, title, spot_label, scheduled_at, status, min_attendees")
      .eq("id", id)
      .eq("group_id", me.group_id)
      .maybeSingle();
    if (found.error) throw new Error(found.error.message);
    if (!found.data) throw new Error("Event not found");
    const event = found.data as Omit<WorldEvent, "attendees">;

    const [members, attendance, assignments] = await Promise.all([
      db.from("members").select("id, display_name, role").eq("group_id", me.group_id).order("display_name"),
      db.from("event_attendance").select("member_id").eq("event_id", id),
      db.from("topic_assignments").select("member_id, kind, topic, revealed").eq("event_id", id),
    ]);

    const showQuests = event.status === "active" || event.status === "completed" || event.host_id === me.id;
    const quests = showQuests
      ? must(
          await db
            .from("quests")
            .select("id, title, description, group_wide, counter_target, counter_unit, assigned_to")
            .eq("event_id", id)
            .order("created_at"),
        )
      : [];
    const questIds = (quests as Quest[]).map((q) => q.id);
    const completions = questIds.length
      ? must(await db.from("quest_completions").select("quest_id, member_id, count, completed_at").in("quest_id", questIds))
      : [];

    const attendees = must(attendance).map((a: { member_id: string }) => a.member_id);
    const assignmentRows = (must(assignments) as Assignment[]).map((a) => ({
      ...a,
      topic: a.revealed ? a.topic : null,
    }));

    return {
      me,
      event: { ...event, attendees: attendees.length },
      members: must(members) as MemberLite[],
      attendees,
      quests: quests as Quest[],
      questsHidden: !showQuests,
      completions: completions as QuestCompletion[],
      assignments: assignmentRows,
      game: await loadGame(me.group_id),
    };
  });
}
