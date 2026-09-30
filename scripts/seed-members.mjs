import { connect, newKey, report } from "./_db.mjs";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? args.splice(i, 2)[1] : fallback;
};
const groupName = flag("--group", "Ballin On Sats");
const timezone = flag("--tz", "Asia/Kolkata");
const names = (args[0] ?? "").split(",").map((n) => n.trim()).filter(Boolean);

if (names.length === 0) {
  console.error('Usage: pnpm seed:members "Name1,Name2,..." [--group "Group name"] [--tz Asia/Kolkata]');
  process.exit(1);
}

const db = connect();

let { data: group } = await db.from("groups").select("id").eq("name", groupName).maybeSingle();
if (!group) {
  const res = await db.from("groups").insert({ name: groupName, timezone }).select("id").single();
  if (res.error) throw res.error;
  group = res.data;
}

const { count } = await db.from("members").select("id", { count: "exact", head: true }).eq("group_id", group.id);
const rows = names.map((name, i) => ({
  group_id: group.id,
  display_name: name,
  role: !count && i === 0 ? "admin" : "member",
  access_key: newKey(),
}));

const res = await db.from("members").insert(rows);
if (res.error) throw res.error;

report(rows.map((r) => ({ name: r.display_name, key: r.access_key })));
if (!count) console.log(`${names[0]} is the admin and can load the Saturday template from the dashboard.`);
