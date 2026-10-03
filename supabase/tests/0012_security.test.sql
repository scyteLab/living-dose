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
insert into auth.users (id) values ('9a000000-0000-0000-0000-000000000001'), ('9c000000-0000-0000-0000-000000000003') on conflict do nothing;
update auth.users set raw_app_meta_data = '{"role":"staff"}' where id = '9c000000-0000-0000-0000-000000000003';
create temporary table pv as select
  '{"name":"Ada","phone":"+2348012345678","street":"12 Admiralty Way","area":"Lekki","city":"Lagos","state":"Lagos"}'::jsonb as addr,
  (lagos_today() + 1)::text || '|afternoon' as slot;
create temporary table pay_ids (k text primary key, v text);
grant select on pv to authenticated; grant all on pay_ids to authenticated;

set role authenticated;
\echo '--- PAYMENTS ---'
select act_as('9a000000-0000-0000-0000-000000000001');
select expect_error($$select place_order('[{"productId":"ugu","qty":1}]', (select addr from pv), (select slot from pv), null, 'bitcoin')$$, 'invalid-payment');
insert into pay_ids select 'card', place_order('[{"productId":"ugu","qty":2}]', (select addr from pv), (select slot from pv), null, 'paystack') ->> 'id';
insert into pay_ids select 'cod', place_order('[{"productId":"ugu","qty":1}]', (select addr from pv), (select slot from pv)) ->> 'id';
select verify((select payment = 'paystack' and payment_status = 'pending' from orders where id = (select v from pay_ids where k='card')), 'a pay-now order waits for payment');
select verify((select payment_status = 'dueOnDelivery' from orders where id = (select v from pay_ids where k='cod')), 'pay on delivery still works');
select expect_error($$select mark_order_paid('x', 1, 'NGN', '{}')$$, 'permission denied');
select expect_error($$insert into payments (order_id, user_id, reference, amount_kobo) values ((select v from pay_ids where k='card'), auth.uid(), 'FAKE', 100)$$, 'row-level security');
update orders set payment_status = 'paid' where id = (select v from pay_ids where k='card');  -- quietly changes nothing
select verify((select payment_status = 'pending' from orders where id = (select v from pay_ids where k='card')), 'members cannot mark their own order paid');
select act_as('9c000000-0000-0000-0000-000000000003', '{"role":"staff"}');
select expect_error($$select set_order_status((select v from pay_ids where k='card'), 'packed')$$, 'awaiting-payment');

-- The paystack-init function (service role) records the payment it starts
reset role;
insert into payments (order_id, user_id, reference, amount_kobo)
  select id, user_id, id || '-1', total::bigint * 100 from orders where id = (select v from pay_ids where k='card');
select verify(mark_order_paid('NOPE', 100, 'NGN', '{}') = 'unknown-reference', 'unknown references are ignored');
select verify(mark_order_paid((select v || '-1' from pay_ids where k='card'), 50, 'NGN', '{}') = 'amount-mismatch', 'a wrong amount does not mark the order paid');
select verify((select payment_status = 'pending' from orders where id = (select v from pay_ids where k='card')), 'order still unpaid after a wrong amount');
update payments set status = 'initiated' where reference = (select v || '-1' from pay_ids where k='card');
select verify(mark_order_paid((select v || '-1' from pay_ids where k='card'), (select total::bigint * 100 from orders where id = (select v from pay_ids where k='card')), 'USD', '{}') = 'amount-mismatch', 'a different currency does not count');
update payments set status = 'initiated' where reference = (select v || '-1' from pay_ids where k='card');
select verify(mark_order_paid((select v || '-1' from pay_ids where k='card'), (select total::bigint * 100 from orders where id = (select v from pay_ids where k='card')), 'NGN', '{"ok":true}') = 'paid', 'the exact amount marks it paid');
select verify(mark_order_paid((select v || '-1' from pay_ids where k='card'), (select total::bigint * 100 from orders where id = (select v from pay_ids where k='card')), 'NGN', '{}') = 'already-paid', 'a repeated notification is harmless');
select verify((select payment_status = 'paid' and paid from orders where id = (select v from pay_ids where k='card')), 'order is paid');
set role authenticated;
select act_as('9a000000-0000-0000-0000-000000000001');
select verify((select count(*) = 1 and bool_and(status = 'success') from payments), 'the member sees their payment');
select act_as('9c000000-0000-0000-0000-000000000003', '{"role":"staff"}');
select verify(set_order_status((select v from pay_ids where k='card'), 'packed') ->> 'status' = 'packed', 'staff can pack once paid');
select verify(set_order_status((select v from pay_ids where k='cod'), 'packed') ->> 'status' = 'packed', 'pay-on-delivery orders pack as before');
