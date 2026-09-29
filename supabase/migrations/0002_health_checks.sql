-- Living Dose: health check results
-- Run after 0001 in Supabase: Dashboard → SQL Editor → paste → Run.

create table if not exists public.health_checks (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  answers          jsonb not null,           -- what the person answered
  results          jsonb not null,           -- computed scores, measures, priorities
  score            smallint not null check (score between 0 and 100),
  scoring_version  smallint not null default 1,
  remind           boolean not null default true,  -- 4-week check-in reminder
  created_at       timestamptz not null default now()
);

create index if not exists health_checks_user_created_idx
  on public.health_checks (user_id, created_at desc);

alter table public.health_checks enable row level security;

-- Health data: each person sees and changes only their own checks
create policy "Health checks: read own"   on public.health_checks for select using (auth.uid() = user_id);
create policy "Health checks: insert own" on public.health_checks for insert with check (auth.uid() = user_id);
create policy "Health checks: update own" on public.health_checks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Health checks: delete own" on public.health_checks for delete using (auth.uid() = user_id);
