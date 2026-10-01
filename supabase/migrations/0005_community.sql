-- Living Dose: community (for when posts are shared between members)
-- Run after 0004 in Supabase: Dashboard → SQL Editor → paste → Run.

create table if not exists public.community_posts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  group_id    text not null,
  anonymous   boolean not null default false,
  author_name text,                         -- null when anonymous
  body        text not null check (char_length(body) between 10 and 2000),
  hidden      boolean not null default false, -- set by moderators
  created_at  timestamptz not null default now()
);

create table if not exists public.community_replies (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.community_posts (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  anonymous   boolean not null default false,
  author_name text,
  professional_id text,                     -- set only for verified professionals
  body        text not null check (char_length(body) between 10 and 2000),
  hidden      boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.community_reactions (
  post_id  uuid not null references public.community_posts (id) on delete cascade,
  user_id  uuid not null references auth.users (id) on delete cascade,
  primary key (post_id, user_id)
);

create table if not exists public.community_reports (
  id          bigint generated always as identity primary key,
  reporter_id uuid not null references auth.users (id) on delete cascade,
  post_id     uuid references public.community_posts (id) on delete cascade,
  reply_id    uuid references public.community_replies (id) on delete cascade,
  reason      text not null check (reason in ('harmful', 'unkind', 'spam', 'private', 'other')),
  created_at  timestamptz not null default now()
);

create index if not exists community_posts_group_idx on public.community_posts (group_id, created_at desc);
create index if not exists community_replies_post_idx on public.community_replies (post_id, created_at);

alter table public.community_posts enable row level security;
alter table public.community_replies enable row level security;
alter table public.community_reactions enable row level security;
alter table public.community_reports enable row level security;

-- Signed-in members read visible posts; only the author's own posts are writable.
-- Note: user_id is readable here. Before launch, read posts through a view that
-- leaves out user_id, so anonymous posts can't be traced back to a member.
create policy "Posts: members read visible" on public.community_posts for select to authenticated using (not hidden);
create policy "Posts: insert own" on public.community_posts for insert to authenticated with check (auth.uid() = user_id and hidden = false);
create policy "Posts: delete own" on public.community_posts for delete to authenticated using (auth.uid() = user_id);

create policy "Replies: members read visible" on public.community_replies for select to authenticated using (not hidden);
create policy "Replies: insert own" on public.community_replies for insert to authenticated
  with check (auth.uid() = user_id and hidden = false and professional_id is null);  -- staff set professional replies
create policy "Replies: delete own" on public.community_replies for delete to authenticated using (auth.uid() = user_id);

create policy "Reactions: read" on public.community_reactions for select to authenticated using (true);
create policy "Reactions: own" on public.community_reactions for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Reports can be made but not read back; moderators use the service role
create policy "Reports: insert own" on public.community_reports for insert to authenticated with check (auth.uid() = reporter_id);
