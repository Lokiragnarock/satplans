import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminClient } from "./supabase";
import type { Me } from "./types";

export const KEY_COOKIE = "gq_key";

export async function memberForKey(key: string | undefined): Promise<Me | null> {
  if (!key || key.length < 24 || key.length > 200) return null;
  const { data, error } = await adminClient()
    .from("members")
    .select("id, group_id, display_name, role")
    .eq("access_key", key)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Me | null) ?? null;
}

export async function getMember(): Promise<Me | null> {
  const store = await cookies();
  return memberForKey(store.get(KEY_COOKIE)?.value);
}

export async function requireMember(): Promise<Me> {
  const me = await getMember();
  if (!me) redirect("/ask-for-key");
  return me;
}
