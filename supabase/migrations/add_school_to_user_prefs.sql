-- Add school column to user_prefs (matches zip_code pattern)
alter table user_prefs
  add column if not exists school text;
