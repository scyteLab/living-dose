-- Living Dose: shop orders (for when orders move from the device to Supabase)
-- Run after 0002 in Supabase: Dashboard → SQL Editor → paste → Run.

create table if not exists public.orders (
  id          text primary key,                         -- e.g. LD-7KQ2MX
  user_id     uuid not null references auth.users (id) on delete cascade,
  status      text not null default 'placed' check (status in ('placed', 'packed', 'onTheWay', 'delivered', 'cancelled')),
  subtotal    integer not null check (subtotal >= 0),   -- naira
  delivery    integer not null check (delivery >= 0),
  total       integer not null check (total >= 0),
  address     jsonb not null,
  slot        text not null,                            -- "YYYY-MM-DD|morning"
  payment     text not null default 'payOnDelivery',
  note        text,
  created_at  timestamptz not null default now()
);

create table if not exists public.order_items (
  id          bigint generated always as identity primary key,
  order_id    text not null references public.orders (id) on delete cascade,
  product_id  text not null,
  name        text not null,
  unit        text not null,
  price       integer not null check (price >= 0),      -- price at the time of the order
  qty         smallint not null check (qty between 1 and 50)
);

create index if not exists orders_user_created_idx on public.orders (user_id, created_at desc);
create index if not exists order_items_order_idx on public.order_items (order_id);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Customers see and create their own orders; only staff (service role) change status
create policy "Orders: read own"   on public.orders for select using (auth.uid() = user_id);
create policy "Orders: insert own" on public.orders for insert with check (auth.uid() = user_id and status = 'placed');

create policy "Order items: read own" on public.order_items for select
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "Order items: insert own" on public.order_items for insert
  with check (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

-- Note: before launch, prices should be checked on the server (an Edge Function or
-- database function) so a customer can't change the price sent from their browser.
