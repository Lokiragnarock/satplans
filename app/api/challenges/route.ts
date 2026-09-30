import { adminClient } from "@/lib/supabase";
import { must, withMember } from "@/lib/api";
import type { Challenge, ChallengesData, GroupInfo, MemberLite } from "@/lib/types";

export const dynamic = "force-dynamic";

export function GET() {
  return withMember(async (me): Promise<ChallengesData> => {
    const db = adminClient();
    const [group, members, challenges] = await Promise.all([
      db.from("groups").select("*").eq("id", me.group_id).single(),
      db.from("members").select("id, display_name, xp, role").eq("group_id", me.group_id),
      db
        .from("challenges")
        .select("id, issuer_id, target_id, prompt, stake_xp, status, expires_at, proposed_winner_id, winner_id")
        .eq("group_id", me.group_id)
        .or(`issuer_id.eq.${me.id},target_id.eq.${me.id}`)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    return {
      me,
      group: must(group) as GroupInfo,
      members: must(members) as MemberLite[],
      challenges: must(challenges) as Challenge[],
    };
  });
}
