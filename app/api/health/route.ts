import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const env = {
    SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  };
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ env, db: "missing env" });
  try {
    const { count, error } = await adminClient().from("members").select("id", { count: "exact", head: true });
    return NextResponse.json({ env, db: error ? `error: ${error.message}` : `ok, ${count} members` });
  } catch (e) {
    return NextResponse.json({ env, db: `error: ${e instanceof Error ? e.message : "unknown"}` });
  }
}
