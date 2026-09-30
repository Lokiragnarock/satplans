"use server";

import { adminClient } from "@/lib/supabase";
import { getMember } from "@/lib/session";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function call(name: string, args: Record<string, unknown> = {}): Promise<ActionResult> {
  try {
    const me = await getMember();
    if (!me) return { ok: false, error: "Ask for your key" };
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
  xp: number;
  groupWide: boolean;
  counterTarget: number | null;
  counterUnit: string;
}) {
  return call("add_quest", {
    p_event: input.eventId,
    p_title: input.title,
    p_description: input.description,
    p_xp: input.xp,
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

export async function issueChallenge(input: { targetId: string; prompt: string; stake: number; windowMinutes: number }) {
  return call("issue_challenge", {
    p_target: input.targetId,
    p_prompt: input.prompt,
    p_stake: input.stake,
    p_window_minutes: input.windowMinutes,
  });
}

export async function respondChallenge(id: string, accept: boolean) {
  return call("respond_challenge", { p_challenge: id, p_accept: accept });
}

export async function resolveChallenge(id: string, action: "propose" | "confirm" | "dispute", winnerId?: string) {
  return call("resolve_challenge", { p_challenge: id, p_action: action, p_winner: winnerId ?? null });
}
