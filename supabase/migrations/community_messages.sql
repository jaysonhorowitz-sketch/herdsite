create table if not exists community_messages (
  id uuid primary key default gen_random_uuid(),
  room_id text not null,
  user_id uuid references auth.users(id) on delete set null,
  display_name text not null,
  content text not null check (char_length(content) <= 280),
  created_at timestamptz not null default now()
);

create index if not exists community_messages_room_created on community_messages (room_id, created_at);

-- Anyone can read
alter table community_messages enable row level security;
create policy "public read" on community_messages for select using (true);

-- Must be logged in to insert, and user_id must match
create policy "auth insert" on community_messages for insert
  with check (auth.uid() = user_id);

-- Enable realtime
alter publication supabase_realtime add table community_messages;
