-- =============================================================================
-- 0001_initial_schema.sql
--
-- Initial schema + Row-Level Security for the Pibble & Nibble database.
-- Every table that stores user-owned data enables RLS and enforces
-- user_id = auth.uid() on both read and write.
--
-- Apply via:
--   supabase db push
--     — or —
--   psql -f supabase/migrations/0001_initial_schema.sql
-- =============================================================================

-- ─── profiles ──────────────────────────────────────────────────────────────
-- One row per Supabase Auth user. `auth_id` references auth.users.id.

create table if not exists public.profiles (
  id                  uuid primary key default gen_random_uuid(),
  auth_id             uuid not null unique references auth.users(id) on delete cascade,
  display_name        text not null default '',
  minecraft_username  text,
  avatar_url          text,
  theme               text not null default 'deepslate',
  preferences         jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: owner read"
  on public.profiles for select
  using (auth.uid() = auth_id);

create policy "profiles: owner insert"
  on public.profiles for insert
  with check (auth.uid() = auth_id);

create policy "profiles: owner update"
  on public.profiles for update
  using (auth.uid() = auth_id)
  with check (auth.uid() = auth_id);

-- ─── builds ────────────────────────────────────────────────────────────────
-- Explicit column list mirroring MinecraftBuild. Sub-arrays and objects
-- are stored as jsonb — querying them is rare and the structural validator
-- owns the shape contract.

create table if not exists public.builds (
  id                  uuid primary key,
  user_id             uuid not null references auth.users(id) on delete cascade,
  name                text not null,
  description         text not null default '',
  generated_at        timestamptz not null default now(),
  theme               text not null,
  purpose             text not null,
  biome               text not null,
  style_tags          text[] not null default '{}',
  difficulty          text not null,
  progression_level   text not null,
  estimated_minutes   int  not null,
  required_skills     text[] not null default '{}',
  dimensions          jsonb not null,
  materials           jsonb not null,
  block_palette       jsonb not null,
  phases              jsonb not null,
  visual_preview      jsonb not null,
  validation          jsonb,
  is_favorite         boolean not null default false,
  is_ai_generated     boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists builds_user_id_idx on public.builds (user_id);
create index if not exists builds_updated_at_idx on public.builds (updated_at desc);

alter table public.builds enable row level security;

create policy "builds: owner read"
  on public.builds for select
  using (auth.uid() = user_id);

create policy "builds: owner insert"
  on public.builds for insert
  with check (auth.uid() = user_id);

create policy "builds: owner update"
  on public.builds for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "builds: owner delete"
  on public.builds for delete
  using (auth.uid() = user_id);

-- ─── projects ──────────────────────────────────────────────────────────────
-- One project per (user, build) pair — tracks completed steps + collected
-- materials. The unique constraint ensures we never create two drafts for
-- the same build.

create table if not exists public.projects (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  build_id            uuid not null references public.builds(id) on delete cascade,
  name                text,
  status              text not null default 'todo',
  current_step_id     text,
  completed_steps     text[] not null default '{}',
  collected_blocks    text[] not null default '{}',
  current_step_text   text,
  started_at          timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (user_id, build_id)
);

create index if not exists projects_user_id_idx on public.projects (user_id);

alter table public.projects enable row level security;

create policy "projects: owner read"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "projects: owner insert"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "projects: owner update"
  on public.projects for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "projects: owner delete"
  on public.projects for delete
  using (auth.uid() = user_id);

-- ─── world_notes ───────────────────────────────────────────────────────────
-- Coordinate pins shared in the two-player world. Both Pibble and Nibble
-- can read every note (shared-world read); only the author can mutate.

create table if not exists public.world_notes (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  label               text not null,
  description         text,
  x                   numeric not null,
  y                   numeric not null,
  z                   numeric not null,
  dimension           text not null default 'overworld',
  pin_color           text not null default '#6d83f2',
  build_id            uuid references public.builds(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists world_notes_user_id_idx on public.world_notes (user_id);

alter table public.world_notes enable row level security;

-- Shared read across authenticated users (two-player app).
create policy "world_notes: authenticated read"
  on public.world_notes for select
  using (auth.role() = 'authenticated');

create policy "world_notes: author insert"
  on public.world_notes for insert
  with check (auth.uid() = user_id);

create policy "world_notes: author update"
  on public.world_notes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "world_notes: author delete"
  on public.world_notes for delete
  using (auth.uid() = user_id);

-- ─── Realtime publications ─────────────────────────────────────────────────
-- Opt the four user-facing tables into the supabase_realtime publication
-- so the app's realtime subscriptions fire on INSERT/UPDATE/DELETE.

alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.builds;
alter publication supabase_realtime add table public.projects;
alter publication supabase_realtime add table public.world_notes;

-- ─── updated_at triggers ───────────────────────────────────────────────────

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch_updated
  before update on public.profiles
  for each row execute function public.touch_updated_at();

create trigger builds_touch_updated
  before update on public.builds
  for each row execute function public.touch_updated_at();

create trigger projects_touch_updated
  before update on public.projects
  for each row execute function public.touch_updated_at();

create trigger world_notes_touch_updated
  before update on public.world_notes
  for each row execute function public.touch_updated_at();
