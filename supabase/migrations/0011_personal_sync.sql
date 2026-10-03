-- Living Dose: personal data that follows the member between their devices (phase 3)
-- Run after 0010 in Supabase: Dashboard → SQL Editor → paste → Run.
--
-- Each row is one kind of personal data for one member (their meal plan, habits,
-- food diary without photos, and so on). The app saves on the device first and
-- syncs in the background; the newest change wins (src/lib/sync).

create table if not exists public.user_documents (
  user_id     uuid not null references auth.users (id) on delete cascade,
  kind        text not null check (kind in (
                'mealPlan', 'planSeen', 'habits', 'diary', 'household', 'notifications',
                'community', 'savedArticles', 'articleFeedback', 'healthCheckDraft')),
  data        jsonb not null,
  updated_at  timestamptz not null default now(),
  primary key (user_id, kind),
  -- About 300 KB per item is plenty (diary photos stay on the device)
  constraint user_documents_size check (octet_length(data::text) <= 300000)
);

alter table public.user_documents enable row level security;
drop policy if exists "Documents: own only" on public.user_documents;
create policy "Documents: own only" on public.user_documents for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- The server sets the time, so devices with wrong clocks can't jump the queue
create or replace function public.user_documents_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists user_documents_touch on public.user_documents;
create trigger user_documents_touch before insert or update on public.user_documents
  for each row execute function public.user_documents_touch();
