-- =============================================================================
-- Admin + members setup for shikharmishra.com
-- Run this ONCE in Supabase → SQL Editor → New query → Run.
--
-- What it does:
--   1. Creates a `profiles` table (one row per user).
--   2. Auto-creates a profile whenever someone signs up (trigger).
--   3. Backfills profiles for any users who already signed up.
--   4. Row-Level Security so:
--        - a normal user can read ONLY their own row
--        - an admin can read EVERY row (this powers the "all users" panel)
--   5. An is_admin() helper used by the policy (SECURITY DEFINER avoids RLS
--      recursion).
--
-- The website only ever uses the publishable (anon) key. The database — not
-- the browser — decides who may read what, so this is safe on a public site.
-- The service_role key is NEVER needed in the frontend.
-- =============================================================================

-- 1. profiles table -----------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  is_admin   boolean not null default false,
  created_at timestamptz not null default now()
);

-- 2. trigger: create a profile row for every new signup ------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. backfill rows for anyone who signed up before this trigger existed --------
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

-- 4. admin helper (SECURITY DEFINER so it can read profiles without RLS loop) --
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

-- 5. Row-Level Security --------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "read own profile"  on public.profiles;
drop policy if exists "admin reads all"    on public.profiles;
drop policy if exists "update own profile" on public.profiles;

-- everyone can read their own row
create policy "read own profile" on public.profiles
  for select using (auth.uid() = id);

-- admins can read every row  → this is what fills the "all users" list
create policy "admin reads all" on public.profiles
  for select using (public.is_admin());

-- users may edit their own row, but NOT escalate to admin
create policy "update own profile" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id and is_admin = false);

-- =============================================================================
-- 6. MAKE YOURSELF THE ADMIN
--    Replace the email below with YOUR account's email, then run just this line.
--    (You must have already signed up with this email at least once.)
-- =============================================================================
update public.profiles set is_admin = true
where email = 'YOUR-EMAIL@HERE.com';

-- Verify:
-- select email, is_admin, created_at from public.profiles order by created_at;
