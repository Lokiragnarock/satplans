-- 0004_ppt_night.sql
-- PPT Night: a separate Halloween world event for the presentations, plus a topic feed.
-- Paste into the Supabase SQL editor and run once. Safe to re-run: every step checks first.
--   1. topic_submissions table (members add topics, the host or admin then deals them out)
--   2. Sets the Halloween 2026 (Sat 31 Oct, Asia/Kolkata) dates for 'Ballin On Sats'
--   3. Creates 'PPT Night' and moves the 'Presentation: <name>' quests out of 'House Party'
--   4. Replaces load_saturday_template so new groups get the same layout

create table if not exists topic_submissions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  event_id uuid not null references world_events(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  topic text not null check (length(topic) between 1 and 120),
  created_at timestamptz not null default now()
);
create index if not exists topic_submissions_event_idx on topic_submissions (event_id);

alter table topic_submissions enable row level security;
revoke all on table topic_submissions from anon, authenticated;

do $$
declare
  g groups;
  adm uuid;
  party uuid;
  ppt uuid;
begin
  select * into g from groups where name = 'Ballin On Sats' order by created_at limit 1;
  if not found then
    raise notice 'Group "Ballin On Sats" not found, skipped the data changes';
    return;
  end if;

  -- Halloween dates, 31 Oct 2026 in IST. The game window opens at 10:00 and runs 24 hours.
  update groups set starts_at = timestamptz '2026-10-31 10:00:00+05:30' where id = g.id;
  update world_events set scheduled_at = timestamptz '2026-10-31 10:00:00+05:30'
    where group_id = g.id and title = 'Scooter Day';
  update world_events set scheduled_at = timestamptz '2026-10-31 21:00:00+05:30'
    where group_id = g.id and title = 'House Party';

  select id into ppt from world_events where group_id = g.id and title = 'PPT Night' limit 1;
  if ppt is null then
    select id into adm from members where group_id = g.id and role = 'admin' order by created_at limit 1;
    if adm is null then
      raise notice 'No admin member found in "Ballin On Sats", skipped PPT Night';
      return;
    end if;
    insert into world_events (group_id, host_id, title, spot_label, scheduled_at, min_attendees)
      values (g.id, adm, 'PPT Night', 'The house', timestamptz '2026-10-31 20:00:00+05:30', 2)
      returning id into ppt;
  else
    update world_events set scheduled_at = timestamptz '2026-10-31 20:00:00+05:30' where id = ppt;
  end if;

  select id into party from world_events where group_id = g.id and title = 'House Party' limit 1;
  if party is not null then
    update quests set event_id = ppt
      where event_id = party and title like 'Presentation: %';
  end if;
end $$;

-- New groups: PPT Night (with one presentation quest per member) plus a House Party without them.
-- Same signature as 0002. All three events default to Halloween, Sat 31 Oct 2026, in the group's timezone.
create or replace function load_saturday_template(p_member uuid) returns void
language plpgsql set search_path = public as $$
declare
  m members; g groups; d date; scooter uuid; party uuid; ppt uuid; x members;
begin
  m := _get_member(p_member);
  if m.role <> 'admin' then raise exception 'Only the admin can load the template'; end if;
  select * into g from groups where id = m.group_id for update;
  if g.template_loaded then raise exception 'Template already loaded'; end if;
  update groups set template_loaded = true where id = g.id;

  d := date '2026-10-31';

  insert into group_targets (group_id, label, unit, goal) values
    (g.id, 'Run', 'km', 20),
    (g.id, 'Squats', 'reps', 300),
    (g.id, 'Free throw line shots', 'shots', 1500),
    (g.id, 'Bottle flips', 'flips', 200);

  insert into world_events (group_id, host_id, title, spot_label, scheduled_at, min_attendees)
    values (g.id, m.id, 'Scooter Day', 'Scooter rental spot', (d + time '10:00') at time zone g.timezone, 2)
    returning id into scooter;
  insert into quests (event_id, title, description, xp, group_wide) values
    (scooter, 'Rent scooters and do stuff', 'Rent the scooters and go explore together.', 30, true),
    (scooter, 'Airport stop', 'Everyone makes the airport stop.', 20, true),
    (scooter, 'Reel shoot', 'Shoot a Justin Bieber "show you off" style reel.', 40, true),
    (scooter, 'Vlog', 'Group-wide vlog of the day.', 50, true);

  insert into world_events (group_id, host_id, title, spot_label, scheduled_at, min_attendees)
    values (g.id, m.id, 'PPT Night', 'The house', (d + time '20:00') at time zone g.timezone, 2)
    returning id into ppt;
  for x in select * from members where group_id = g.id order by display_name loop
    insert into quests (event_id, title, description, xp, assigned_to) values
      (ppt, 'Presentation: ' || x.display_name,
       'Present your allotted niche topic. It can be ass, but no AI allowed. You have to present and talk. Another member confirms.',
       50, x.id);
  end loop;

  insert into world_events (group_id, host_id, title, spot_label, scheduled_at, min_attendees)
    values (g.id, m.id, 'House Party', 'The house', (d + time '21:00') at time zone g.timezone, 2)
    returning id into party;
  insert into quests (event_id, title, description, xp, group_wide) values
    (party, 'Minecraft one shot', 'Finish the Minecraft one shot together.', 40, true),
    (party, 'Cook food', 'Cook together. The host draws who eats which dish and reveals it.', 30, true);
  insert into quests (event_id, title, description, xp, group_wide, counter_target, counter_unit) values
    (party, 'Monopoly: 20 rounds', 'Log the rounds played as you go. Completes at 20.', 40, true, 20, 'rounds');
  insert into quests (event_id, title, description, xp) values
    (party, 'Delete Insta and Snapchat', 'Delete both apps. Everyone does their own and taps it done.', 40);
end $$;

revoke all on all functions in schema public from public, anon, authenticated;
revoke all on all tables in schema public from anon, authenticated;
