import { randomBytes } from "node:crypto";
import { appendFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

export function connect() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export const newKey = () => randomBytes(24).toString("base64url");

export function report(rows) {
  const base = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const lines = rows.map((r) => `${r.name}: ${base}/k/${r.key}`);
  console.log(lines.join("\n"));
  appendFileSync("keys.local.txt", lines.join("\n") + "\n");
  console.log("\nAlso appended to keys.local.txt (gitignored). Send each link privately.");
}
