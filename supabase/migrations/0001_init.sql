-- =============================================================
-- TutorFlow schema
-- Applied to Supabase project rrkvwwzqmlnwkbrnnvbe
-- =============================================================

-- Session statuses move in strict order:
-- scheduled -> in_progress -> completed -> ai_reviewed
create type session_status as enum ('scheduled', 'in_progress', 'completed', 'ai_reviewed');

-- -------------------------------------------------------------
-- profiles: one row per auth user (tutor or student)
-- -------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role text not null check (role in ('tutor', 'student')),
  created_at timestamptz not null default now()
);

-- -------------------------------------------------------------
-- students: a student account plus the tutor relationship
-- -------------------------------------------------------------
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  tutor_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  subject text not null default '',
  current_level text not null default '',
  learning_goals text not null default '',
  weak_areas text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists students_tutor_id_idx on public.students (tutor_id);
create index if not exists students_user_id_idx on public.students (user_id);

-- -------------------------------------------------------------
-- sessions: the core entity
-- -------------------------------------------------------------
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.profiles (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  topic text not null,
  starts_at timestamptz not null,
  status session_status not null default 'scheduled',
  notes text not null default '',
  ai_plan jsonb,
  ai_review jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sessions_tutor_id_idx on public.sessions (tutor_id);
create index if not exists sessions_student_id_idx on public.sessions (student_id);

-- -------------------------------------------------------------
-- Trigger: keep updated_at fresh
-- -------------------------------------------------------------
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists sessions_set_updated_at on public.sessions;
create trigger sessions_set_updated_at
  before update on public.sessions
  for each row execute function public.handle_updated_at();

-- -------------------------------------------------------------
-- Trigger: enforce session lifecycle order at the DB level
-- -------------------------------------------------------------
create or replace function public.check_session_status()
returns trigger language plpgsql as $$
begin
  if old.status = new.status then
    return new;
  end if;
  if not (
    (old.status = 'scheduled' and new.status = 'in_progress') or
    (old.status = 'in_progress' and new.status = 'completed') or
    (old.status = 'completed' and new.status = 'ai_reviewed')
  ) then
    raise exception 'Invalid session status transition from % to %', old.status, new.status;
  end if;
  -- Once completed, nothing may change except status -> ai_reviewed
  if old.status = 'completed' and new.status = 'ai_reviewed' and new.topic is distinct from old.topic then
    raise exception 'Cannot edit a completed session';
  end if;
  return new;
end;
$$;

drop trigger if exists sessions_check_status on public.sessions;
create trigger sessions_check_status
  before update on public.sessions
  for each row execute function public.check_session_status();

-- -------------------------------------------------------------
-- Trigger: create profile row when an auth user is created
-- -------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'role', 'student')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -------------------------------------------------------------
-- Row Level Security
-- -------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.sessions enable row level security;

-- profiles: users see / update only their own
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (auth.uid() = id);

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update using (auth.uid() = id);

-- students: tutors manage their own students; students see their own row
drop policy if exists students_select on public.students;
create policy students_select on public.students
  for select using (auth.uid() = tutor_id or auth.uid() = user_id);

drop policy if exists students_insert on public.students;
create policy students_insert on public.students
  for insert with check (auth.uid() = tutor_id);

drop policy if exists students_update on public.students;
create policy students_update on public.students
  for update using (auth.uid() = tutor_id);

drop policy if exists students_delete on public.students;
create policy students_delete on public.students
  for delete using (auth.uid() = tutor_id);

-- sessions: tutors manage their own; students read their own sessions
drop policy if exists sessions_select on public.sessions;
create policy sessions_select on public.sessions
  for select using (
    auth.uid() = tutor_id or
    auth.uid() in (
      select user_id from public.students where id = sessions.student_id
    )
  );

drop policy if exists sessions_insert on public.sessions;
create policy sessions_insert on public.sessions
  for insert with check (auth.uid() = tutor_id);

drop policy if exists sessions_update on public.sessions;
create policy sessions_update on public.sessions
  for update using (auth.uid() = tutor_id);

drop policy if exists sessions_delete on public.sessions;
create policy sessions_delete on public.sessions
  for delete using (auth.uid() = tutor_id);
