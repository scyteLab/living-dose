-- Living Dose: staff access, activity log and moderation queue
-- Run after 0005 in Supabase: Dashboard → SQL Editor → paste → Run.
--
-- Giving someone staff access (run in the SQL Editor, replacing the email):
--   update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"staff"}'
--   where email = 'colleague@yourdomain.com';
-- app_metadata can only be changed by the server, never by the member.

create or replace function public.is_staff()
returns boolean language sql stable as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in ('staff', 'admin')
$$;

-- Staff can see and update every order and appointment
create policy "Orders: staff read"   on public.orders for select using (public.is_staff());
create policy "Orders: staff update" on public.orders for update using (public.is_staff()) with check (public.is_staff());
create policy "Order items: staff read" on public.order_items for select using (public.is_staff());
create policy "Appointments: staff read"   on public.appointments for select using (public.is_staff());
create policy "Appointments: staff update" on public.appointments for update using (public.is_staff()) with check (public.is_staff());

-- Moderation: staff read reports and hide posts or replies
create policy "Reports: staff read" on public.community_reports for select using (public.is_staff());
alter table public.community_reports add column if not exists status text not null default 'open' check (status in ('open', 'removed', 'kept'));
alter table public.community_reports add column if not exists resolved_at timestamptz;
create policy "Reports: staff resolve" on public.community_reports for update using (public.is_staff()) with check (public.is_staff());
create policy "Posts: staff hide"   on public.community_posts for update using (public.is_staff()) with check (public.is_staff());
create policy "Replies: staff hide" on public.community_replies for update using (public.is_staff()) with check (public.is_staff());

-- Every staff action is recorded and can't be edited or deleted from the app
create table if not exists public.staff_activity (
  id         bigint generated always as identity primary key,
  staff_id   uuid not null references auth.users (id),
  action     text not null,
  detail     text,
  created_at timestamptz not null default now()
);
alter table public.staff_activity enable row level security;
create policy "Activity: staff read"   on public.staff_activity for select using (public.is_staff());
create policy "Activity: staff insert" on public.staff_activity for insert with check (public.is_staff() and staff_id = auth.uid());
