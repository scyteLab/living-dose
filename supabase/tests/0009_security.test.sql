\set ON_ERROR_STOP 1
\pset tuples_only on
-- Test users
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'ada@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'bola@example.com'),
  ('33333333-3333-3333-3333-333333333333', 'staff@example.com');
update auth.users set raw_app_meta_data = '{"role":"staff"}' where id = '33333333-3333-3333-3333-333333333333';

-- Runs a statement and checks it fails with the expected message
create or replace function public.expect_error(stmt text, expected text) returns text language plpgsql as $$
begin
  execute stmt;
  return 'FAIL (no error): ' || expected;
exception when others then
  if sqlerrm like '%' || expected || '%' then return 'ok   ' || expected; end if;
  return 'FAIL expected "' || expected || '" got "' || sqlerrm || '"';
end $$;
create or replace function public.verify(ok boolean, label text) returns text language sql as $$
  select case when ok then 'ok   ' else 'FAIL ' end || label
$$;
grant execute on function public.expect_error(text, text), public.verify(boolean, text) to authenticated;

create or replace function public.act_as(uid text, role text default '') returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'app_metadata', json_build_object('role', role))::text, false);
end $$;
grant execute on function public.act_as(text, text) to authenticated;

-- Handy values
create temporary table v as select
  '{"name":"Ada","phone":"+2348012345678","street":"12 Admiralty Way","area":"Lekki","city":"Lagos","state":"Lagos"}'::jsonb as addr,
  (lagos_today() + 1)::text || '|afternoon' as slot,
  -- next Monday 10:00 Lagos (Funmi works Mon 9–17), at least a day away
  ((date_trunc('week', (now() at time zone 'Africa/Lagos')) + interval '7 days' + interval '10 hours') at time zone 'Africa/Lagos') as monday10;
grant select on v to authenticated;

set role authenticated;

\echo '--- ORDERS ---'
select act_as('');
select expect_error($$select place_order('[{"productId":"ugu","qty":1}]', (select addr from v), (select slot from v))$$, 'not-signed-in');
select act_as('11111111-1111-1111-1111-111111111111');
select expect_error($$insert into orders (id,user_id,subtotal,delivery,total,address,slot) values ('LD-HACK01','11111111-1111-1111-1111-111111111111',1,0,1,'{}','x')$$, 'row-level security');
select expect_error($$insert into order_items (order_id,product_id,name,unit,price,qty) values ('LD-HACK01','ugu','x','x',1,1)$$, 'row-level security');
select verify((place_order('[{"productId":"ugu","qty":3,"price":1}]', (select addr from v), (select slot from v)) ->> 'total')::int = 3 * (select price from products where id='ugu') + 1500,
  'price taken from the server, not the browser (sent price ignored)');
select verify((place_order('[{"productId":"fish-croaker","qty":20}]', (select addr from v), (select slot from v)) ->> 'delivery')::int = 0, 'free delivery from ₦25,000');
select expect_error($$select place_order('[{"productId":"ugu","qty":0}]', (select addr from v), (select slot from v))$$, 'invalid-quantity');
select expect_error($$select place_order('[{"productId":"ugu","qty":21}]', (select addr from v), (select slot from v))$$, 'invalid-quantity');
select expect_error($$select place_order('[{"productId":"ugu","qty":"2; drop table orders"}]', (select addr from v), (select slot from v))$$, 'invalid-quantity');
select expect_error($$select place_order('[{"productId":"gold-bar","qty":1}]', (select addr from v), (select slot from v))$$, 'unavailable-product');
select expect_error($$select place_order('[{"productId":"ugu","qty":1},{"productId":"ugu","qty":1}]', (select addr from v), (select slot from v))$$, 'duplicate-item');
select expect_error($$select place_order('[]', (select addr from v), (select slot from v))$$, 'empty-basket');
select expect_error($$select place_order('[{"productId":"ugu","qty":1}]', (select addr - 'phone' from v), (select slot from v))$$, 'incomplete-address');
select expect_error($$select place_order('[{"productId":"ugu","qty":1}]', (select jsonb_set(addr,'{state}','"Kano"') from v), (select slot from v))$$, 'outside-delivery-area');
select expect_error($$select place_order('[{"productId":"ugu","qty":1}]', (select addr from v), lagos_today()::text || '|morning')$$, 'invalid-slot');
select expect_error($$select place_order('[{"productId":"ugu","qty":1}]', (select addr from v), (lagos_today()+6)::text || '|morning')$$, 'invalid-slot');
select expect_error($$select place_order('[{"productId":"ugu","qty":1}]', (select addr from v), (lagos_today()+1)::text || '|midnight')$$, 'invalid-slot');
select verify((select count(*) from orders) = 2, 'Ada sees her 2 orders');
select verify((select count(*) from order_items) = 2, 'and their items');
select act_as('22222222-2222-2222-2222-222222222222');
select verify((select count(*) from orders) = 0, 'Bola cannot see Ada''s orders');
select expect_error($$select set_order_status((select id from orders limit 1), 'packed')$$, 'not-allowed');
select act_as('33333333-3333-3333-3333-333333333333', 'staff');
select verify((select count(*) from orders) = 2, 'staff see every order');
create temporary table o1 as select id from orders where total < 25000 limit 1;
select verify(set_order_status((select id from o1), 'packed') ->> 'status' = 'packed', 'staff: placed → packed');
select expect_error($$select set_order_status((select id from o1), 'delivered')$$, 'invalid-step');
select verify(set_order_status((select id from o1), 'onTheWay') ->> 'status' = 'onTheWay', 'staff: packed → on the way');
select verify(set_order_status((select id from o1), 'delivered') ->> 'status' = 'delivered', 'staff: on the way → delivered');
select verify((select paid and jsonb_array_length(history) = 4 from orders where id = (select id from o1)), 'delivered order marked paid, with full history');
select expect_error($$select set_order_status((select id from o1), 'cancelled')$$, 'order-closed');
select verify((select count(*) from staff_activity) = 3, 'every staff change logged');

\echo '--- APPOINTMENTS ---'
select act_as('11111111-1111-1111-1111-111111111111');
select expect_error($$insert into appointments (id,user_id,professional_id,type,starts_at,fee) values ('LC-HACK01','11111111-1111-1111-1111-111111111111','funmi-adeyemi','video',now()+interval '2 days',0)$$, 'row-level security');
create temporary table a1 as select book_appointment('funmi-adeyemi', 'video', (select monday10 from v), 'plan', 'Portions', true, 'Ada') as r;
select verify((select (r ->> 'fee')::int = 8000 from a1), 'booked; fee set by the server (₦8,000 video)');
select verify((select count(*) = 1 from appointments), 'Ada sees her booking');
select act_as('22222222-2222-2222-2222-222222222222');
select expect_error($$select book_appointment('funmi-adeyemi', 'video', (select monday10 from v))$$, 'slot-taken');
select verify((select count(*) = 0 from appointments), 'Bola cannot see Ada''s booking');
select verify((select count(*) = 1 from booked_slots(array['funmi-adeyemi'])), 'but can see the time is taken');
select expect_error($$select book_appointment('funmi-adeyemi', 'video', (select monday10 from v) + interval '15 minutes')$$, 'invalid-time');
select expect_error($$select book_appointment('funmi-adeyemi', 'video', (select monday10 from v) - interval '2 hours')$$, 'outside-hours');
select expect_error($$select book_appointment('funmi-adeyemi', 'video', (select monday10 from v) - interval '1 day')$$, 'outside-hours');
select expect_error($$select book_appointment('funmi-adeyemi', 'video', (select monday10 from v) + interval '7 hours')$$, 'outside-hours');
select expect_error($$select book_appointment('funmi-adeyemi', 'video', date_trunc('hour', now()) + interval '30 minutes')$$, 'too-soon');
select expect_error($$select book_appointment('funmi-adeyemi', 'video', (select monday10 from v) + interval '21 days')$$, 'too-far-ahead');
select expect_error($$select book_appointment('funmi-adeyemi', 'house-call', (select monday10 from v) + interval '1 hour')$$, 'invalid-type');
select expect_error($$select book_appointment('nobody', 'video', (select monday10 from v) + interval '1 hour')$$, 'unavailable-professional');
reset role;
insert into professional_schedules (professional_id, hours, days_off)
  select 'funmi-adeyemi', schedule, array[((select monday10 from v) at time zone 'Africa/Lagos')::date] from professionals where id = 'funmi-adeyemi';
set role authenticated;
select act_as('22222222-2222-2222-2222-222222222222');
select expect_error($$select book_appointment('funmi-adeyemi', 'video', (select monday10 from v) + interval '1 hour')$$, 'day-off');
select act_as('11111111-1111-1111-1111-111111111111');
select expect_error($$select cancel_appointment('LC-NOPE00')$$, 'not-found');
select act_as('22222222-2222-2222-2222-222222222222');
select expect_error($$select cancel_appointment((select r->>'id' from a1))$$, 'not-found');
select act_as('11111111-1111-1111-1111-111111111111');
select verify(cancel_appointment((select r->>'id' from a1)) ->> 'status' = 'cancelled', 'Ada cancels her own booking');
select expect_error($$select cancel_appointment((select r->>'id' from a1))$$, 'not-booked');
reset role; delete from professional_schedules; set role authenticated;
select act_as('22222222-2222-2222-2222-222222222222');
select verify(book_appointment('funmi-adeyemi', 'video', (select monday10 from v)) ? 'id', 'the freed slot can be booked again');
select verify(book_appointment('chidi-okafor', 'video', (select monday10 from v) + interval '1 day') ? 'id', 'booking 2');
select verify(book_appointment('funmi-adeyemi', 'voice', (select monday10 from v) + interval '1 day') ? 'id', 'booking 3');
select verify(book_appointment('funmi-adeyemi', 'voice', (select monday10 from v) + interval '1 day 1 hour') ? 'id', 'booking 4');
select verify(book_appointment('funmi-adeyemi', 'voice', (select monday10 from v) + interval '1 day 2 hours') ? 'id', 'booking 5');
select expect_error($$select book_appointment('funmi-adeyemi', 'voice', (select monday10 from v) + interval '1 day 3 hours')$$, 'too-many-bookings');
select expect_error($$select book_appointment('kemi-alade', 'chat', (select monday10 from v))$$, 'invalid-type');
