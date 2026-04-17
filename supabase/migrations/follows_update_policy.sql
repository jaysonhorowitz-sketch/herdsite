-- Allow the person being followed to accept pending requests (update status to 'accepted')
create policy "follows_update" on follows
  for update
  using (auth.uid() = following_id)
  with check (auth.uid() = following_id);
