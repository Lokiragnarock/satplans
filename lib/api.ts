import "server-only";
import { NextResponse } from "next/server";
import { getMember } from "./session";
import type { Me } from "./types";

export async function withMember(handler: (me: Me) => Promise<unknown>) {
  try {
    const me = await getMember();
    if (!me) return NextResponse.json({ error: "Ask for your key" }, { status: 401 });
    return NextResponse.json(await handler(me), { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 });
  }
}

export function must<T>(res: { data: T; error: { message: string } | null }): NonNullable<T> {
  if (res.error) throw new Error(res.error.message);
  return (res.data ?? []) as NonNullable<T>;
}
