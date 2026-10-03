-- Living Dose: server connection, phase 2
-- Community, the professionals' portal and organisations.
-- Run after 0009 in Supabase: Dashboard → SQL Editor → paste → Run.
--
-- What this changes:
--   • Members read community posts through views that never include who wrote
--     them, so anonymous posts stay anonymous. Posting, replying, reacting and
--     reporting go through checked functions.
--   • Staff moderate with resolve_report(), which hides the post for everyone.
--   • Professionals save summaries, mark consultations and keep private notes
--     through functions limited to their own consultations.
--   • Organisations' anonymised totals are worked out here, with the privacy
--     rules (at least 10 people; counts under 5 hidden) applied on the server.

-- ============================================================ community

-- Members no longer read or write the tables directly
drop policy if exists "Posts: members read visible" on public.community_posts;
drop policy if exists "Posts: insert own" on public.community_posts;
drop policy if exists "Replies: members read visible" on public.community_replies;
drop policy if exists "Replies: insert own" on public.community_replies;
drop policy if exists "Reactions: read" on public.community_reactions;
drop policy if exists "Reactions: own" on public.community_reactions;
drop policy if exists "Reports: insert own" on public.community_reports;
-- Staff can read everything for moderation (including hidden items)
drop policy if exists "Posts: staff read" on public.community_posts;
drop policy if exists "Replies: staff read" on public.community_replies;
create policy "Posts: staff read" on public.community_posts for select using (public.is_staff());
create policy "Replies: staff read" on public.community_replies for select using (public.is_staff());

create or replace function public.community_group_ok(p_group text)
returns boolean language sql immutable as $$
  select p_group = any (array['blood-sugar', 'weight-journey', 'pregnancy-parents', 'heart-health', 'fitness-beginners', 'mind-wellbeing', 'diaspora-families'])
$$;

-- Same checks as the app (src/lib/community/safety.js): length, and no phone numbers or emails
create or replace function public.community_text_ok(p_body text)
returns text language plpgsql immutable as $$
declare joined text;
begin
  if p_body is null or char_length(trim(p_body)) < 10 then return 'too-short'; end if;
  if char_length(p_body) > 2000 then return 'too-long'; end if;
  joined := regexp_replace(p_body, '([0-9])[\s-]+(?=[0-9])', '\1', 'g');
  if joined ~ '(\+?234|\m0)[789][01][0-9]{8}' or p_body ~* '[a-z0-9._%+-]+@[a-z0-9-]+\.[a-z.]+' then return 'contact-details'; end if;
  return null;
end $$;

-- What members see. These views run as their owner, so they decide exactly which
-- columns leave the database: never user_id, and no name on anonymous posts.
create or replace view public.community_feed as
  select p.id, p.group_id, p.anonymous,
         case when p.anonymous then null else p.author_name end as author_name,
         p.body, p.created_at,
         (p.user_id = auth.uid()) as mine,
         (select count(*) from community_reactions r where r.post_id = p.id) as helpful_count,
         exists (select 1 from community_reactions r where r.post_id = p.id and r.user_id = auth.uid()) as helpful_by_me
  from community_posts p
  where not p.hidden
    and auth.uid() is not null
    and not exists (select 1 from community_reports rp where rp.post_id = p.id and rp.reporter_id = auth.uid());

create or replace view public.community_feed_replies as
  select r.id, r.post_id, r.anonymous,
         case when r.anonymous then null else r.author_name end as author_name,
         r.professional_id, r.body, r.created_at,
         (r.user_id = auth.uid()) as mine
  from community_replies r
  join community_posts p on p.id = r.post_id and not p.hidden
  where not r.hidden
    and auth.uid() is not null
    and not exists (select 1 from community_reports rp where rp.reply_id = r.id and rp.reporter_id = auth.uid());

revoke all on public.community_feed, public.community_feed_replies from anon, public;
grant select on public.community_feed, public.community_feed_replies to authenticated;

create or replace function public.create_post(p_group text, p_body text, p_anonymous boolean default false)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_problem text; v_id uuid; v_name text; v_anon boolean;
begin
  if auth.uid() is null then raise exception 'not-signed-in'; end if;
  if not community_group_ok(p_group) then raise exception 'invalid-group'; end if;
  v_problem := community_text_ok(p_body);
  if v_problem is not null then raise exception '%', v_problem; end if;
  if (select count(*) from community_posts where user_id = auth.uid() and created_at > now() - interval '1 hour') >= 10 then
    raise exception 'slow-down';
  end if;
  v_anon := coalesce(p_anonymous, false) or p_group = 'mind-wellbeing';   -- that group is always anonymous
  select nullif(trim(raw_user_meta_data ->> 'first_name'), '') into v_name from auth.users where id = auth.uid();
  insert into community_posts (user_id, group_id, anonymous, author_name, body)
  values (auth.uid(), p_group, v_anon, case when v_anon then null else left(v_name, 40) end, trim(p_body))
  returning id into v_id;
  return v_id;
end $$;

create or replace function public.create_reply(p_post_id uuid, p_body text, p_anonymous boolean default false)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_problem text; v_id uuid; v_name text; v_group text; v_pro text; v_anon boolean;
begin
  if auth.uid() is null then raise exception 'not-signed-in'; end if;
  select group_id into v_group from community_posts where id = p_post_id and not hidden;
  if not found then raise exception 'not-found'; end if;
  v_problem := community_text_ok(p_body);
  if v_problem is not null then raise exception '%', v_problem; end if;
  v_pro := my_professional_id();                       -- verified professionals reply as themselves
  v_anon := v_pro is null and (coalesce(p_anonymous, false) or v_group = 'mind-wellbeing');
  select nullif(trim(raw_user_meta_data ->> 'first_name'), '') into v_name from auth.users where id = auth.uid();
  insert into community_replies (post_id, user_id, anonymous, author_name, professional_id, body)
  values (p_post_id, auth.uid(), v_anon, case when v_anon then null else left(v_name, 40) end, v_pro, trim(p_body))
  returning id into v_id;
  return v_id;
end $$;

create or replace function public.toggle_helpful(p_post_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not-signed-in'; end if;
  if not exists (select 1 from community_posts where id = p_post_id and not hidden) then raise exception 'not-found'; end if;
  delete from community_reactions where post_id = p_post_id and user_id = auth.uid();
  if found then return false; end if;
  insert into community_reactions (post_id, user_id) values (p_post_id, auth.uid());
  return true;
end $$;

-- Report a post or a reply. It's hidden for the reporter straight away (see the views).
create or replace function public.report_item(p_kind text, p_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not-signed-in'; end if;
  if p_reason not in ('harmful', 'unkind', 'spam', 'private', 'other') then raise exception 'invalid-reason'; end if;
  if p_kind = 'post' and exists (select 1 from community_posts where id = p_id) then
    insert into community_reports (reporter_id, post_id, reason) values (auth.uid(), p_id, p_reason);
  elsif p_kind = 'reply' and exists (select 1 from community_replies where id = p_id) then
    insert into community_reports (reporter_id, reply_id, reason) values (auth.uid(), p_id, p_reason);
  else
    raise exception 'not-found';
  end if;
end $$;

-- Staff: remove (hide for everyone) or keep. Settles every open report on that item.
create or replace function public.resolve_report(p_report_id bigint, p_decision text)
returns void language plpgsql security definer set search_path = public as $$
declare v_report community_reports;
begin
  if not is_staff() then raise exception 'not-allowed'; end if;
  if p_decision not in ('remove', 'keep') then raise exception 'invalid-decision'; end if;
  select * into v_report from community_reports where id = p_report_id;
  if not found then raise exception 'not-found'; end if;
  if v_report.post_id is not null then
    if p_decision = 'remove' then update community_posts set hidden = true where id = v_report.post_id; end if;
    update community_reports set status = case when p_decision = 'remove' then 'removed' else 'kept' end, resolved_at = now()
     where post_id = v_report.post_id and status = 'open';
  else
    if p_decision = 'remove' then update community_replies set hidden = true where id = v_report.reply_id; end if;
    update community_reports set status = case when p_decision = 'remove' then 'removed' else 'kept' end, resolved_at = now()
     where reply_id = v_report.reply_id and status = 'open';
  end if;
  insert into staff_activity (staff_id, action, detail)
  values (auth.uid(), 'moderation.' || p_decision, coalesce('post ' || v_report.post_id, 'reply ' || v_report.reply_id) || ' (' || v_report.reason || ')');
end $$;

-- ============================================================ professionals

-- Professionals no longer update consultations directly (that allowed changing the fee)
drop policy if exists "Appointments: professional update" on public.appointments;
drop policy if exists "Summaries: professional writes own" on public.consultation_summaries;
create policy "Summaries: professional reads own" on public.consultation_summaries for select
  using (professional_id = public.my_professional_id());

create or replace function public.save_consultation_summary(p_appointment_id text, p_summary text, p_next_steps text[], p_follow_up text)
returns void language plpgsql security definer set search_path = public as $$
declare v_pro text := my_professional_id(); v_steps text[];
begin
  if v_pro is null then raise exception 'not-allowed'; end if;
  if not exists (select 1 from appointments where id = p_appointment_id and professional_id = v_pro and status in ('booked', 'completed')) then
    raise exception 'not-found';
  end if;
  if p_summary is null or char_length(trim(p_summary)) < 20 or char_length(p_summary) > 4000 then raise exception 'invalid-summary'; end if;
  if p_follow_up is not null and p_follow_up not in ('2weeks', '4weeks', '3months') then raise exception 'invalid-follow-up'; end if;
  select coalesce(array_agg(left(trim(s), 200)), '{}') into v_steps from unnest(coalesce(p_next_steps, '{}')) s where trim(s) <> '';
  if array_length(v_steps, 1) > 6 then raise exception 'too-many-steps'; end if;
  insert into consultation_summaries (appointment_id, professional_id, summary, next_steps, follow_up, written_at)
  values (p_appointment_id, v_pro, trim(p_summary), v_steps, p_follow_up, now())
  on conflict (appointment_id) do update set summary = excluded.summary, next_steps = excluded.next_steps, follow_up = excluded.follow_up, written_at = now();
  update appointments set status = 'completed' where id = p_appointment_id;
end $$;

create or replace function public.mark_consultation(p_appointment_id text, p_status text)
returns void language plpgsql security definer set search_path = public as $$
declare v_pro text := my_professional_id();
begin
  if v_pro is null then raise exception 'not-allowed'; end if;
  if p_status not in ('completed', 'no_show') then raise exception 'invalid-status'; end if;
  update appointments set status = p_status where id = p_appointment_id and professional_id = v_pro and status = 'booked';
  if not found then raise exception 'not-found'; end if;
end $$;

-- Working hours must be sensible: whole hours from 6 AM to 10 PM, start before end
create or replace function public.valid_hours(p_hours jsonb)
returns boolean language sql immutable as $$
  select jsonb_typeof(p_hours) = 'object' and not exists (
    select 1 from jsonb_each(p_hours) e
    where e.key !~ '^[0-6]$' or jsonb_typeof(e.value) <> 'array' or jsonb_array_length(e.value) <> 2
       or (e.value ->> 0)::int < 6 or (e.value ->> 1)::int > 22 or (e.value ->> 0)::int >= (e.value ->> 1)::int)
$$;
alter table public.professional_schedules drop constraint if exists professional_schedules_hours_valid;
alter table public.professional_schedules add constraint professional_schedules_hours_valid check (public.valid_hours(hours));

-- ============================================================ organisations

-- The member's own organisation, by name (members can't list organisations)
create or replace function public.my_organisation()
returns table (org_id text, name text, joined_at timestamptz)
language sql stable security definer set search_path = public as $$
  select o.id, o.name, m.joined_at from organisation_members m join organisations o on o.id = m.org_id where m.user_id = auth.uid()
$$;

-- Anonymised totals for an organisation's administrators.
-- Rules: nothing below 10 health checks; any count from 1 to 4 is returned as null;
-- risks need 10 people measured; priorities need at least 5 people.
create or replace function public.organisation_summary()
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  v_org text := auth.jwt() -> 'app_metadata' ->> 'org_id';
  v_enrolled int; v_checked int; v_result jsonb;
begin
  if coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'org_admin' or v_org is null then raise exception 'not-allowed'; end if;
  select count(*) into v_enrolled from organisation_members where org_id = v_org;

  create temporary table if not exists _latest (score int, results jsonb) on commit drop;
  truncate _latest;
  insert into _latest
    select distinct on (h.user_id) h.score, h.results
    from organisation_members m join health_checks h on h.user_id = m.user_id
    where m.org_id = v_org order by h.user_id, h.created_at desc;
  select count(*) into v_checked from _latest;

  if v_checked < 10 then
    return jsonb_build_object('enrolled', v_enrolled, 'checked', v_checked, 'suppressed', true);
  end if;

  select jsonb_build_object(
    'enrolled', v_enrolled, 'checked', v_checked, 'suppressed', false,
    'average_score', (select round(avg(score)) from _latest),
    'bands', (select jsonb_object_agg(b, (select case when c between 1 and 4 then null else c end
                from (select count(*) c from _latest where results ->> 'band' = b) x))
              from unnest(array['strong', 'good', 'grow', 'attention']) b),
    'pillars', (select jsonb_object_agg(p, (select round(avg((results -> 'pillars' ->> p)::numeric)) from _latest where results -> 'pillars' ? p))
                from unnest(array['eating', 'activity', 'body', 'sleep', 'mind', 'habits']) p),
    'risks', jsonb_build_object(
      'weight', (select jsonb_build_object('base', count(*), 'count', count(*) filter (where results -> 'measures' ->> 'bmiCategory' in ('overweight', 'obesity'))) from _latest where results -> 'measures' ->> 'bmiCategory' is not null),
      'bloodPressure', (select jsonb_build_object('base', count(*), 'count', count(*) filter (where results -> 'measures' ->> 'bpCategory' in ('grade1', 'grade2', 'crisis'))) from _latest where results -> 'measures' ->> 'bpCategory' is not null),
      'diabetes', (select jsonb_build_object('base', count(*), 'count', count(*) filter (where results -> 'measures' -> 'findrisc' ->> 'band' in ('moderate', 'high', 'veryHigh'))) from _latest where (results -> 'measures' -> 'findrisc' ->> 'applicable')::boolean)
    ),
    'priorities', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'count', c) order by c desc) from (
        select pr ->> 'id' as id, count(*) c from _latest, jsonb_array_elements(coalesce(results -> 'priorities', '[]')) pr
        group by 1 having count(*) >= 5 order by c desc limit 5) t), '[]')
  ) into v_result;

  -- Apply the small-count rules to the risks
  v_result := jsonb_set(v_result, '{risks}', (
    select jsonb_object_agg(k, case
      when (v ->> 'base')::int < 10 then jsonb_build_object('suppressed', true)
      when (v ->> 'count')::int between 1 and 4 then jsonb_build_object('base', v -> 'base', 'count', null)
      else v end)
    from jsonb_each(v_result -> 'risks') as e(k, v)));
  return v_result;
end $$;

-- ============================================================ who can call what

revoke all on function public.create_post(text, text, boolean), public.create_reply(uuid, text, boolean), public.toggle_helpful(uuid),
  public.report_item(text, uuid, text), public.resolve_report(bigint, text), public.save_consultation_summary(text, text, text[], text),
  public.mark_consultation(text, text), public.my_organisation(), public.organisation_summary(), public.join_organisation(text) from public, anon;
grant execute on function public.create_post(text, text, boolean), public.create_reply(uuid, text, boolean), public.toggle_helpful(uuid),
  public.report_item(text, uuid, text), public.resolve_report(bigint, text), public.save_consultation_summary(text, text, text[], text),
  public.mark_consultation(text, text), public.my_organisation(), public.organisation_summary(), public.join_organisation(text) to authenticated;
