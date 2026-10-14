-- =========================================================
-- MIGRATION 2 — Contact info, public activity feed, weekly
-- snapshots, and the optional external award-points bridge.
-- Run this in Supabase -> SQL Editor -> New query
-- (Safe to run once on top of schema.sql)
-- =========================================================

-- ---------------------------------------------------------
-- ALTER: students — email + phone (collected when adding them)
-- ---------------------------------------------------------
alter table public.students add column if not exists email text;
alter table public.students add column if not exists phone text;

-- ---------------------------------------------------------
-- TABLE: activity_feed
-- A PUBLIC-SAFE log of positive point awards only (no notes,
-- no admin id) — powers the live ticker, weekly "Top Gainers",
-- and each student's streak calculation, all without exposing
-- the admin-only point_transactions table.
-- ---------------------------------------------------------
create table if not exists public.activity_feed (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete set null,
  student_name text not null,
  track_id uuid references public.tracks(id) on delete set null,
  category text not null,
  points integer not null,
  created_at timestamptz default now()
);

create or replace function public.log_activity_feed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  s_name text;
  s_track uuid;
begin
  if new.points > 0 then
    select full_name, track_id into s_name, s_track from public.students where id = new.student_id;
    insert into public.activity_feed (student_id, student_name, track_id, category, points)
    values (new.student_id, coalesce(s_name, 'A student'), s_track, new.category, new.points);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_log_activity_feed on public.point_transactions;
create trigger trg_log_activity_feed
after insert on public.point_transactions
for each row execute function public.log_activity_feed();

-- ---------------------------------------------------------
-- TABLE: weekly_snapshots
-- Admin-triggered (button in the dashboard) snapshot of the
-- standings, so "who was #1 mid-season" is always answerable.
-- ---------------------------------------------------------
create table if not exists public.weekly_snapshots (
  id uuid primary key default gen_random_uuid(),
  week_start date not null,
  scope text not null, -- 'global' or a track_id (as text)
  rank integer not null,
  student_name text not null,
  track_name text,
  total_points integer not null,
  created_at timestamptz default now()
);

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================
alter table public.activity_feed enable row level security;
alter table public.weekly_snapshots enable row level security;

-- activity_feed: public read (it's already scrubbed of anything
-- sensitive) — only the trigger (security definer) ever writes to it
create policy "activity_feed_public_select" on public.activity_feed
  for select using (true);

-- weekly_snapshots: admin-only (kept as an internal reference)
create policy "weekly_snapshots_admin_select" on public.weekly_snapshots
  for select using (auth.uid() is not null);

create policy "weekly_snapshots_admin_write" on public.weekly_snapshots
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- =========================================================
-- DONE.
-- =========================================================
