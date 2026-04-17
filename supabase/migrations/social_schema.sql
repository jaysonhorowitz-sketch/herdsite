-- ─── Add social columns to user_prefs ────────────────────────────────────────
alter table user_prefs
  add column if not exists display_name  text,
  add column if not exists username      text unique,
  add column if not exists animal_type   text,
  add column if not exists is_private    boolean default false,
  add column if not exists updated_at    timestamptz default now();

-- ─── follows ─────────────────────────────────────────────────────────────────
create table if not exists follows (
  id           uuid primary key default gen_random_uuid(),
  follower_id  uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  status       text not null default 'accepted' check (status in ('accepted','pending')),
  created_at   timestamptz default now(),
  unique(follower_id, following_id)
);

create index if not exists follows_follower_id_idx  on follows(follower_id);
create index if not exists follows_following_id_idx on follows(following_id);

-- ─── user_activity ────────────────────────────────────────────────────────────
create table if not exists user_activity (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  activity_type text not null,   -- 'completed_action' | 'saved_issue'
  issue_slug    text,
  issue_title   text,
  created_at    timestamptz default now()
);

create index if not exists user_activity_user_id_idx    on user_activity(user_id);
create index if not exists user_activity_created_at_idx on user_activity(created_at desc);

-- ─── activity_likes ───────────────────────────────────────────────────────────
create table if not exists activity_likes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  activity_id uuid not null references user_activity(id) on delete cascade,
  created_at  timestamptz default now(),
  unique(user_id, activity_id)
);

create index if not exists activity_likes_activity_id_idx on activity_likes(activity_id);

-- ─── RLS policies ─────────────────────────────────────────────────────────────
alter table follows       enable row level security;
alter table user_activity enable row level security;
alter table activity_likes enable row level security;

-- follows: anyone can see accepted follows; only you can insert/delete your own
create policy "follows_select" on follows for select using (true);
create policy "follows_insert" on follows for insert with check (auth.uid() = follower_id);
create policy "follows_delete" on follows for delete using (auth.uid() = follower_id);

-- user_activity: public accounts visible to all; private accounts visible only to followers + self
create policy "activity_select" on user_activity for select using (
  exists (
    select 1 from user_prefs up
    where up.user_id = user_activity.user_id
      and (
        up.is_private = false
        or up.user_id = auth.uid()
        or exists (select 1 from follows f where f.follower_id = auth.uid() and f.following_id = up.user_id and f.status = 'accepted')
      )
  )
);
create policy "activity_insert" on user_activity for insert with check (auth.uid() = user_id);
create policy "activity_delete" on user_activity for delete using (auth.uid() = user_id);

-- activity_likes: anyone can see likes; only you can add/remove your own
create policy "likes_select" on activity_likes for select using (true);
create policy "likes_insert" on activity_likes for insert with check (auth.uid() = user_id);
create policy "likes_delete" on activity_likes for delete using (auth.uid() = user_id);

-- user_prefs: public read for social features (username lookup, animal display)
-- (assumes user_prefs already has RLS; just add a select policy for the new social columns)
create policy "prefs_public_select" on user_prefs for select using (true);
