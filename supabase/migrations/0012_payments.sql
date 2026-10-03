-- Living Dose: online payments with Paystack
-- Run after 0011 in Supabase: Dashboard → SQL Editor → paste → Run.
-- Then deploy the functions in supabase/functions (see supabase/PAYMENTS.md).
--
-- How it stays safe:
--   • The amount always comes from the order the server worked out (0009).
--   • Only Paystack's signed notification (the paystack-webhook function, using the
--     service role) can mark an order paid, and only if the amount matches exactly.
--   • Members can't call mark_order_paid(); the browser can't fake a payment.

alter table public.orders add column if not exists payment_status text not null default 'dueOnDelivery'
  check (payment_status in ('dueOnDelivery', 'pending', 'paid', 'failed'));
alter table public.orders drop constraint if exists orders_payment_check;
alter table public.orders add constraint orders_payment_check check (payment in ('payOnDelivery', 'paystack'));

create table if not exists public.payments (
  id           uuid primary key default gen_random_uuid(),
  order_id     text not null references public.orders (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  provider     text not null default 'paystack',
  reference    text not null unique,
  amount_kobo  bigint not null check (amount_kobo > 0),
  currency     text not null default 'NGN',
  status       text not null default 'initiated' check (status in ('initiated', 'success', 'failed')),
  provider_response jsonb,
  created_at   timestamptz not null default now(),
  paid_at      timestamptz
);
create index if not exists payments_order_idx on public.payments (order_id);
alter table public.payments enable row level security;
drop policy if exists "Payments: member reads own" on public.payments;
drop policy if exists "Payments: staff read" on public.payments;
create policy "Payments: member reads own" on public.payments for select using (auth.uid() = user_id);
create policy "Payments: staff read" on public.payments for select using (public.is_staff());
-- No insert/update policies: only the payment functions (service role) write here.

-- place_order() gains a payment choice. Pay now starts as 'pending' until Paystack confirms.
drop function if exists public.place_order(jsonb, jsonb, text, text);
create or replace function public.place_order(p_items jsonb, p_address jsonb, p_slot text, p_note text default null, p_payment text default 'payOnDelivery')
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
  if p_payment not in ('payOnDelivery', 'paystack') then raise exception 'invalid-payment'; end if;
  select * into v_settings from shop_settings where id = 1;
  if not found then raise exception 'shop-not-configured'; end if;

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

  if jsonb_typeof(p_address) is distinct from 'object' or length(p_address::text) > 2000 then raise exception 'incomplete-address'; end if;
  foreach v_field in array array['name', 'phone', 'street', 'area', 'city', 'state'] loop
    if coalesce(trim(p_address ->> v_field), '') = '' then raise exception 'incomplete-address'; end if;
  end loop;
  if not (p_address ->> 'state' = any (v_settings.delivery_states)) then raise exception 'outside-delivery-area'; end if;

  if coalesce(p_slot, '') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}\|(morning|afternoon|evening)$' then raise exception 'invalid-slot'; end if;
  v_date := split_part(p_slot, '|', 1)::date;
  if v_date < lagos_today() + 1 or v_date > lagos_today() + v_settings.days_ahead then raise exception 'invalid-slot'; end if;
  if p_note is not null and char_length(p_note) > 300 then raise exception 'note-too-long'; end if;

  v_delivery := case when v_subtotal >= v_settings.free_delivery_from then 0 else v_settings.delivery_fee end;

  loop
    v_order_id := short_code('LD');
    begin
      insert into orders (id, user_id, status, subtotal, delivery, total, address, slot, payment, payment_status, note, history)
      values (v_order_id, v_uid, 'placed', v_subtotal, v_delivery, v_subtotal + v_delivery, p_address, p_slot, p_payment,
              case when p_payment = 'paystack' then 'pending' else 'dueOnDelivery' end,
              nullif(trim(p_note), ''), jsonb_build_array(jsonb_build_object('status', 'placed', 'at', now())));
      exit;
    exception when unique_violation then
    end;
  end loop;

  insert into order_items (order_id, product_id, name, unit, price, qty)
  select v_order_id, l ->> 'product_id', l ->> 'name', l ->> 'unit', (l ->> 'price')::integer, (l ->> 'qty')::integer
  from jsonb_array_elements(v_lines) l;

  return jsonb_build_object('id', v_order_id, 'subtotal', v_subtotal, 'delivery', v_delivery, 'total', v_subtotal + v_delivery);
end $$;
revoke all on function public.place_order(jsonb, jsonb, text, text, text) from public, anon;
grant execute on function public.place_order(jsonb, jsonb, text, text, text) to authenticated;

-- Called only by the paystack-webhook function (service role) after checking Paystack's signature.
-- Marks the payment and its order paid if the amount matches exactly. Safe to call twice.
create or replace function public.mark_order_paid(p_reference text, p_amount_kobo bigint, p_currency text, p_response jsonb)
returns text language plpgsql security definer set search_path = public as $$
declare v_payment payments; v_order orders;
begin
  select * into v_payment from payments where reference = p_reference for update;
  if not found then return 'unknown-reference'; end if;
  if v_payment.status = 'success' then return 'already-paid'; end if;
  select * into v_order from orders where id = v_payment.order_id for update;
  if p_currency <> 'NGN' or p_amount_kobo <> v_order.total::bigint * 100 or p_amount_kobo <> v_payment.amount_kobo then
    update payments set status = 'failed', provider_response = p_response where id = v_payment.id;
    return 'amount-mismatch';
  end if;
  update payments set status = 'success', paid_at = now(), provider_response = p_response where id = v_payment.id;
  update orders set payment_status = 'paid', paid = true,
         history = history || jsonb_build_object('status', 'paid', 'at', now())
   where id = v_order.id;
  return 'paid';
end $$;

create or replace function public.mark_payment_failed(p_reference text, p_response jsonb)
returns text language plpgsql security definer set search_path = public as $$
begin
  update payments set status = 'failed', provider_response = p_response where reference = p_reference and status = 'initiated';
  update orders set payment_status = 'failed'
   where id = (select order_id from payments where reference = p_reference) and payment_status = 'pending';
  return 'failed';
end $$;

revoke all on function public.mark_order_paid(text, bigint, text, jsonb), public.mark_payment_failed(text, jsonb) from public, anon, authenticated;
grant execute on function public.mark_order_paid(text, bigint, text, jsonb), public.mark_payment_failed(text, jsonb) to service_role;

-- Staff can't move an unpaid "pay now" order on to packing
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
    if v_order.payment = 'paystack' and v_order.payment_status <> 'paid' then raise exception 'awaiting-payment'; end if;
  end if;
  update orders
     set status = p_status,
         paid = paid or p_status = 'delivered',
         payment_status = case when p_status = 'delivered' and payment = 'payOnDelivery' then 'paid' else payment_status end,
         history = history || jsonb_build_object('status', p_status, 'at', now(), 'by', auth.uid())
   where id = p_order_id;
  insert into staff_activity (staff_id, action, detail) values (auth.uid(), 'order.status', p_order_id || ' → ' || p_status);
  return jsonb_build_object('id', p_order_id, 'status', p_status);
end $$;
