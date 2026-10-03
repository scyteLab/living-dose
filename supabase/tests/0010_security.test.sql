\set ON_ERROR_STOP 1
\pset tuples_only on
-- Helpers (same as the 0009 tests)
create or replace function public.expect_error(stmt text, expected text) returns text language plpgsql as $$
begin
  execute stmt; return 'FAIL (no error): ' || expected;
exception when others then
  if sqlerrm like '%' || expected || '%' then return 'ok   ' || expected; end if;
  return 'FAIL expected "' || expected || '" got "' || sqlerrm || '"';
end $$;
create or replace function public.verify(ok boolean, label text) returns text language sql as $$
  select case when ok then 'ok   ' else 'FAIL ' end || label $$;
drop function if exists public.act_as(text, text);  -- the 0009 tests' version
create or replace function public.act_as(uid text, app jsonb default '{}') returns void language plpgsql as $$
begin perform set_config('request.jwt.claims', json_build_object('sub', uid, 'app_metadata', app)::text, false); end $$;
grant execute on function public.expect_error(text, text), public.verify(boolean, text), public.act_as(text, jsonb) to authenticated;

-- People: Ada and Bola (members), Sam (staff), Funmi and Chidi (professionals), Hr (Lagos Foods admin)
insert into auth.users (id, raw_user_meta_data) values
  ('a0000000-0000-0000-0000-000000000001', '{"first_name":"Ada"}'),
  ('b0000000-0000-0000-0000-000000000002', '{"first_name":"Bola"}'),
  ('c0000000-0000-0000-0000-000000000003', '{"first_name":"Sam"}'),
  ('d0000000-0000-0000-0000-000000000004', '{"first_name":"Funmi"}'),
  ('e0000000-0000-0000-0000-000000000005', '{"first_name":"Chidi"}'),
  ('f0000000-0000-0000-0000-000000000006', '{"first_name":"Hr"}');
-- An appointment between Ada and Funmi, and one between Bola and Chidi
insert into appointments (id, user_id, professional_id, type, starts_at, fee, status, share_results, member_name) values
  ('LC-ADA001', 'a0000000-0000-0000-0000-000000000001', 'funmi-adeyemi', 'video', now() + interval '2 days', 8000, 'booked', true, 'Ada'),
  ('LC-BOL001', 'b0000000-0000-0000-0000-000000000002', 'chidi-okafor', 'video', now() + interval '3 days', 8000, 'booked', false, 'Bola');
create temporary table ids (k text primary key, v text);
grant all on ids to authenticated;

set role authenticated;
\echo '--- COMMUNITY ---'
select act_as('a0000000-0000-0000-0000-000000000001');
select expect_error($$insert into community_posts (user_id, group_id, body) values (auth.uid(), 'heart-health', 'Direct insert attempt here')$$, 'row-level security');
select verify((select count(*) from community_posts) = 0, 'members cannot read the posts table directly');
select expect_error($$select create_post('heart-health', 'short')$$, 'too-short');
select expect_error($$select create_post('heart-health', 'Call me on 0801 234 5678 for tips')$$, 'contact-details');
select expect_error($$select create_post('heart-health', 'Email me: ada@example.com please')$$, 'contact-details');
select expect_error($$select create_post('no-such-group', 'This is a long enough post')$$, 'invalid-group');
insert into ids select 'p1', create_post('heart-health', 'Cut down to one seasoning cube this week!')::text;
insert into ids select 'p2', create_post('weight-journey', 'This one is anonymous, please no name', true)::text;
insert into ids select 'p3', create_post('mind-wellbeing', 'Feeling better after talking to someone')::text;
select verify((select author_name = 'Ada' and mine from community_feed where id::text = (select v from ids where k='p1')), 'post shows first name and "mine" to its author');
select verify((select author_name is null from community_feed where id::text = (select v from ids where k='p2')), 'anonymous post has no name');
select verify((select anonymous and author_name is null from community_feed where id::text = (select v from ids where k='p3')), 'Mind and wellbeing posts are always anonymous');
select verify(not exists (select 1 from information_schema.columns where table_name = 'community_feed' and column_name = 'user_id'), 'the feed never exposes who wrote a post');
select act_as('b0000000-0000-0000-0000-000000000002');
select verify((select count(*) = 3 from community_feed), 'Bola sees all 3 posts');
select verify((select not mine from community_feed where id::text = (select v from ids where k='p1')), 'but they are not "mine" for Bola');
select verify(toggle_helpful((select v::uuid from ids where k='p1')), 'Bola marks a post helpful');
select verify((select helpful_count = 1 and helpful_by_me from community_feed where id::text = (select v from ids where k='p1')), 'helpful count goes up');
select verify(not toggle_helpful((select v::uuid from ids where k='p1')), 'tapping again removes it');
insert into ids select 'r1', create_reply((select v::uuid from ids where k='p1'), 'Well done, that is a great start!')::text;
select verify((select count(*) = 1 and bool_and(professional_id is null) from community_feed_replies), 'Bola replies');
select act_as('d0000000-0000-0000-0000-000000000004', '{"role":"professional","professional_id":"funmi-adeyemi"}');
select verify(create_reply((select v::uuid from ids where k='p1'), 'Lovely progress. Crayfish and onions add great flavour.') is not null, 'Funmi replies');
select verify((select professional_id = 'funmi-adeyemi' from community_feed_replies where author_name = 'Funmi'), 'professional replies are marked as verified');
select act_as('b0000000-0000-0000-0000-000000000002');
select expect_error($$select report_item('post', (select v::uuid from ids where k='p1'), 'nonsense')$$, 'invalid-reason');
select report_item('post', (select v::uuid from ids where k='p2'), 'spam');
select verify((select count(*) = 2 from community_feed), 'a reported post disappears for the reporter');
select act_as('a0000000-0000-0000-0000-000000000001');
select verify((select count(*) = 3 from community_feed), 'but not for everyone else');
select expect_error($$select resolve_report((select id from community_reports limit 1), 'remove')$$, 'not-allowed');
select act_as('c0000000-0000-0000-0000-000000000003', '{"role":"staff"}');
select verify((select count(*) = 1 from community_reports where status = 'open'), 'staff see the report');
select verify((select body like 'This one is anonymous%' from community_posts where id = (select post_id from community_reports limit 1)), 'staff can read the reported post');
select resolve_report((select id from community_reports limit 1), 'remove');
select verify((select status = 'removed' from community_reports limit 1), 'report resolved as removed');
select act_as('a0000000-0000-0000-0000-000000000001');
select verify((select count(*) = 2 from community_feed), 'removed post is hidden for everyone');
select verify((select count(*) = 1 from staff_activity) is null or true, 'moderation logged (checked as staff below)');
select act_as('c0000000-0000-0000-0000-000000000003', '{"role":"staff"}');
select verify((select count(*) = 1 from staff_activity where action = 'moderation.remove'), 'moderation is logged');

\echo '--- PROFESSIONALS ---'
select act_as('d0000000-0000-0000-0000-000000000004', '{"role":"professional","professional_id":"funmi-adeyemi"}');
select verify((select count(*) >= 1 and bool_and(professional_id = 'funmi-adeyemi') from appointments) and not exists (select 1 from appointments where id = 'LC-BOL001'), 'Funmi sees only her own consultations');
select verify((select score = 72 from shared_results where appointment_id = 'LC-ADA001') is null, 'no results shared yet (Ada has no check)');
update appointments set fee = 0 where id = 'LC-ADA001';
reset role;
select verify((select fee = 8000 from appointments where id = 'LC-ADA001'), 'a professional cannot change the fee');
set role authenticated;
select act_as('d0000000-0000-0000-0000-000000000004', '{"role":"professional","professional_id":"funmi-adeyemi"}');
select expect_error($$select save_consultation_summary('LC-ADA001', 'Too short', '{}', null)$$, 'invalid-summary');
select expect_error($$select save_consultation_summary('LC-BOL001', 'Trying to write on someone else''s consultation', '{}', null)$$, 'not-found');
select save_consultation_summary('LC-ADA001', 'We reviewed your plan and agreed smaller portions.', array['Walk after dinner', '  ', 'Swap one drink'], '4weeks');
select expect_error($$select mark_consultation('LC-BOL001', 'no_show')$$, 'not-found');
insert into professional_notes (appointment_id, professional_id, note) values ('LC-ADA001', 'funmi-adeyemi', 'Private: check HbA1c');
select expect_error($$insert into professional_schedules (professional_id, hours) values ('funmi-adeyemi', '{"0":[17,9]}')$$, 'professional_schedules_hours_valid');
insert into professional_schedules (professional_id, hours, days_off) values ('funmi-adeyemi', '{"0":[9,17],"1":[9,17]}', '{}');
select expect_error($$insert into professional_notes (appointment_id, professional_id, note) values ('LC-BOL001', 'chidi-okafor', 'x')$$, 'row-level security');
select act_as('a0000000-0000-0000-0000-000000000001');
select verify((select status = 'completed' from appointments where id = 'LC-ADA001'), 'Ada''s consultation is completed');
select verify((select array_length(next_steps, 1) = 2 and follow_up = '4weeks' from consultation_summaries where appointment_id = 'LC-ADA001'), 'Ada sees her summary (blank step dropped)');
select verify((select count(*) = 0 from professional_notes), 'Ada cannot see private notes');
select act_as('e0000000-0000-0000-0000-000000000005', '{"role":"professional","professional_id":"chidi-okafor"}');
select verify((select count(*) = 0 from consultation_summaries), 'another professional cannot read Funmi''s summaries');
select verify((select count(*) = 0 from professional_notes), 'or her private notes');

\echo '--- ORGANISATIONS ---'
reset role;
-- 12 members of Lagos Foods with health checks (8 good, 4 strong), plus one at Bright Future
insert into auth.users (id) select ('10000000-0000-0000-0000-' || lpad(g::text, 12, '0'))::uuid from generate_series(1, 13) g;
insert into organisation_members (user_id, org_id, consent_at)
  select ('10000000-0000-0000-0000-' || lpad(g::text, 12, '0'))::uuid, case when g = 13 then 'bright-future' else 'lagos-foods' end, now() from generate_series(1, 13) g;
insert into health_checks (user_id, answers, results, score)
  select ('10000000-0000-0000-0000-' || lpad(g::text, 12, '0'))::uuid, '{"secret":"answers"}',
    jsonb_build_object('band', case when g <= 8 then 'good' else 'strong' end,
      'pillars', jsonb_build_object('eating', 60, 'activity', 50),
      'measures', jsonb_build_object('bmiCategory', case when g <= 6 then 'obesity' else 'healthy' end, 'bpCategory', case when g <= 3 then 'grade1' else 'normal' end,
                                     'findrisc', jsonb_build_object('applicable', g <= 5, 'band', 'high')),
      'priorities', jsonb_build_array(jsonb_build_object('id', 'moveMore'))),
    case when g <= 8 then 70 else 85 end
  from generate_series(1, 13) g;
set role authenticated;
select act_as('a0000000-0000-0000-0000-000000000001');
select expect_error($$select organisation_summary()$$, 'not-allowed');
select verify((select count(*) = 0 from organisation_members), 'members cannot list other members');
select expect_error($$select join_organisation('WRONG')$$, 'invalid-code');
select verify(join_organisation(' lagos foods ') = 'lagos-foods', 'Ada joins with the code');
select verify((select name = 'Lagos Foods Ltd' from my_organisation()), 'and sees her organisation');
select act_as('f0000000-0000-0000-0000-000000000006', '{"role":"org_admin","org_id":"lagos-foods"}');
create temporary table s as select organisation_summary() as r;
select verify((select (r ->> 'enrolled')::int = 13 and (r ->> 'checked')::int = 12 from s), '13 enrolled, 12 health checks');
select verify((select (r ->> 'average_score')::int = 75 from s), 'average score 75');
select verify((select (r -> 'bands' ->> 'good')::int = 8 and (r -> 'bands' ->> 'strong')::int = 4 is null from s) or (select (r -> 'bands' -> 'strong') = 'null'::jsonb from s), 'a band of 4 people is hidden');
select verify((select (r -> 'bands' ->> 'good')::int = 8 from s), 'a band of 8 is shown');
select verify((select (r -> 'risks' -> 'weight' ->> 'count')::int = 6 from s), 'weight risk: 6 of 12');
select verify((select r -> 'risks' -> 'bloodPressure' -> 'count' = 'null'::jsonb from s), 'blood pressure risk of 3 people is hidden');
select verify((select (r -> 'risks' -> 'diabetes' ->> 'suppressed')::boolean from s), 'diabetes risk with only 5 measured is suppressed');
select verify((select r -> 'priorities' -> 0 ->> 'id' = 'moveMore' from s), 'most common priority');
select verify((select r::text not like '%secret%' and r::text not like '%10000000%' from s), 'no answers or IDs in the totals');
select act_as('f0000000-0000-0000-0000-000000000006', '{"role":"org_admin","org_id":"bright-future"}');
select verify((select (organisation_summary() ->> 'suppressed')::boolean), 'a group under 10 shows nothing');
