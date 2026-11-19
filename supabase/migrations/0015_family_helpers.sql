-- Living Dose: family helpers. A member invites a son, daughter or carer, who can
-- then see a short daily summary: check-ins, warning signs, water and streak.
-- Never answers, meals or the diary. Either side can end it at any time.
-- Run after 0014 in Supabase: Dashboard → SQL Editor → paste → Run. Safe to run again.

create table if not exists public.family_invites (
  code        text primary key check (char_length(code) between 8 and 40),
  owner_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  owner_name  text not null check (char_length(owner_name) between 1 and 60),
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '7 days',
  used_by     uuid references auth.users (id) on delete set null,
  used_at     timestamptz
);
alter table public.family_invites enable row level security;
drop policy if exists "Family invites: own" on public.family_invites;
create policy "Family invites: own" on public.family_invites for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create table if not exists public.family_links (
  owner_id     uuid not null references auth.users (id) on delete cascade,
  helper_id    uuid not null references auth.users (id) on delete cascade,
  owner_name   text not null,
  helper_name  text not null,
  created_at   timestamptz not null default now(),
  primary key (owner_id, helper_id),
  check (owner_id <> helper_id)
);
alter table public.family_links enable row level security;
drop policy if exists "Family links: either side reads" on public.family_links;
drop policy if exists "Family links: either side ends" on public.family_links;
create policy "Family links: either side reads" on public.family_links for select
  using (auth.uid() in (owner_id, helper_id));
create policy "Family links: either side ends" on public.family_links for delete
  using (auth.uid() in (owner_id, helper_id));
-- Links are only created through accept_family_invite below.

-- Who sent this invite, and can it still be used? (shown before accepting)
create or replace function public.family_invite_preview(p_code text)
returns table (owner_name text, status text)
language sql stable security definer set search_path = public as $$
  select i.owner_name,
         case when i.used_at is not null then 'used'
              when i.expires_at < now() then 'expired'
              when i.owner_id = auth.uid() then 'own'
              else 'ok' end
  from public.family_invites i where i.code = p_code;
$$;

-- Accept an invite: links the signed-in member as a helper. Each code works once.
create or replace function public.accept_family_invite(p_code text, p_helper_name text)
returns text
language plpgsql security definer set search_path = public as $$
declare inv public.family_invites;
begin
  if auth.uid() is null then raise exception 'not-signed-in'; end if;
  select * into inv from public.family_invites where code = p_code for update;
  if not found then raise exception 'invite-not-found'; end if;
  if inv.used_at is not null then raise exception 'invite-used'; end if;
  if inv.expires_at < now() then raise exception 'invite-expired'; end if;
  if inv.owner_id = auth.uid() then raise exception 'invite-own'; end if;
  insert into public.family_links (owner_id, helper_id, owner_name, helper_name)
    values (inv.owner_id, auth.uid(), inv.owner_name, left(coalesce(nullif(trim(p_helper_name), ''), 'Family member'), 60))
    on conflict (owner_id, helper_id) do nothing;
  update public.family_invites set used_by = auth.uid(), used_at = now() where code = p_code;
  return inv.owner_name;
end $$;

-- The helper's view: one row per person they look after, with only what's needed.
create or replace function public.family_overview()
returns table (
  owner_id uuid, owner_name text, linked_at timestamptz,
  checkin_days date[], today_checkin jsonb, last_checkin jsonb,
  water_today int, latest_score int, latest_score_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select l.owner_id, l.owner_name, l.created_at,
    (select array_agg(c.day order by c.day desc) from public.health_checkins c
      where c.user_id = l.owner_id and c.day >= current_date - 60),
    (select jsonb_build_object('day', c.day, 'feeling', c.feeling, 'sleep', c.sleep, 'symptoms', c.symptoms,
            'systolic', c.systolic, 'diastolic', c.diastolic, 'sugar_mgdl', c.sugar_mgdl, 'flags', c.flags, 'updated_at', c.updated_at)
      from public.health_checkins c where c.user_id = l.owner_id and c.day = (now() at time zone 'Africa/Lagos')::date),
    (select jsonb_build_object('day', c.day, 'feeling', c.feeling, 'flags', c.flags, 'updated_at', c.updated_at)
      from public.health_checkins c where c.user_id = l.owner_id order by c.day desc limit 1),
    (select coalesce((d.data -> to_char(now() at time zone 'Africa/Lagos', 'YYYY-MM-DD') ->> 'water')::int, 0)
      from public.user_documents d where d.user_id = l.owner_id and d.kind = 'habits'),
    (select h.score from public.health_checks h where h.user_id = l.owner_id order by h.created_at desc limit 1),
    (select h.created_at from public.health_checks h where h.user_id = l.owner_id order by h.created_at desc limit 1)
  from public.family_links l
  where l.helper_id = auth.uid();
$$;

revoke all on function public.family_overview() from anon;
revoke all on function public.accept_family_invite(text, text) from anon;
