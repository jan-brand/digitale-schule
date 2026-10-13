-- Campus Foundation v0.1 — school years, classes, subjects, courses.
-- Every academic table carries school_id directly and composite FKs tie
-- child rows to a parent row that belongs to the same school, so a
-- cross-school reference fails at the database level even if application
-- code has a bug (doc/DATA_MODEL.md).

create table public.school_years (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  name text not null,
  starts_on date not null,
  ends_on date not null,
  created_at timestamptz not null default now(),
  unique (school_id, name),
  check (ends_on > starts_on)
);

create unique index school_years_id_school_id_key on public.school_years (id, school_id);
create index school_years_school_id_idx on public.school_years (school_id);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null,
  school_year_id uuid not null,
  name text not null,
  created_at timestamptz not null default now(),
  foreign key (school_year_id, school_id) references public.school_years (id, school_id),
  unique (school_year_id, name)
);

create index classes_school_id_idx on public.classes (school_id);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  name text not null,
  code text not null,
  created_at timestamptz not null default now(),
  unique (school_id, code)
);

create unique index subjects_id_school_id_key on public.subjects (id, school_id);
create index subjects_school_id_idx on public.subjects (school_id);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null,
  school_year_id uuid not null,
  subject_id uuid not null,
  name text not null,
  created_at timestamptz not null default now(),
  foreign key (school_year_id, school_id) references public.school_years (id, school_id),
  foreign key (subject_id, school_id) references public.subjects (id, school_id)
);

create unique index courses_id_school_id_key on public.courses (id, school_id);
create index courses_school_id_idx on public.courses (school_id);

create type public.course_participant_role as enum ('student', 'teacher');

-- Needed so the FK below can address a membership by (user_id, id).
create unique index school_memberships_user_id_id_key on public.school_memberships (user_id, id);

create table public.course_memberships (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null,
  course_id uuid not null,
  user_id uuid not null,
  membership_id uuid not null references public.school_memberships (id) on delete cascade,
  membership_school_id uuid not null,
  participant_role public.course_participant_role not null,
  created_at timestamptz not null default now(),
  foreign key (course_id, school_id) references public.courses (id, school_id),
  -- Requires the same school AND an active membership of that school
  -- (doc/DATA_MODEL.md "Designentscheidungen").
  foreign key (membership_id, membership_school_id) references public.school_memberships (id, school_id),
  check (school_id = membership_school_id),
  foreign key (user_id, membership_id) references public.school_memberships (user_id, id),
  unique (course_id, user_id, participant_role)
);

create index course_memberships_course_id_idx on public.course_memberships (course_id);
create index course_memberships_user_id_idx on public.course_memberships (user_id);
