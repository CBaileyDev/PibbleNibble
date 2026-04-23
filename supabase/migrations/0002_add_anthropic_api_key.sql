-- Per-user Anthropic API key for BYOK build generation.
-- Existing RLS policies on profiles (owner-only SELECT/UPDATE) cover this column.
alter table public.profiles
  add column if not exists anthropic_api_key text;
