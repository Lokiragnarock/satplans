import { NextResponse } from "next/server";
import { KEY_COOKIE, memberForKey } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ key: string }> }) {
  const { key } = await ctx.params;
  const member = await memberForKey(key).catch(() => null);
  if (!member) return NextResponse.redirect(new URL("/ask-for-key", req.url));
  const res = NextResponse.redirect(new URL("/", req.url));
  res.cookies.set(KEY_COOKIE, key, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
