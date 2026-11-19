-- Living Dose: daily health check-ins, and the history doctors can see
-- Run after 0013 in Supabase: Dashboard → SQL Editor → paste → Run. Safe to run again.

create table if not exists public.health_checkins (
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day         date not null,
  feeling     text not null check (feeling in ('great', 'good', 'okay', 'unwell', 'bad')),
  sleep       text check (sleep in ('good', 'okay', 'poor')),
  symptoms    text[] not null default '{}',
  systolic    int check (systolic between 60 and 260),
  diastolic   int check (diastolic between 30 and 160),
  sugar_mgdl  int check (sugar_mgdl between 20 and 600),
  note        text check (char_length(note) <= 300),
  flags       text[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (user_id, day)
);

alter table public.health_checkins enable row level security;

drop policy if exists "Check-ins: read own" on public.health_checkins;
drop policy if exists "Check-ins: add own" on public.health_checkins;
drop policy if exists "Check-ins: change own" on public.health_checkins;
drop policy if exists "Check-ins: delete own" on public.health_checkins;
create policy "Check-ins: read own"   on public.health_checkins for select using (auth.uid() = user_id);
create policy "Check-ins: add own"    on public.health_checkins for insert with check (auth.uid() = user_id);
create policy "Check-ins: change own" on public.health_checkins for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Check-ins: delete own" on public.health_checkins for delete using (auth.uid() = user_id);

-- Doctors see the last 60 days of check-ins, only for consultations where
-- the member chose to share their results (same rule as shared_results).
create or replace view public.shared_checkins as
  select a.id as appointment_id, c.day, c.feeling, c.sleep, c.symptoms, c.systolic, c.diastolic, c.sugar_mgdl, c.flags
  from public.appointments a
  join public.health_checkins c
    on c.user_id = a.user_id
   and c.day >= (a.starts_at - interval '60 days')::date
   and c.day <= (a.starts_at + interval '1 day')::date
  where a.share_results and a.professional_id = public.my_professional_id();

-- Living Score over time for the same consultations (scores only, never answers)
create or replace view public.shared_score_history as
  select a.id as appointment_id, h.score, h.results ->> 'band' as band, h.created_at
  from public.appointments a
  join public.health_checks h on h.user_id = a.user_id and h.created_at <= a.starts_at + interval '1 day'
  where a.share_results and a.professional_id = public.my_professional_id();
