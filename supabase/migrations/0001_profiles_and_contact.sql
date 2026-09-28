-- Living Dose: profiles and contact messages
-- Run once in Supabase: Dashboard → SQL Editor → paste this file → Run.

-- ------------------------------------------------------------------
-- Profiles: one row per person, created automatically at sign-up
-- ------------------------------------------------------------------
create table if not exists public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  first_name        text,
  household_type    text check (household_type in ('me', 'family', 'abroad')),
  goals             text[] not null default '{}',
  consent_terms_at  timestamptz,
  consent_health_at timestamptz,
  marketing_opt_in  boolean not null default false,
  onboarded_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Each person can only see and change their own profile
create policy "Profiles: read own"   on public.profiles for select using (auth.uid() = id);
create policy "Profiles: insert own" on public.profiles for insert with check (auth.uid() = id);
create policy "Profiles: update own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Keep updated_at current
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Create the profile from the details given at sign-up (name and consents)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, first_name, consent_terms_at, consent_health_at, marketing_opt_in)
  values (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    (new.raw_user_meta_data ->> 'consent_terms_at')::timestamptz,
    (new.raw_user_meta_data ->> 'consent_health_at')::timestamptz,
    coalesce((new.raw_user_meta_data ->> 'marketing_opt_in')::boolean, false)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------------
-- Contact messages from the Contact page (anyone can send, nobody can read from the app)
-- ------------------------------------------------------------------
create table if not exists public.contact_messages (
  id         bigint generated always as identity primary key,
  name       text not null check (char_length(name) between 1 and 200),
  email      text not null check (char_length(email) between 3 and 320),
  phone      text,
  topic      text not null,
  message    text not null check (char_length(message) between 10 and 5000),
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

create policy "Contact: anyone can send"
  on public.contact_messages for insert
  to anon, authenticated
  with check (true);
