-- Living Dose: professionals' portal
-- Run after 0006 in Supabase: Dashboard → SQL Editor → paste → Run.
--
-- Linking a verified professional's account to their profile (replace both values):
--   update auth.users
--   set raw_app_meta_data = raw_app_meta_data || '{"role":"professional","professional_id":"funmi-adeyemi"}'
--   where email = 'funmi@example.com';

create or replace function public.my_professional_id()
returns text language sql stable as $$
  select case when auth.jwt() -> 'app_metadata' ->> 'role' = 'professional'
              then auth.jwt() -> 'app_metadata' ->> 'professional_id' end
$$;

-- Professionals see and update only their own consultations
create policy "Appointments: professional read" on public.appointments for select
  using (professional_id = public.my_professional_id());
create policy "Appointments: professional update" on public.appointments for update
  using (professional_id = public.my_professional_id()) with check (professional_id = public.my_professional_id());

-- Member's name for the professional's schedule
alter table public.appointments add column if not exists member_name text;

-- Summary and next steps, visible to the member and their professional
create table if not exists public.consultation_summaries (
  appointment_id  text primary key references public.appointments (id) on delete cascade,
  professional_id text not null,
  summary         text not null check (char_length(summary) >= 20),
  next_steps      text[] not null default '{}',
  follow_up       text check (follow_up in ('2weeks', '4weeks', '3months')),
  written_at      timestamptz not null default now()
);
alter table public.consultation_summaries enable row level security;
create policy "Summaries: member reads own" on public.consultation_summaries for select
  using (exists (select 1 from public.appointments a where a.id = appointment_id and a.user_id = auth.uid()));
create policy "Summaries: professional writes own" on public.consultation_summaries for all
  using (professional_id = public.my_professional_id()) with check (professional_id = public.my_professional_id());

-- Private clinical notes: only the professional who wrote them can see them
create table if not exists public.professional_notes (
  appointment_id  text primary key references public.appointments (id) on delete cascade,
  professional_id text not null,
  note            text not null default '',
  updated_at      timestamptz not null default now()
);
alter table public.professional_notes enable row level security;
create policy "Notes: professional only" on public.professional_notes for all
  using (professional_id = public.my_professional_id()) with check (professional_id = public.my_professional_id());

-- Shared health check results: readable by the professional only for consultations
-- where the member chose to share them. Read through this view, which leaves out
-- the member's individual answers.
create or replace view public.shared_results as
  select a.id as appointment_id, h.score, h.results ->> 'band' as band, h.results -> 'pillars' as pillars,
         h.results -> 'measures' as measures, h.results -> 'priorities' as priorities, h.created_at
  from public.appointments a
  join lateral (
    select * from public.health_checks hc where hc.user_id = a.user_id order by hc.created_at desc limit 1
  ) h on true
  where a.share_results and a.professional_id = public.my_professional_id();

-- Working hours and days off
create table if not exists public.professional_schedules (
  professional_id text primary key,
  hours           jsonb not null,       -- { "0": [9, 17], ... } Monday = 0, Lagos time
  days_off        date[] not null default '{}',
  updated_at      timestamptz not null default now()
);
alter table public.professional_schedules enable row level security;
create policy "Schedules: anyone can read" on public.professional_schedules for select using (true);
create policy "Schedules: professional edits own" on public.professional_schedules for all
  using (professional_id = public.my_professional_id()) with check (professional_id = public.my_professional_id());
