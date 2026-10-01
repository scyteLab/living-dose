-- Living Dose: professionals and appointments (for when Care moves to Supabase)
-- Run after 0003 in Supabase: Dashboard → SQL Editor → paste → Run.

create table if not exists public.professionals (
  id            text primary key,
  name          text not null,
  title         text not null,
  specialty     text not null check (specialty in ('dietitian', 'doctor', 'psychologist', 'coach')),
  years         smallint not null default 0,
  languages     text[] not null default '{}',
  focus         text[] not null default '{}',
  types         text[] not null default '{video,voice,chat}',
  fees          jsonb not null,            -- { "video": 8000, "voice": 7000, "chat": 5000 } in naira
  schedule      jsonb not null,            -- { "0": [9, 17], ... } weekday → hours, Lagos time
  bio           text,
  education     text[] not null default '{}',
  registration_body   text,               -- e.g. the council the professional is registered with
  registration_number text,               -- verified by Living Dose staff; never shown publicly
  verified_at   timestamptz,
  active        boolean not null default true
);

alter table public.professionals enable row level security;

-- Anyone can browse active, verified professionals (without the registration number)
create policy "Professionals: public read" on public.professionals for select using (active and verified_at is not null);
-- Tip: expose profiles through a view that leaves out registration_number.

create table if not exists public.appointments (
  id               text primary key,                  -- e.g. LC-7KQ2MX
  user_id          uuid not null references auth.users (id) on delete cascade,
  professional_id  text not null references public.professionals (id),
  type             text not null check (type in ('video', 'voice', 'chat')),
  starts_at        timestamptz not null,
  minutes          smallint not null default 30,
  fee              integer not null check (fee >= 0),
  topic            text,
  note             text,
  share_results    boolean not null default false,
  status           text not null default 'booked' check (status in ('booked', 'cancelled', 'completed', 'no_show')),
  created_at       timestamptz not null default now(),
  cancelled_at     timestamptz
);

-- No two bookings for the same professional at the same time
create unique index if not exists appointments_slot_unique
  on public.appointments (professional_id, starts_at) where status = 'booked';
create index if not exists appointments_user_idx on public.appointments (user_id, starts_at desc);

alter table public.appointments enable row level security;

create policy "Appointments: read own"   on public.appointments for select using (auth.uid() = user_id);
create policy "Appointments: insert own" on public.appointments for insert with check (auth.uid() = user_id and status = 'booked');
create policy "Appointments: cancel own" on public.appointments for update using (auth.uid() = user_id) with check (auth.uid() = user_id and status in ('booked', 'cancelled'));
