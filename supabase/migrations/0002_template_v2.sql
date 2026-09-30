-- Updated "Ballin On Sats" plan: adds bottle flips, Minecraft one shot, delete Insta and Snap, Monopoly; drops the shots quest.
create or replace function load_saturday_template(p_member uuid) returns void
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
    values (g.id, m.id, 'House Party', 'The house', (d + time '21:00') at time zone g.timezone, 2)
    returning id into party;
  insert into quests (event_id, title, description, xp, group_wide) values
    (party, 'Minecraft one shot', 'Finish the Minecraft one shot together.', 40, true),
    (party, 'Cook food', 'Cook together. The host draws who eats which dish and reveals it.', 30, true);
  insert into quests (event_id, title, description, xp, group_wide, counter_target, counter_unit) values
    (party, 'Monopoly: 20 rounds', 'Log the rounds played as you go. Completes at 20.', 40, true, 20, 'rounds');
  insert into quests (event_id, title, description, xp) values
    (party, 'Delete Insta and Snapchat', 'Delete both apps. Everyone does their own and taps it done.', 40);
  for x in select * from members where group_id = g.id order by display_name loop
    insert into quests (event_id, title, description, xp, assigned_to) values
      (party, 'Presentation: ' || x.display_name,
       'Present your allotted niche topic. It can be ass, but no AI allowed. You have to present and talk. Another member confirms.',
       50, x.id);
  end loop;
end $$;
