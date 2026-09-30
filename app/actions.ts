"use server";

import { randomBytes } from "node:crypto";
import { adminClient } from "@/lib/supabase";
import { getMember } from "@/lib/session";
import { requireLive } from "@/lib/game";

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
