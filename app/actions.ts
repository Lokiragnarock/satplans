"use server";

import { randomBytes } from "node:crypto";
import { adminClient } from "@/lib/supabase";
import { getMember } from "@/lib/session";
import { requireLive, requirePrepOrLive } from "@/lib/game";
import { allocateTopics, isPptEvent, isPresentationQuest } from "@/lib/allocate";

export type ActionResult = { ok: true } | { ok: false; error: string };

// Every gameplay write goes through here, and requireLive blocks it unless the game is live.
async function call(name: string, args: Record<string, unknown> = {}): Promise<ActionResult> {
  try {
    const me = await getMember();
    if (!me) return { ok: false, error: "Ask for your key" };
    await requireLive(me);
    const { error } = await adminClient().rpc(name, { p_member: me.id, ...args });
    return error ? { ok: false, error: error.message } : { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Server error" };
  }
}

export async function clockIn(note: string) {
  return call("clock_in", { p_note: note });
}

export async function clockOut(note: string) {
  return call("clock_out", { p_note: note });
}

export async function createEvent(input: { title: string; spot: string; scheduledAt: string; minAttendees: number }) {
  return call("create_world_event", {
    p_title: input.title,
    p_spot: input.spot,
    p_scheduled_at: new Date(input.scheduledAt).toISOString(),
    p_min_attendees: input.minAttendees,
  });
}

export async function markHere(eventId: string) {
  return call("mark_here", { p_event: eventId });
}

export async function startEvent(eventId: string) {
  return call("start_world_event", { p_event: eventId });
}

export async function completeEvent(eventId: string) {
  return call("complete_world_event", { p_event: eventId });
}

export async function addQuest(input: {
  eventId: string;
  title: string;
  description: string;
  groupWide: boolean;
  counterTarget: number | null;
  counterUnit: string;
}) {
  return call("add_quest", {
    p_event: input.eventId,
    p_title: input.title,
    p_description: input.description,
    p_xp: 0,
    p_group_wide: input.groupWide,
    p_counter_target: input.counterTarget,
    p_counter_unit: input.counterUnit,
  });
}

export async function completeQuest(questId: string, count: number | null) {
  return call("complete_quest", { p_quest: questId, p_count: count });
}

export async function assignRandom(eventId: string, kind: "topic" | "dish", items: string[]) {
  return call("assign_random", { p_event: eventId, p_kind: kind, p_items: items });
}

export async function revealAssignments(eventId: string, kind: "topic" | "dish") {
  return call("reveal_assignments", { p_event: eventId, p_kind: kind });
}

export async function logContribution(targetId: string, amount: number) {
  return call("log_contribution", { p_target: targetId, p_amount: amount });
}

export async function loadTemplate() {
  return call("load_saturday_template");
}

export async function issueChallenge(input: { targetId: string; prompt: string; windowMinutes: number }) {
  return call("issue_challenge", {
    p_target: input.targetId,
    p_prompt: input.prompt,
    p_stake: 0,
    p_window_minutes: input.windowMinutes,
  });
}

export async function respondChallenge(id: string, accept: boolean) {
  return call("respond_challenge", { p_challenge: id, p_accept: accept });
}

export async function resolveChallenge(id: string, action: "propose" | "confirm" | "dispute", winnerId?: string) {
  return call("resolve_challenge", { p_challenge: id, p_action: action, p_winner: winnerId ?? null });
}

const MIGRATION_HINT = "Apply supabase/migrations/0003_game_window.sql first";

// Admin only, allowed in any phase. The admin check uses the member resolved from the cookie key.
export async function setGameSettings(input: { startsAt: string; targetHours: number | null }): Promise<ActionResult> {
  try {
    const me = await getMember();
    if (!me) return { ok: false, error: "Ask for your key" };
    if (me.role !== "admin") return { ok: false, error: "Only the admin can change the game settings" };
    const start = new Date(input.startsAt);
    if (Number.isNaN(start.getTime())) return { ok: false, error: "Pick a valid start date and time" };
    const target = input.targetHours;
    if (target !== null && (!Number.isInteger(target) || target < 1 || target > 10000)) {
      return { ok: false, error: "Hours goal must be a whole number of hours" };
    }
    const { error } = await adminClient()
      .from("groups")
      .update({ starts_at: start.toISOString(), target_hours: target })
      .eq("id", me.group_id);
    if (error) {
      return { ok: false, error: /starts_at|target_hours|duration_hours/.test(error.message) ? MIGRATION_HINT : error.message };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Server error" };
  }
}

export type AddMemberResult = { ok: true; key: string; name: string } | { ok: false; error: string };

// Admin only, allowed in any phase. Returns the new personal key once; it is never listed afterwards.
export async function addMember(name: string): Promise<AddMemberResult> {
  try {
    const me = await getMember();
    if (!me) return { ok: false, error: "Ask for your key" };
    if (me.role !== "admin") return { ok: false, error: "Only the admin can add members" };
    const display = name.trim().replace(/\s+/g, " ");
    if (!display) return { ok: false, error: "Enter a name" };
    if (display.length > 40) return { ok: false, error: "Keep the name under 40 characters" };
    const db = adminClient();
    const existing = await db.from("members").select("display_name").eq("group_id", me.group_id);
    if (existing.error) return { ok: false, error: existing.error.message };
    const taken = (existing.data ?? []).some(
      (m: { display_name: string }) => m.display_name.trim().toLowerCase() === display.toLowerCase(),
    );
    if (taken) return { ok: false, error: `${display} is already in the squad` };
    const key = randomBytes(24).toString("base64url");
    const { error } = await db
      .from("members")
      .insert({ group_id: me.group_id, display_name: display, role: "member", access_key: key });
    if (error) return { ok: false, error: error.message };
    return { ok: true, key, name: display };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Server error" };
  }
}

const MIGRATION_0004_HINT = "Apply supabase/migrations/0004_ppt_night.sql first";
const MAX_TOPIC_LENGTH = 120;

function migrationAware(message: string): string {
  return /topic_submissions|schema cache/.test(message) ? MIGRATION_0004_HINT : message;
}

// Loads a PPT event in the caller's group and whether the topics have already been dealt.
async function loadPptEvent(groupId: string, eventId: string) {
  const db = adminClient();
  const found = await db
    .from("world_events")
    .select("id, host_id, title, group_id")
    .eq("id", eventId)
    .eq("group_id", groupId)
    .maybeSingle();
  if (found.error) throw new Error(found.error.message);
  if (!found.data) throw new Error("Event not found");
  if (!isPptEvent(found.data.title)) throw new Error("This event has no topic feed");
  const dealt = await db
    .from("topic_assignments")
    .select("member_id", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("kind", "topic");
  if (dealt.error) throw new Error(dealt.error.message);
  return { event: found.data as { id: string; host_id: string; title: string; group_id: string }, allocated: (dealt.count ?? 0) > 0 };
}

// Prep write: allowed when the game phase is before or live (see requirePrepOrLive).
export async function addTopic(eventId: string, topic: string): Promise<ActionResult> {
  try {
    const me = await getMember();
    if (!me) return { ok: false, error: "Ask for your key" };
    await requirePrepOrLive(me);
    const text = topic.trim().replace(/\s+/g, " ");
    if (text.length < 1 || text.length > MAX_TOPIC_LENGTH) {
      return { ok: false, error: `Topic must be 1 to ${MAX_TOPIC_LENGTH} characters` };
    }
    const { event, allocated } = await loadPptEvent(me.group_id, eventId);
    if (allocated) return { ok: false, error: "Allocation is done, topics are closed" };
    const db = adminClient();
    const existing = await db.from("topic_submissions").select("topic").eq("event_id", event.id);
    if (existing.error) return { ok: false, error: migrationAware(existing.error.message) };
    if ((existing.data ?? []).some((r: { topic: string }) => r.topic.trim().toLowerCase() === text.toLowerCase())) {
      return { ok: false, error: "That topic is already in the feed" };
    }
    const { error } = await db
      .from("topic_submissions")
      .insert({ group_id: me.group_id, event_id: event.id, member_id: me.id, topic: text });
    return error ? { ok: false, error: migrationAware(error.message) } : { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Server error" };
  }
}

// Prep write: members can delete only their own topics, and only before allocation.
export async function deleteTopic(eventId: string, submissionId: string): Promise<ActionResult> {
  try {
    const me = await getMember();
    if (!me) return { ok: false, error: "Ask for your key" };
    await requirePrepOrLive(me);
    const { event, allocated } = await loadPptEvent(me.group_id, eventId);
    if (allocated) return { ok: false, error: "Allocation is done, topics are closed" };
    const { error } = await adminClient()
      .from("topic_submissions")
      .delete()
      .eq("id", submissionId)
      .eq("event_id", event.id)
      .eq("member_id", me.id);
    return error ? { ok: false, error: migrationAware(error.message) } : { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Server error" };
  }
}

// Live-only (requireLive). Host or group admin deals one submitted topic to every member.
export async function randomlyAllocate(eventId: string): Promise<ActionResult> {
  try {
    const me = await getMember();
    if (!me) return { ok: false, error: "Ask for your key" };
    await requireLive(me);
    const { event } = await loadPptEvent(me.group_id, eventId);
    if (event.host_id !== me.id && me.role !== "admin") {
      return { ok: false, error: "Only the host or the admin can allocate" };
    }
    const db = adminClient();
    const quests = await db.from("quests").select("id, title").eq("event_id", event.id);
    if (quests.error) return { ok: false, error: quests.error.message };
    const presentationIds = (quests.data ?? [])
      .filter((q: { title: string }) => isPresentationQuest(q.title))
      .map((q: { id: string }) => q.id);
    if (presentationIds.length) {
      const done = await db
        .from("quest_completions")
        .select("quest_id", { count: "exact", head: true })
        .in("quest_id", presentationIds)
        .not("completed_at", "is", null);
      if (done.error) return { ok: false, error: done.error.message };
      if ((done.count ?? 0) > 0) return { ok: false, error: "A presentation is already done, so topics cannot be reshuffled" };
    }
    const [members, subs] = await Promise.all([
      db.from("members").select("id").eq("group_id", me.group_id),
      db.from("topic_submissions").select("member_id, topic").eq("event_id", event.id),
    ]);
    if (members.error) return { ok: false, error: members.error.message };
    if (subs.error) return { ok: false, error: migrationAware(subs.error.message) };
    const result = allocateTopics(
      (members.data ?? []).map((m: { id: string }) => m.id),
      (subs.data ?? []) as { member_id: string; topic: string }[],
    );
    if (!result.ok) return result;
    const del = await db.from("topic_assignments").delete().eq("event_id", event.id).eq("kind", "topic");
    if (del.error) return { ok: false, error: del.error.message };
    const ins = await db.from("topic_assignments").insert(
      result.picks.map((p) => ({
        group_id: me.group_id,
        event_id: event.id,
        member_id: p.member_id,
        kind: "topic",
        topic: p.topic,
        revealed: true,
      })),
    );
    return ins.error ? { ok: false, error: ins.error.message } : { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Server error" };
  }
}
