-- Living Dose: sponsoring organisations with anonymised totals
-- Run after 0007 in Supabase: Dashboard → SQL Editor → paste → Run.
--
-- Giving an organisation's administrator access (replace both values):
--   update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"org_admin","org_id":"lagos-foods"}'
--   where email = 'hr@lagosfoods.example';

create table if not exists public.organisations (
  id      text primary key,
  name    text not null,
  sector  text,
  code    text not null unique,
  seats   integer
);
alter table public.organisations enable row level security;
-- Members never list organisations; joining checks the code through join_organisation()

create table if not exists public.organisation_members (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  org_id     text not null references public.organisations (id),
  consent_at timestamptz not null,
  joined_at  timestamptz not null default now()
);
alter table public.organisation_members enable row level security;
create policy "Org membership: member manages own" on public.organisation_members for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Join with a code (the code is checked here, so organisations can't be listed)
create or replace function public.join_organisation(join_code text)
returns text language plpgsql security definer set search_path = public as $$
declare found_id text;
begin
  select id into found_id from organisations where code = upper(regexp_replace(join_code, '\s', '', 'g'));
  if found_id is null then raise exception 'invalid-code'; end if;
  insert into organisation_members (user_id, org_id, consent_at)
  values (auth.uid(), found_id, now())
  on conflict (user_id) do update set org_id = excluded.org_id, consent_at = now(), joined_at = now();
  return found_id;
end $$;

-- Anonymised totals for an organisation's administrators. Nothing is returned
-- below 10 health checks; any count under 5 is returned as null.
-- Administrators can't read organisation_members or health_checks directly.
create or replace function public.organisation_summary()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  my_org text := auth.jwt() -> 'app_metadata' ->> 'org_id';
  enrolled int; checked int; result jsonb;
begin
  if coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'org_admin' or my_org is null then
    raise exception 'not-allowed';
  end if;
  select count(*) into enrolled from organisation_members where org_id = my_org;
  with latest as (
    select distinct on (h.user_id) h.score, h.results
    from organisation_members m join health_checks h on h.user_id = m.user_id
    where m.org_id = my_org order by h.user_id, h.created_at desc
  )
  select count(*) into checked from latest;
  if checked < 10 then
    return jsonb_build_object('enrolled', enrolled, 'checked', checked, 'suppressed', true);
  end if;
  with latest as (
    select distinct on (h.user_id) h.score, h.results
    from organisation_members m join health_checks h on h.user_id = m.user_id
    where m.org_id = my_org order by h.user_id, h.created_at desc
  ), bands as (
    select results ->> 'band' as band, count(*) as n from latest group by 1
  )
  select jsonb_build_object(
    'enrolled', enrolled, 'checked', checked, 'suppressed', false,
    'averageScore', (select round(avg(score)) from latest),
    'bands', (select jsonb_object_agg(band, case when n < 5 then null else n end) from bands)
  ) into result;
  return result;
end $$;
-- Before launch: extend organisation_summary() with pillar averages, risks and
-- priorities using the same rules as src/lib/org/aggregate.js.
