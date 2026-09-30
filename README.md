# Group Quest

A mobile-friendly web app for a small friend group to play a shared grind game. It is purely cooperative: there are no points, no percentages and no rankings, only what the group gets done together. No native app, no push notifications, no accounts: the admin hands each person a personal secret link.

## The three mechanics

1. **Group targets and clock-in.** The group has a pooled daily and weekly target in minutes. Members clock in and out with an optional note. The dashboard shows the pooled total as plain hours (for example "14h 20m of 20h") and who is clocked in right now with a running timer. There are also pooled count targets (run km, squats, free throws) shown as group totals (for example "1,040 / 1,500 shots") that members log to. Nothing is broken down per member.
2. **World events.** Any member schedules an event with a title, a spot label and a time. Lifecycle: scheduled, gathering, active, completed. Attendance is honor system ("I'm here"). Once enough members are here (default 2, set per event) the host starts the event, which reveals its quests. The host adds quests and can randomly assign presentation topics or dishes. Quests can be plain, group-wide, counters (rounds, reps), or assigned to one member and confirmed by another. A quest card shows done or not done, and the event page shows "X of Y done". Counters (for example Monopoly rounds) are plain counts. Completion is recorded atomically and only once.
3. **Night quick-time challenges.** After the group's night start hour (default 21:00, in the group's timezone, open until 05:00) any member can challenge another: prompt, response window (default 15 minutes). The target sees a countdown and accepts or declines. After accepting, the issuer picks the winner and the target confirms or disputes. Pending challenges past their deadline are shown as expired (computed at read time, no cron). The winner is just recorded and shown as "won by <name>"; nothing is awarded. Issuing is enforced in SQL and mirrored in the UI.

## How access works

- There is no login. `members.access_key` holds a long random secret per person.
- Visiting `/k/<key>` validates the key, sets an httpOnly cookie and redirects to `/`. Everything else reads that cookie, and anyone without a valid one lands on "Ask for your key".
- All database access goes through Next.js server actions and route handlers using the Supabase service role key (server only). RLS is enabled on every table with no policies, so the anon key reads nothing. Rules (night window, host checks, atomic quest completion) live in SQL functions that take the acting `p_member` id resolved server side.
- Anyone holding a link is that member, so send links privately. Regenerate a key with `pnpm regen:key "Name"`; the old link stops working immediately.

## Realtime

The UI polls small JSON endpoints every 3 to 4 seconds (paused while the tab is hidden) and refetches right after your own actions. Unauthenticated clients cannot use Supabase Realtime on RLS-locked tables, and polling is simpler and works. Tables are intentionally not in the `supabase_realtime` publication. The polling lives in `hooks/useLive.ts`, so it can be swapped for broadcast channels later without touching components.

## Setup

1. Create a Supabase project.
2. Run `supabase/migrations/0001_init.sql` in the SQL editor (or `supabase db push`).
3. Copy `.env.example` to `.env.local` and fill in `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (Project Settings, API). Never expose the service role key to the browser.
4. Install and create your group:

   ```
   pnpm install
   pnpm seed:members "Alice,Bob,Cara" --group "Ballin On Sats" --tz Asia/Kolkata
   ```

   The first member of a new group is the admin. Personal links are printed and appended to `keys.local.txt` (gitignored).
5. `pnpm dev` and open a personal link.

If `pnpm` is not on PATH use `corepack pnpm` (the corepack shim may need to be on PATH).

### Saturday template ("Ballin On Sats")

The admin sees a **Load Saturday template** button on the dashboard (once per group). It creates:

- Group targets: Run 20 km, Squats 300, Free throw line shots 1500, Bottle flips 200 (shown as group totals only).
- **Scooter Day** (spot-based): rent scooters, airport stop, reel shoot, vlog (all group-wide).
- **House Party** (night): Minecraft one shot, Monopoly 20 rounds (group counter), cook food (group-wide), delete Insta and Snapchat (each member), and one presentation quest per member confirmed by another member. Apply `0002_template_v2.sql` after `0001_init.sql`.

The database still has legacy `xp` and `stake_xp` columns from the original schema. The app ignores them: it never reads or shows them and always passes 0 when calling the SQL functions.

Hosts can randomly assign presentation topics and dishes from a list on the event page; dishes stay hidden until the host presses Reveal.

`supabase/seed.sql` does the same for a demo group with three demo members and prints their links. Use it only for local trials.

## Scripts

- `pnpm dev`, `pnpm build`, `pnpm start`
- `pnpm test` (vitest, pure time and challenge logic in `lib/window.ts`)
- `pnpm typecheck`, `pnpm lint`
- `pnpm seed:members "A,B,C"`, `pnpm regen:key "Name"`

## Layout

- `components/` presentational only: props in, callbacks out, no fetching
- `hooks/` polling, clock tick, action runner
- `app/(app)/` pages that wire hooks to components
- `app/api/` read endpoints, `app/actions.ts` write actions (server actions calling SQL functions)
- `supabase/migrations/0001_init.sql` schema, RLS and all functions
