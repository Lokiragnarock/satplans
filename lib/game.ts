import "server-only";
import { adminClient } from "./supabase";
import { gameInfoFromRow, lockReason, type GameWindowInfo } from "./window";
import type { GroupInfo, Me } from "./types";

// select("*") so this keeps working before migration 0003 adds the window columns.
export async function loadGroupRow(groupId: string): Promise<Record<string, unknown>> {
  const { data, error } = await adminClient().from("groups").select("*").eq("id", groupId).single();
  if (error) throw new Error(error.message);
  return data as Record<string, unknown>;
}

export function toGroupInfo(row: Record<string, unknown>): GroupInfo {
  return {
    id: String(row.id),
    name: String(row.name),
    timezone: String(row.timezone),
    night_start_hour: Number(row.night_start_hour),
    night_end_hour: Number(row.night_end_hour),
    template_loaded: Boolean(row.template_loaded),
  };
}

export async function loadGame(groupId: string): Promise<GameWindowInfo> {
  return gameInfoFromRow(await loadGroupRow(groupId));
}

// Every gameplay write calls this first. Throws unless the game is live right now.
export async function requireLive(me: Me): Promise<void> {
  const game = gameInfoFromRow(await loadGroupRow(me.group_id));
  const reason = lockReason(game.phase);
  if (reason) throw new Error(reason);
}
