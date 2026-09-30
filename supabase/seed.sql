-- Demo data: one group, three members and the "Ballin On Sats" Saturday template.
-- For a real group use `pnpm seed:members` instead. Run after 0001_init.sql.
do $$
declare
  g uuid;
  admin_id uuid;
begin
  insert into groups (name, timezone) values ('Ballin On Sats (demo)', 'Asia/Kolkata') returning id into g;

  insert into members (group_id, display_name, role, access_key)
    values (g, 'Demo Admin', 'admin', replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''))
    returning id into admin_id;
  insert into members (group_id, display_name, access_key) values
    (g, 'Demo Two', replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')),
    (g, 'Demo Three', replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''));

  perform load_saturday_template(admin_id);
end $$;

select display_name, '/k/' || access_key as personal_link from members where group_id in (
  select id from groups where name = 'Ballin On Sats (demo)'
);
