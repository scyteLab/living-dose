-- Living Dose: staff can read Contact messages and the Shuttle Meds waitlist
-- Run after 0012 in Supabase: Dashboard → SQL Editor → paste → Run. Safe to run again.

-- Structured answers from forms like the Shuttle Meds waitlist (state, interests, who it's for)
alter table public.contact_messages add column if not exists details jsonb;

-- Staff read every message; members and visitors still can only send
drop policy if exists "Contact: staff read" on public.contact_messages;
create policy "Contact: staff read"
  on public.contact_messages for select
  using (public.is_staff());

create index if not exists contact_messages_topic_created_idx on public.contact_messages (topic, created_at desc);
