create table groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null default 'UTC',
  night_start_hour int not null default 21 check (night_start_hour between 0 and 23),
  night_end_hour int not null default 5 check (night_end_hour between 0 and 23),
  daily_target_minutes int not null default 120 check (daily_target_minutes > 0),
  weekly_target_minutes int not null default 600 check (weekly_target_minutes > 0),
  template_loaded boolean not null default false,
  created_at timestamptz not null default now()
);

create table members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  display_name text not null,
  xp int not null default 0,
  role text not null default 'member' check (role in ('admin', 'member')),
  access_key text not null unique check (length(access_key) >= 24),
  created_at timestamptz not null default now()
);
create index members_group_idx on members (group_id);

create table time_entries (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  note text
);
create unique index time_entries_one_open on time_entries (member_id) where ended_at is null;
create index time_entries_group_idx on time_entries (group_id, started_at);

create table world_events (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  host_id uuid not null references members(id),
  title text not null,
  spot_label text not null,
  scheduled_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'gathering', 'active', 'completed')),
  min_attendees int not null default 2 check (min_attendees >= 1),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create index world_events_group_idx on world_events (group_id, scheduled_at);

create table event_attendance (
  event_id uuid not null references world_events(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  arrived_at timestamptz not null default now(),
  primary key (event_id, member_id)
);

create table quests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references world_events(id) on delete cascade,
  title text not null,
  description text not null default '',
  xp int not null default 10 check (xp >= 0),
  group_wide boolean not null default false,
  counter_target int check (counter_target > 0),
  counter_unit text,
  assigned_to uuid references members(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index quests_event_idx on quests (event_id);

create table quest_completions (
  quest_id uuid not null references quests(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  count int not null default 0,
  completed_at timestamptz,
  confirmed_by uuid references members(id),
  primary key (quest_id, member_id)
);

create table topic_assignments (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  event_id uuid not null references world_events(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  kind text not null default 'topic' check (kind in ('topic', 'dish')),
  topic text not null,
  revealed boolean not null default true,
  unique (event_id, member_id, kind)
);

create table group_targets (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  label text not null,
  unit text not null,
  goal numeric(12, 2) not null check (goal > 0),
  progress numeric(12, 2) not null default 0,
  created_at timestamptz not null default now()
);

create table target_contributions (
  id uuid primary key default gen_random_uuid(),
  target_id uuid not null references group_targets(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  created_at timestamptz not null default now()
);
create index target_contributions_target_idx on target_contributions (target_id);

create table challenges (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  issuer_id uuid not null references members(id) on delete cascade,
  target_id uuid not null references members(id) on delete cascade,
  prompt text not null,
  stake_xp int not null default 10 check (stake_xp between 0 and 500),
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'expired', 'proposed', 'disputed', 'resolved')),
  expires_at timestamptz not null,
  proposed_winner_id uuid references members(id),
  winner_id uuid references members(id),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  resolved_at timestamptz,
  check (issuer_id <> target_id)
);
create index challenges_group_idx on challenges (group_id, created_at desc);

-- All access goes through the server with the service role key.
-- RLS is on and no policies exist, so the anon and authenticated roles read nothing.
alter table groups enable row level security;
alter table members enable row level security;
alter table time_entries enable row level security;
alter table world_events enable row level security;
alter table event_attendance enable row level security;
alter table quests enable row level security;
alter table quest_completions enable row level security;
alter table topic_assignments enable row level security;
alter table group_targets enable row level security;
alter table target_contributions enable row level security;
alter table challenges enable row level security;

create function _get_member(p_member uuid) returns members
language plpgsql stable set search_path = public as $$
declare m members;
begin
  select * into m from members where id = p_member;
  if not found then raise exception 'Unknown member'; end if;
  return m;
end $$;

create function _get_event(p_event uuid, p_group uuid) returns world_events
language plpgsql stable set search_path = public as $$
declare e world_events;
begin
  select * into e from world_events where id = p_event and group_id = p_group;
  if not found then raise exception 'Event not found'; end if;
  return e;
end $$;

create function _require_host(p_member uuid, p_event uuid) returns world_events
language plpgsql stable set search_path = public as $$
declare m members; e world_events;
begin
  m := _get_member(p_member);
  e := _get_event(p_event, m.group_id);
  if e.host_id <> m.id then raise exception 'Only the host can do this'; end if;
  return e;
end $$;

create function clock_in(p_member uuid, p_note text default null) returns void
language plpgsql set search_path = public as $$
declare m members;
begin
  m := _get_member(p_member);
  if exists (select 1 from time_entries where member_id = m.id and ended_at is null) then
    raise exception 'Already clocked in';
  end if;
  insert into time_entries (group_id, member_id, note) values (m.group_id, m.id, nullif(trim(p_note), ''));
end $$;

create function clock_out(p_member uuid, p_note text default null) returns void
language plpgsql set search_path = public as $$
declare m members; n int;
begin
  m := _get_member(p_member);
  update time_entries
    set ended_at = now(), note = coalesce(nullif(trim(p_note), ''), note)
    where member_id = m.id and ended_at is null;
  get diagnostics n = row_count;
  if n = 0 then raise exception 'Not clocked in'; end if;
end $$;

create function create_world_event(
  p_member uuid, p_title text, p_spot text, p_scheduled_at timestamptz, p_min_attendees int default 2
) returns uuid
language plpgsql set search_path = public as $$
declare m members; new_id uuid;
begin
  m := _get_member(p_member);
  if nullif(trim(p_title), '') is null or nullif(trim(p_spot), '') is null then
    raise exception 'Title and spot are required';
  end if;
  insert into world_events (group_id, host_id, title, spot_label, scheduled_at, min_attendees)
    values (m.group_id, m.id, trim(p_title), trim(p_spot), p_scheduled_at, greatest(coalesce(p_min_attendees, 2), 1))
    returning id into new_id;
  return new_id;
end $$;

create function mark_here(p_member uuid, p_event uuid) returns void
language plpgsql set search_path = public as $$
declare m members; e world_events;
begin
  m := _get_member(p_member);
  e := _get_event(p_event, m.group_id);
  if e.status = 'completed' then raise exception 'Event is over'; end if;
  insert into event_attendance (event_id, member_id) values (e.id, m.id) on conflict do nothing;
  if e.status = 'scheduled' then
    update world_events set status = 'gathering' where id = e.id;
  end if;
end $$;

create function start_world_event(p_member uuid, p_event uuid) returns void
language plpgsql set search_path = public as $$
declare e world_events; here int;
begin
  e := _require_host(p_member, p_event);
  if e.status not in ('scheduled', 'gathering') then raise exception 'Event already started'; end if;
  select count(*) into here from event_attendance where event_id = e.id;
  if here < e.min_attendees then
    raise exception 'Need at least % members here (% so far)', e.min_attendees, here;
  end if;
  update world_events set status = 'active', started_at = now() where id = e.id;
end $$;

create function complete_world_event(p_member uuid, p_event uuid) returns void
language plpgsql set search_path = public as $$
declare e world_events;
begin
  e := _require_host(p_member, p_event);
  if e.status <> 'active' then raise exception 'Event is not active'; end if;
  update world_events set status = 'completed', completed_at = now() where id = e.id;
end $$;

create function add_quest(
  p_member uuid, p_event uuid, p_title text, p_description text, p_xp int,
  p_group_wide boolean default false, p_counter_target int default null,
  p_counter_unit text default null, p_assigned_to uuid default null
) returns void
language plpgsql set search_path = public as $$
declare e world_events;
begin
  e := _require_host(p_member, p_event);
  if e.status = 'completed' then raise exception 'Event is over'; end if;
  if nullif(trim(p_title), '') is null then raise exception 'Quest title is required'; end if;
  if p_assigned_to is not null and not exists (
    select 1 from members where id = p_assigned_to and group_id = e.group_id
  ) then raise exception 'Assignee is not in this group'; end if;
  insert into quests (event_id, title, description, xp, group_wide, counter_target, counter_unit, assigned_to)
    values (e.id, trim(p_title), coalesce(p_description, ''), greatest(coalesce(p_xp, 0), 0),
            coalesce(p_group_wide, false), p_counter_target, nullif(trim(p_counter_unit), ''), p_assigned_to);
end $$;

create function _record_quest(p_q quests, p_member uuid, p_count int, p_confirmer uuid) returns void
language plpgsql set search_path = public as $$
declare done boolean; n int;
begin
  done := (p_q.counter_target is null and p_q.counter_unit is null)
    or coalesce(p_count, 0) >= coalesce(p_q.counter_target, 1);
  insert into quest_completions (quest_id, member_id, count)
    values (p_q.id, p_member, greatest(coalesce(p_count, 0), 0))
    on conflict (quest_id, member_id) do update set count = excluded.count
    where quest_completions.completed_at is null;
  if done then
    update quest_completions set completed_at = now(), confirmed_by = p_confirmer
      where quest_id = p_q.id and member_id = p_member and completed_at is null;
    get diagnostics n = row_count;
    if n > 0 then update members set xp = xp + p_q.xp where id = p_member; end if;
  end if;
end $$;

create function complete_quest(p_member uuid, p_quest uuid, p_count int default null) returns void
language plpgsql set search_path = public as $$
declare m members; q quests; e world_events; a uuid;
begin
  m := _get_member(p_member);
  select * into q from quests where id = p_quest;
  if not found then raise exception 'Quest not found'; end if;
  e := _get_event(q.event_id, m.group_id);
  if e.status <> 'active' then raise exception 'Event is not active'; end if;

  if q.assigned_to is not null then
    if q.assigned_to = m.id then raise exception 'Another member must confirm this quest'; end if;
    perform _record_quest(q, q.assigned_to, p_count, m.id);
    return;
  end if;

  if not exists (select 1 from event_attendance where event_id = e.id and member_id = m.id) then
    raise exception 'Tap "I''m here" first';
  end if;

  if q.group_wide then
    for a in select member_id from event_attendance where event_id = e.id loop
      perform _record_quest(q, a, p_count, m.id);
    end loop;
  else
    perform _record_quest(q, m.id, p_count, null);
  end if;
end $$;

create function assign_random(p_member uuid, p_event uuid, p_kind text, p_items text[]) returns void
language plpgsql set search_path = public as $$
declare e world_events; cleaned text[]; n_members int;
begin
  e := _require_host(p_member, p_event);
  if p_kind not in ('topic', 'dish') then raise exception 'Bad kind'; end if;
  select array_agg(trim(i)) into cleaned from unnest(p_items) i where nullif(trim(i), '') is not null;
  select count(*) into n_members from members where group_id = e.group_id;
  if coalesce(array_length(cleaned, 1), 0) < n_members then
    raise exception 'Need at least % items, one per member', n_members;
  end if;
  delete from topic_assignments where event_id = e.id and kind = p_kind;
  insert into topic_assignments (group_id, event_id, member_id, kind, topic, revealed)
    select e.group_id, e.id, m.id, p_kind, t.item, p_kind = 'topic'
    from (select id, row_number() over (order by random()) rn from members where group_id = e.group_id) m
    join (select item, row_number() over (order by random()) rn from unnest(cleaned) item) t using (rn);
end $$;

create function reveal_assignments(p_member uuid, p_event uuid, p_kind text) returns void
language plpgsql set search_path = public as $$
declare e world_events;
begin
  e := _require_host(p_member, p_event);
  update topic_assignments set revealed = true where event_id = e.id and kind = p_kind;
end $$;

create function log_contribution(p_member uuid, p_target uuid, p_amount numeric) returns void
language plpgsql set search_path = public as $$
declare m members; n int;
begin
  m := _get_member(p_member);
  if p_amount is null or p_amount <= 0 then raise exception 'Amount must be positive'; end if;
  update group_targets set progress = progress + p_amount where id = p_target and group_id = m.group_id;
  get diagnostics n = row_count;
  if n = 0 then raise exception 'Target not found'; end if;
  insert into target_contributions (target_id, member_id, amount) values (p_target, m.id, p_amount);
end $$;

create function is_night_window(p_now timestamptz, p_tz text, p_start int, p_end int) returns boolean
language sql immutable set search_path = public as $$
  select case
    when p_start <= p_end then h >= p_start and h < p_end
    else h >= p_start or h < p_end
  end
  from (select extract(hour from p_now at time zone p_tz)::int as h) x
$$;

create function issue_challenge(
  p_member uuid, p_target uuid, p_prompt text, p_stake int default 10, p_window_minutes int default 15
) returns void
language plpgsql set search_path = public as $$
declare m members; g groups;
begin
  m := _get_member(p_member);
  select * into g from groups where id = m.group_id;
  if not is_night_window(now(), g.timezone, g.night_start_hour, g.night_end_hour) then
    raise exception 'Challenges open at %:00 (% time)', lpad(g.night_start_hour::text, 2, '0'), g.timezone;
  end if;
  if p_target = m.id then raise exception 'You cannot challenge yourself'; end if;
  if not exists (select 1 from members where id = p_target and group_id = m.group_id) then
    raise exception 'Target is not in your group';
  end if;
  if nullif(trim(p_prompt), '') is null then raise exception 'Prompt is required'; end if;
  insert into challenges (group_id, issuer_id, target_id, prompt, stake_xp, expires_at)
    values (m.group_id, m.id, p_target, trim(p_prompt), least(greatest(coalesce(p_stake, 0), 0), 500),
            now() + make_interval(mins => least(greatest(coalesce(p_window_minutes, 15), 1), 240)));
end $$;

create function respond_challenge(p_member uuid, p_challenge uuid, p_accept boolean) returns void
language plpgsql set search_path = public as $$
declare m members; c challenges;
begin
  m := _get_member(p_member);
  select * into c from challenges where id = p_challenge and group_id = m.group_id for update;
  if not found then raise exception 'Challenge not found'; end if;
  if c.target_id <> m.id then raise exception 'Only the target can respond'; end if;
  if c.status <> 'pending' or c.expires_at <= now() then raise exception 'Challenge is no longer pending'; end if;
  update challenges
    set status = case when p_accept then 'accepted' else 'declined' end, responded_at = now()
    where id = c.id;
end $$;

create function resolve_challenge(
  p_member uuid, p_challenge uuid, p_action text, p_winner uuid default null
) returns void
language plpgsql set search_path = public as $$
declare m members; c challenges; n int;
begin
  m := _get_member(p_member);
  select * into c from challenges where id = p_challenge and group_id = m.group_id for update;
  if not found then raise exception 'Challenge not found'; end if;

  if p_action = 'propose' then
    if c.issuer_id <> m.id then raise exception 'Only the issuer picks the winner'; end if;
    if c.status not in ('accepted', 'disputed') then raise exception 'Challenge is not in play'; end if;
    if p_winner is null or p_winner not in (c.issuer_id, c.target_id) then
      raise exception 'Winner must be the issuer or the target';
    end if;
    update challenges set status = 'proposed', proposed_winner_id = p_winner where id = c.id;
  elsif p_action = 'confirm' then
    if c.target_id <> m.id then raise exception 'Only the target can confirm'; end if;
    update challenges
      set status = 'resolved', winner_id = proposed_winner_id, resolved_at = now()
      where id = c.id and status = 'proposed';
    get diagnostics n = row_count;
    if n = 0 then raise exception 'Nothing to confirm'; end if;
    update members set xp = xp + c.stake_xp where id = c.proposed_winner_id;
  elsif p_action = 'dispute' then
    if c.target_id <> m.id then raise exception 'Only the target can dispute'; end if;
    if c.status <> 'proposed' then raise exception 'Nothing to dispute'; end if;
    update challenges set status = 'disputed' where id = c.id;
  else
    raise exception 'Unknown action';
  end if;
end $$;

create function load_saturday_template(p_member uuid) returns void
language plpgsql set search_path = public as $$
declare
  m members; g groups; d date; scooter uuid; party uuid; x members;
begin
  m := _get_member(p_member);
  if m.role <> 'admin' then raise exception 'Only the admin can load the template'; end if;
  select * into g from groups where id = m.group_id for update;
  if g.template_loaded then raise exception 'Template already loaded'; end if;
  update groups set template_loaded = true where id = g.id;

  d := (now() at time zone g.timezone)::date;
  d := d + ((6 - extract(dow from d)::int + 7) % 7);

  insert into group_targets (group_id, label, unit, goal) values
    (g.id, 'Run', 'km', 20),
    (g.id, 'Squats', 'reps', 300),
    (g.id, 'Free throw line shots', 'shots', 1500);

  insert into world_events (group_id, host_id, title, spot_label, scheduled_at, min_attendees)
    values (g.id, m.id, 'Scooter Day', 'Scooter rental spot', (d + time '10:00') at time zone g.timezone, 2)
    returning id into scooter;
  insert into quests (event_id, title, description, xp, group_wide) values
    (scooter, 'Rent scooters and do stuff', 'Rent the scooters and go explore together.', 30, true),
    (scooter, 'Airport stop', 'Everyone makes the airport stop.', 20, true),
    (scooter, 'Reel shoot', 'Shoot a Justin Bieber "show you off" style reel.', 40, true),
    (scooter, 'Vlog', 'Group-wide vlog of the day.', 50, true);

  insert into world_events (group_id, host_id, title, spot_label, scheduled_at, min_attendees)
    values (g.id, m.id, 'House Party', 'The house', (d + time '21:00') at time zone g.timezone, 2)
    returning id into party;
  insert into quests (event_id, title, description, xp, counter_target, counter_unit) values
    (party, '20 shots (MM Neat)', 'Log your own count as you go.', 40, 20, 'shots');
  insert into quests (event_id, title, description, xp, group_wide) values
    (party, 'Cook food', 'Cook together. The host draws who eats which dish and reveals it.', 30, true);
  for x in select * from members where group_id = g.id order by display_name loop
    insert into quests (event_id, title, description, xp, assigned_to) values
      (party, 'Presentation: ' || x.display_name,
       'Present your allotted niche topic. It can be ass, but no AI allowed. You have to present and talk. Another member confirms.',
       50, x.id);
  end loop;
end $$;

revoke all on all functions in schema public from public, anon, authenticated;
grant execute on all functions in schema public to service_role;
revoke all on all tables in schema public from anon, authenticated;
