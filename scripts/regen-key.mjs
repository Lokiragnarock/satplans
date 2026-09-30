import { connect, newKey, report } from "./_db.mjs";

const name = process.argv[2];
if (!name) {
  console.error('Usage: pnpm regen:key "Member name"');
  process.exit(1);
}

const db = connect();
const key = newKey();
const { data, error } = await db
  .from("members")
  .update({ access_key: key })
  .eq("display_name", name)
  .select("display_name");
if (error) throw error;
if (!data?.length) {
  console.error(`No member named "${name}"`);
  process.exit(1);
}
if (data.length > 1) {
  console.error("More than one member has that name; keys were all changed, run it again per person after renaming.");
}
report([{ name, key }]);
