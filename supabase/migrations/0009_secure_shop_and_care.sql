-- Living Dose: secure ordering and booking (server connection, phase 1)
-- Run after 0008 in Supabase: Dashboard → SQL Editor → paste → Run.
-- Then run supabase/seed/products.sql (and, for testing only, supabase/seed/sample_professionals.sql).
--
-- What this changes:
--   • Prices come only from the products table. The browser sends product IDs and
--     quantities; the server works out every price, the delivery fee and the total.
--   • Members can no longer write orders or appointments directly. They go through
--     place_order(), book_appointment() and cancel_appointment(), which check every rule.
--   • Two people can never book the same slot (checked here and by a unique index).
--   • Staff move orders on with set_order_status(), which only allows valid steps
--     and records who did what.

-- ============================================================ settings and catalogue

create table if not exists public.products (
  id          text primary key,
  name        text not null,
  unit        text not null,
  price       integer not null check (price >= 0),   -- naira
  active      boolean not null default true,
  updated_at  timestamptz not null default now()
);
alter table public.products enable row level security;
drop policy if exists "Products: anyone can read" on public.products;
create policy "Products: anyone can read" on public.products for select using (true);

create table if not exists public.shop_settings (
  id                  smallint primary key default 1 check (id = 1),
  delivery_fee        integer not null,
  free_delivery_from  integer not null,
  max_quantity        integer not null,
  days_ahead          integer not null,
  delivery_states     text[] not null
);
alter table public.shop_settings enable row level security;
drop policy if exists "Shop settings: anyone can read" on public.shop_settings;
create policy "Shop settings: anyone can read" on public.shop_settings for select using (true);

-- Booking rules (mirror src/config/care.js)
create table if not exists public.care_settings (
  id                        smallint primary key default 1 check (id = 1),
  slot_minutes              integer not null default 30,
  days_ahead                integer not null default 14,
  min_notice_minutes        integer not null default 60,
  free_cancellation_hours   integer not null default 4,
  max_upcoming_per_member   integer not null default 5
);
insert into public.care_settings (id) values (1) on conflict (id) do nothing;
alter table public.care_settings enable row level security;
drop policy if exists "Care settings: anyone can read" on public.care_settings;
create policy "Care settings: anyone can read" on public.care_settings for select using (true);

-- ============================================================ helpers

-- Easy-to-read reference codes (no 0/O or 1/I), e.g. LD-7KQ2MX
create or replace function public.short_code(prefix text)
returns text language sql volatile as $$
  select prefix || '-' || string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::int, 1), '')
  from generate_series(1, 6)
$$;

create or replace function public.lagos_today()
returns date language sql stable as $$ select (now() at time zone 'Africa/Lagos')::date $$;

-- ============================================================ orders

drop policy if exists "Orders: insert own" on public.orders;
drop policy if exists "Order items: insert own" on public.order_items;

alter table public.orders add column if not exists history jsonb not null default '[]';
alter table public.orders add column if not exists paid boolean not null default false;

create or replace function public.place_order(p_items jsonb, p_address jsonb, p_slot text, p_note text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid       uuid := auth.uid();
  v_settings  shop_settings;
  v_item      jsonb;
  v_product   products;
  v_qty       integer;
  v_subtotal  integer := 0;
  v_delivery  integer;
  v_lines     jsonb := '[]';
  v_order_id  text;
  v_date      date;
  v_field     text;
begin
  if v_uid is null then raise exception 'not-signed-in'; end if;
  select * into v_settings from shop_settings where id = 1;
  if not found then raise exception 'shop-not-configured'; end if;

  -- Items: product IDs and quantities only; prices come from the products table
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) = 0 then raise exception 'empty-basket'; end if;
  if jsonb_array_length(p_items) > 100 then raise exception 'too-many-items'; end if;
  if (select count(distinct x ->> 'productId') from jsonb_array_elements(p_items) x) <> jsonb_array_length(p_items) then
    raise exception 'duplicate-item';
  end if;
  for v_item in select * from jsonb_array_elements(p_items) loop
    if coalesce(v_item ->> 'qty', '') !~ '^[0-9]{1,3}$' then raise exception 'invalid-quantity'; end if;
    v_qty := (v_item ->> 'qty')::integer;
    if v_qty < 1 or v_qty > v_settings.max_quantity then raise exception 'invalid-quantity'; end if;
    select * into v_product from products where id = v_item ->> 'productId' and active;
    if not found then raise exception 'unavailable-product'; end if;
    v_subtotal := v_subtotal + v_product.price * v_qty;
    v_lines := v_lines || jsonb_build_object('product_id', v_product.id, 'name', v_product.name, 'unit', v_product.unit, 'price', v_product.price, 'qty', v_qty);
  end loop;

  -- Address: required fields, sensible lengths, and only where we deliver
  if jsonb_typeof(p_address) is distinct from 'object' or length(p_address::text) > 2000 then raise exception 'incomplete-address'; end if;
  foreach v_field in array array['name', 'phone', 'street', 'area', 'city', 'state'] loop
    if coalesce(trim(p_address ->> v_field), '') = '' then raise exception 'incomplete-address'; end if;
  end loop;
  if not (p_address ->> 'state' = any (v_settings.delivery_states)) then raise exception 'outside-delivery-area'; end if;

  -- Delivery slot: tomorrow up to days_ahead, in a known window
  if coalesce(p_slot, '') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}\|(morning|afternoon|evening)$' then raise exception 'invalid-slot'; end if;
  v_date := split_part(p_slot, '|', 1)::date;
  if v_date < lagos_today() + 1 or v_date > lagos_today() + v_settings.days_ahead then raise exception 'invalid-slot'; end if;

  if p_note is not null and char_length(p_note) > 300 then raise exception 'note-too-long'; end if;

  v_delivery := case when v_subtotal >= v_settings.free_delivery_from then 0 else v_settings.delivery_fee end;

  loop
    v_order_id := short_code('LD');
    begin
      insert into orders (id, user_id, status, subtotal, delivery, total, address, slot, payment, note, history)
      values (v_order_id, v_uid, 'placed', v_subtotal, v_delivery, v_subtotal + v_delivery, p_address, p_slot, 'payOnDelivery',
              nullif(trim(p_note), ''), jsonb_build_array(jsonb_build_object('status', 'placed', 'at', now())));
      exit;
    exception when unique_violation then
      -- extremely rare: the code already exists, so try another
    end;
  end loop;

  insert into order_items (order_id, product_id, name, unit, price, qty)
  select v_order_id, l ->> 'product_id', l ->> 'name', l ->> 'unit', (l ->> 'price')::integer, (l ->> 'qty')::integer
  from jsonb_array_elements(v_lines) l;

  return jsonb_build_object('id', v_order_id, 'subtotal', v_subtotal, 'delivery', v_delivery, 'total', v_subtotal + v_delivery);
end $$;

-- Staff move an order one step on, or cancel it. Every change is logged.
create or replace function public.set_order_status(p_order_id text, p_status text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_order  orders;
  v_steps  text[] := array['placed', 'packed', 'onTheWay', 'delivered'];
  v_from   integer;
  v_to     integer;
begin
  if not is_staff() then raise exception 'not-allowed'; end if;
  select * into v_order from orders where id = p_order_id for update;
  if not found then raise exception 'not-found'; end if;
  if v_order.status in ('delivered', 'cancelled') then raise exception 'order-closed'; end if;
  if p_status <> 'cancelled' then
    v_from := array_position(v_steps, v_order.status);
    v_to := array_position(v_steps, p_status);
    if v_to is null or v_to <> v_from + 1 then raise exception 'invalid-step'; end if;
  end if;
  update orders
     set status = p_status,
         paid = paid or p_status = 'delivered',
         history = history || jsonb_build_object('status', p_status, 'at', now(), 'by', auth.uid())
   where id = p_order_id;
  insert into staff_activity (staff_id, action, detail) values (auth.uid(), 'order.status', p_order_id || ' → ' || p_status);
  return jsonb_build_object('id', p_order_id, 'status', p_status);
end $$;

-- ============================================================ appointments

drop policy if exists "Appointments: insert own" on public.appointments;
drop policy if exists "Appointments: cancel own" on public.appointments;
alter table public.appointments add column if not exists late_cancellation boolean not null default false;

-- Members can see which times are taken, without seeing who booked them
create or replace function public.booked_slots(p_professional_ids text[] default null)
returns table (professional_id text, starts_at timestamptz)
language sql stable security definer set search_path = public as $$
  select a.professional_id, a.starts_at from appointments a
  where a.status = 'booked' and a.starts_at > now()
    and (p_professional_ids is null or a.professional_id = any (p_professional_ids))
$$;

create or replace function public.book_appointment(
  p_professional_id text, p_type text, p_starts_at timestamptz,
  p_topic text default null, p_note text default null, p_share_results boolean default false, p_member_name text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid       uuid := auth.uid();
  v_rules     care_settings;
  v_pro       professionals;
  v_own       professional_schedules;
  v_hours     jsonb;
  v_local     timestamp;
  v_start_min integer;
  v_weekday   integer;
  v_fee       integer;
  v_id        text;
  v_constraint text;
begin
  if v_uid is null then raise exception 'not-signed-in'; end if;
  select * into v_rules from care_settings where id = 1;
  select * into v_pro from professionals where id = p_professional_id and active and verified_at is not null;
  if not found then raise exception 'unavailable-professional'; end if;
  if not (p_type = any (v_pro.types)) then raise exception 'invalid-type'; end if;
  v_fee := (v_pro.fees ->> p_type)::integer;
  if v_fee is null then raise exception 'invalid-type'; end if;

  -- When: on a slot boundary, with enough notice, not too far ahead
  v_local := p_starts_at at time zone 'Africa/Lagos';
  v_start_min := extract(hour from v_local)::integer * 60 + extract(minute from v_local)::integer;
  if extract(second from v_local) <> 0 or v_start_min % v_rules.slot_minutes <> 0 then raise exception 'invalid-time'; end if;
  if p_starts_at < now() + make_interval(mins => v_rules.min_notice_minutes) then raise exception 'too-soon'; end if;
  if v_local::date > lagos_today() + v_rules.days_ahead then raise exception 'too-far-ahead'; end if;

  -- Within the professional's working hours (their own saved hours if any), not on a day off
  select * into v_own from professional_schedules where professional_id = p_professional_id;
  v_weekday := extract(isodow from v_local)::integer - 1;   -- Monday = 0, as in the app
  v_hours := coalesce(v_own.hours, v_pro.schedule) -> v_weekday::text;
  if v_hours is null or jsonb_typeof(v_hours) <> 'array' then raise exception 'outside-hours'; end if;
  if v_start_min < (v_hours ->> 0)::integer * 60 or v_start_min + v_rules.slot_minutes > (v_hours ->> 1)::integer * 60 then
    raise exception 'outside-hours';
  end if;
  if v_own.days_off is not null and v_local::date = any (v_own.days_off) then raise exception 'day-off'; end if;

  -- A fair limit on upcoming bookings per member
  if (select count(*) from appointments where user_id = v_uid and status = 'booked' and starts_at > now()) >= v_rules.max_upcoming_per_member then
    raise exception 'too-many-bookings';
  end if;

  if p_note is not null and char_length(p_note) > 500 then raise exception 'note-too-long'; end if;
  if p_topic is not null and char_length(p_topic) > 40 then raise exception 'invalid-topic'; end if;

  loop
    v_id := short_code('LC');
    begin
      insert into appointments (id, user_id, professional_id, type, starts_at, minutes, fee, topic, note, share_results, member_name, status)
      values (v_id, v_uid, p_professional_id, p_type, p_starts_at, v_rules.slot_minutes, v_fee, p_topic, nullif(trim(p_note), ''),
              coalesce(p_share_results, false), nullif(trim(left(p_member_name, 40)), ''), 'booked');
      exit;
    exception when unique_violation then
      get stacked diagnostics v_constraint = constraint_name;
      if v_constraint = 'appointments_slot_unique' then raise exception 'slot-taken'; end if;
      -- otherwise the reference code already existed: try another
    end;
  end loop;

  return jsonb_build_object('id', v_id, 'fee', v_fee, 'starts_at', p_starts_at);
end $$;

-- Members cancel their own upcoming booking. Late cancellations are flagged for staff.
create or replace function public.cancel_appointment(p_id text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_appt   appointments;
  v_rules  care_settings;
  v_late   boolean;
begin
  if auth.uid() is null then raise exception 'not-signed-in'; end if;
  select * into v_appt from appointments where id = p_id and user_id = auth.uid() for update;
  if not found then raise exception 'not-found'; end if;
  if v_appt.status <> 'booked' then raise exception 'not-booked'; end if;
  if v_appt.starts_at <= now() then raise exception 'already-started'; end if;
  select * into v_rules from care_settings where id = 1;
  v_late := v_appt.starts_at - now() < make_interval(hours => v_rules.free_cancellation_hours);
  update appointments set status = 'cancelled', cancelled_at = now(), late_cancellation = v_late where id = p_id;
  return jsonb_build_object('id', p_id, 'status', 'cancelled', 'late', v_late);
end $$;

-- ============================================================ who can call what

revoke all on function public.place_order(jsonb, jsonb, text, text) from public, anon;
revoke all on function public.set_order_status(text, text) from public, anon;
revoke all on function public.book_appointment(text, text, timestamptz, text, text, boolean, text) from public, anon;
revoke all on function public.cancel_appointment(text) from public, anon;
revoke all on function public.booked_slots(text[]) from public, anon;
grant execute on function public.place_order(jsonb, jsonb, text, text) to authenticated;
grant execute on function public.set_order_status(text, text) to authenticated;
grant execute on function public.book_appointment(text, text, timestamptz, text, text, boolean, text) to authenticated;
grant execute on function public.cancel_appointment(text) to authenticated;
grant execute on function public.booked_slots(text[]) to authenticated;
