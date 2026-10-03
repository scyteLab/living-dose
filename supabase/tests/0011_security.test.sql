\set ON_ERROR_STOP 1
\pset tuples_only on
create or replace function public.expect_error(stmt text, expected text) returns text language plpgsql as $$
begin
  execute stmt; return 'FAIL (no error): ' || expected;
exception when others then
  if sqlerrm like '%' || expected || '%' then return 'ok   ' || expected; end if;
  return 'FAIL expected "' || expected || '" got "' || sqlerrm || '"';
end $$;
create or replace function public.verify(ok boolean, label text) returns text language sql as $$
  select case when ok then 'ok   ' else 'FAIL ' end || label $$;
drop function if exists public.act_as(text, text);
create or replace function public.act_as(uid text, app jsonb default '{}') returns void language plpgsql as $$
begin perform set_config('request.jwt.claims', json_build_object('sub', uid, 'app_metadata', app)::text, false); end $$;
grant execute on function public.expect_error(text, text), public.verify(boolean, text), public.act_as(text, jsonb) to authenticated;
insert into auth.users (id) values ('5a000000-0000-0000-0000-000000000001'), ('5b000000-0000-0000-0000-000000000002') on conflict do nothing;

set role authenticated;
\echo '--- PERSONAL SYNC ---'
select act_as('5a000000-0000-0000-0000-000000000001');
insert into user_documents (user_id, kind, data, updated_at) values (auth.uid(), 'habits', '{"2026-10-01":{"water":5}}', '2000-01-01');
select verify((select updated_at > now() - interval '1 minute' from user_documents where kind = 'habits'), 'the server sets the time, not the device');
select expect_error($$insert into user_documents (user_id, kind, data) values ('5b000000-0000-0000-0000-000000000002', 'habits', '{}')$$, 'row-level security');
select expect_error($$insert into user_documents (user_id, kind, data) values (auth.uid(), 'passwords', '{}')$$, 'user_documents_kind_check');
select expect_error($$insert into user_documents (user_id, kind, data) values (auth.uid(), 'diary', jsonb_build_object('x', repeat('a', 300001)))$$, 'user_documents_size');
update user_documents set data = '{"2026-10-01":{"water":8}}' where kind = 'habits';
select verify((select (data -> '2026-10-01' ->> 'water')::int = 8 from user_documents where kind = 'habits'), 'a member updates their own data');
select act_as('5b000000-0000-0000-0000-000000000002');
select verify((select count(*) = 0 from user_documents), 'another member sees nothing');
update user_documents set data = '{}' where kind = 'habits';
delete from user_documents;
select act_as('5a000000-0000-0000-0000-000000000001');
select verify((select (data -> '2026-10-01' ->> 'water')::int = 8 from user_documents where kind = 'habits'), 'and cannot change or delete it');
select act_as('c0000000-0000-0000-0000-000000000003', '{"role":"staff"}');
select verify((select count(*) = 0 from user_documents), 'staff cannot read personal data either');
