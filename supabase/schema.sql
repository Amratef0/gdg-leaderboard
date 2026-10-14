-- =========================================================
-- GDG on Campus CIC - Student Leaderboard - Database Schema
-- Run this whole file in Supabase -> SQL Editor -> New query
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- TABLE: tracks
-- ---------------------------------------------------------
create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text not null default '#4285F4',
  created_at timestamptz default now()
);

-- ---------------------------------------------------------
-- TABLE: students
-- total_points is denormalized and kept in sync by a trigger
-- (see below) every time a point transaction changes, so the
-- public leaderboard can read it directly without exposing
-- the transaction log itself.
-- ---------------------------------------------------------
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  track_id uuid references public.tracks(id) on delete cascade,
  total_points integer not null default 0,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------
-- TABLE: point_transactions
-- One row per time an admin awards (or corrects) points.
-- category: assignment | quiz | attendance_bonus | bonus
-- points can be negative (used to correct a mistake).
-- ---------------------------------------------------------
create table if not exists public.point_transactions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  category text not null check (category in ('assignment','quiz','attendance_bonus','bonus')),
  points integer not null,
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

-- =========================================================
-- TRIGGER: keep students.total_points in sync automatically
-- =========================================================
create or replace function public.recalc_student_total()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_student_id uuid;
begin
  target_student_id := coalesce(new.student_id, old.student_id);

  update public.students
  set total_points = (
    select coalesce(sum(points), 0)
    from public.point_transactions
    where student_id = target_student_id
  )
  where id = target_student_id;

  return null;
end;
$$;

drop trigger if exists trg_recalc_student_total on public.point_transactions;
create trigger trg_recalc_student_total
after insert or update or delete on public.point_transactions
for each row execute function public.recalc_student_total();

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================
alter table public.tracks enable row level security;
alter table public.students enable row level security;
alter table public.point_transactions enable row level security;

-- tracks & students: readable by EVERYONE (public leaderboard,
-- no login needed) — writes require a logged-in admin account
create policy "tracks_public_select" on public.tracks
  for select using (true);

create policy "tracks_admin_write" on public.tracks
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

create policy "students_public_select" on public.students
  for select using (true);

create policy "students_admin_write" on public.students
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- point_transactions: NEVER public (contains internal notes) —
-- only a logged-in admin can read or write them. The public only
-- ever sees the resulting students.total_points column above.
create policy "transactions_admin_only_select" on public.point_transactions
  for select using (auth.uid() is not null);

create policy "transactions_admin_write" on public.point_transactions
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- =========================================================
-- DONE.
-- Next step (Supabase Dashboard):
-- 1) Authentication -> Providers -> Email -> turn OFF "Allow new
--    users to sign up" (accounts are only created by you).
-- 2) Authentication -> Users -> Add user -> create your admin
--    login (email + password), enable "Auto Confirm User".
-- =========================================================
