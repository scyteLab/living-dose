-- Living Dose: phone notifications (web push) for check-in reminders and family alerts
-- Run after 0015 in Supabase: Dashboard → SQL Editor → paste → Run. Safe to run again.

-- One row per phone or browser that said yes to notifications
create table if not exists public.push_subscriptions (
  endpoint    text primary key check (char_length(endpoint) between 10 and 1000),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  p256dh      text not null,
  auth        text not null,
  user_agent  text,
  created_at  timestamptz not null default now(),
  last_ok_at  timestamptz
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);
alter table public.push_subscriptions enable row level security;
drop policy if exists "Push: own" on public.push_subscriptions;
create policy "Push: own" on public.push_subscriptions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- What was sent, so nobody gets the same reminder or alert twice in a day.
-- Written only by the server (service role); members can't read or change it.
create table if not exists public.push_log (
  user_id   uuid not null references auth.users (id) on delete cascade,
  kind      text not null,
  ref       text not null default '',
  day       date not null,
  sent_at   timestamptz not null default now(),
  primary key (user_id, kind, ref, day)
);
alter table public.push_log enable row level security;
