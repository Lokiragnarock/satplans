# Group Quest

A mobile-friendly web app for a small friend group to play a shared grind game. It is purely cooperative: there are no points, no percentages and no rankings, only what the group gets done together. No native app, no push notifications, no accounts: the admin hands each person a personal secret link.

## The three mechanics

1. **Team hours and clock-in.** The group has one pooled hours goal for the game window. Members clock in and out with an optional note. The dashboard shows the pooled total as plain hours (for example "14h 20m / 24h") and who is clocked in right now with a running timer. Hours are clipped to the game window: time before the start does not count, and an entry still open after the end counts only until the end. There are also pooled count targets (run km, squats, free throws) shown as group totals (for example "1,040 / 1,500 shots") that members log to. Nothing is broken down per member.
2. **World events.** Any member schedules an event with a title, a spot label and a time. Lifecycle: scheduled, gathering, active, completed. Attendance is honor system ("I'm here"). Once enough members are here (default 2, set per event) the host starts the event, which reveals its quests. The host adds quests and can randomly assign presentation topics or dishes. Quests can be plain, group-wide, counters (rounds, reps), or assigned to one member and confirmed by another. A quest card shows done or not done, and the event page shows "X of Y done". Counters (for example Monopoly rounds) are plain counts. Completion is recorded atomically and only once.
3. **Night quick-time challenges.** After the group's night start hour (default 21:00, in the group's timezone, open until 05:00) any member can challenge another: prompt, response window (default 15 minutes). The target sees a countdown and accepts or declines. After accepting, the issuer picks the winner and the target confirms or disputes. Pending challenges past their deadline are shown as expired (computed at read time, no cron). The winner is just recorded and shown as "won by <name>"; nothing is awarded. Issuing is enforced in SQL and mirrored in the UI.

## Game window and admin

- The game only runs inside a window: it opens at `groups.starts_at` and runs for `groups.duration_hours` (default 24). The hours goal is `coalesce(target_hours, duration_hours)`.
- Phases: `unset` (no start time yet, message "The admin has not set the start time yet"), `before`, `live`, `ended`. The start instant is live and the end instant is already ended. The pure logic is `gamePhase` and `gameWindow` in `lib/window.ts`.
- Outside `live` everything is view only: Home, Events, event detail (quests with their done states) and Duels history still load, but clock in/out, creating events, I'm here, starting or completing events, quests, topic assignment, reveal, target logging, loading the template and all duel actions are refused. The admin is not exempt from this.
- Enforcement is on the server: `requireLive` in `lib/game.ts` runs at the start of every gameplay server action in `app/actions.ts` and throws a clear error otherwise. The UI also disables or hides those controls and shows a status banner under the header (starts in, live with time left, game over, start time not set). The 21:00 night window for duels still applies on top.
- Only the admin (checked server side from the cookie key) can set the start time and hours goal, and add members, in any phase. The admin panel on Home has a datetime field shown in the admin's local time, an hours goal field, and a squad list with "Add member", which creates a member with a random key and shows the personal link once with a Copy button. Duplicate names (case-insensitive) and empty names are rejected. To reopen or shift the window, the admin moves the start time.
- Before migration 0003 is applied the app treats the game as `unset`, so it stays locked rather than crashing.

## How access works

- There is no login. `members.access_key` holds a long random secret per person.
- Visiting `/k/<key>` validates the key, sets an httpOnly cookie and redirects to `/`. Everything else reads that cookie, and anyone without a valid one lands on "Ask for your key".
- All database access goes through Next.js server actions and route handlers using the Supabase service role key (server only). RLS is enabled on every table with no policies, so the anon key reads nothing. Rules (night window, host checks, atomic quest completion) live in SQL functions that take the acting `p_member` id resolved server side.
- Anyone holding a link is that member, so send links privately. Regenerate a key with `pnpm regen:key "Name"`; the old link stops working immediately.

## Realtime

The UI polls small JSON endpoints every 3 to 4 seconds (paused while the tab is hidden) and refetches right after your own actions. Unauthenticated clients cannot use Supabase Realtime on RLS-locked tables, and polling is simpler and works. Tables are intentionally not in the `supabase_realtime` publication. The polling lives in `hooks/useLive.ts`, so it can be swapped for broadcast channels later without touching components.

## Setup

1. Create a Supabase project.
2. Run `supabase/migrations/0001_init.sql`, then `0002_template_v2.sql`, then `0003_game_window.sql` (adds `starts_at`, `duration_hours`, `target_hours` to `groups`) in the SQL editor (or `supabase db push`). Then sign in as the admin and set the start time on Home, otherwise the game stays locked.
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
- **House Party** (night): Minecraft one shot, Monopoly 20 rounds (group counter), cook food (group-wide), delete Insta and Snapchat (each member), and one presentation quest per member confirmed by another member. Needs `0002_template_v2.sql`.

The database still has legacy `xp` and `stake_xp` columns from the original schema. The app ignores them: it never reads or shows them and always passes 0 when calling the SQL functions.

Hosts can randomly assign presentation topics and dishes from a list on the event page; dishes stay hidden until the host presses Reveal.

`supabase/seed.sql` does the same for a demo group with three demo members and prints their links. Use it only for local trials.

## Scripts

- `pnpm dev`, `pnpm build`, `pnpm start`
- `pnpm test` (vitest, pure time, game window and challenge logic in `lib/window.ts`)
- `pnpm typecheck`, `pnpm lint`
- `pnpm seed:members "A,B,C"`, `pnpm regen:key "Name"`

## Layout

- `components/` presentational only: props in, callbacks out, no fetching
- `hooks/` polling, clock tick, action runner
- `app/(app)/` pages that wire hooks to components
- `app/api/` read endpoints, `app/actions.ts` write actions (server actions calling SQL functions)
- `supabase/migrations/0001_init.sql` schema, RLS and all functions; `0003_game_window.sql` adds the game window
