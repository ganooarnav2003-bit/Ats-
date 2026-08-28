-- Performance Management System schema
-- Requires pgcrypto / uuid-ossp. Enable on Supabase:
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

create table if not exists public.employees (
  id uuid primary key default uuid_generate_v4(),
  clerk_user_id text unique,
  full_name text not null,
  email text unique not null,
  designation text,
  department text,
  date_of_joining date,
  manager_id uuid references public.employees (id) on delete set null,
  role text not null default 'employee' check (role in ('employee', 'manager', 'hr_admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.review_cycles (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  start_date date not null,
  end_date date not null,
  status text not null default 'draft' check (status in ('draft', 'open', 'closed')),
  created_by uuid references public.employees (id),
  created_at timestamptz not null default now(),
  constraint cycle_dates check (end_date >= start_date)
);

create unique index if not exists review_cycles_one_open
  on public.review_cycles (status)
  where status = 'open';

create table if not exists public.goals (
  id uuid primary key default uuid_generate_v4(),
  employee_id uuid not null references public.employees (id),
  cycle_id uuid not null references public.review_cycles (id),
  title text not null,
  description text,
  weightage integer check (weightage >= 0 and weightage <= 100),
  target_date date,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'approved', 'sent_back')),
  manager_comment text,
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default uuid_generate_v4(),
  employee_id uuid not null references public.employees (id),
  manager_id uuid not null references public.employees (id),
  cycle_id uuid not null references public.review_cycles (id),
  status text not null default 'not_started' check (
    status in ('not_started', 'self_appraisal_submitted', 'manager_reviewed', 'completed')
  ),
  overall_self_rating numeric(3, 2),
  overall_manager_rating numeric(3, 2),
  manager_summary text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (employee_id, cycle_id)
);

create table if not exists public.goal_ratings (
  id uuid primary key default uuid_generate_v4(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  goal_id uuid not null references public.goals (id),
  self_comment text,
  self_rating integer check (self_rating in (1, 2, 3, 4, 5)),
  manager_comment text,
  manager_rating integer check (manager_rating in (1, 2, 3, 4, 5)),
  unique (review_id, goal_id)
);

create index if not exists employees_manager_id_idx on public.employees (manager_id);
create index if not exists goals_employee_cycle_idx on public.goals (employee_id, cycle_id);
create index if not exists reviews_manager_cycle_idx on public.reviews (manager_id, cycle_id);

-- Resolve the signed-in employee from a Clerk JWT template:
-- { "sub": "<clerk user id>", "email": "<email>" }
create or replace function public.current_employee_id()
returns uuid
language sql
stable
as $$
  select e.id
  from public.employees e
  where e.is_active = true
    and (
      e.clerk_user_id = coalesce(auth.jwt() ->> 'sub', '')
      or lower(e.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  limit 1
$$;

create or replace function public.current_employee_role()
returns text
language sql
stable
as $$
  select e.role
  from public.employees e
  where e.id = public.current_employee_id()
$$;

create or replace function public.is_hr_admin()
returns boolean
language sql
stable
as $$
  select coalesce(public.current_employee_role() = 'hr_admin', false)
$$;

create or replace function public.is_manager_of(target uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.employees e
    where e.id = target
      and e.manager_id = public.current_employee_id()
  )
$$;

alter table public.employees enable row level security;
alter table public.review_cycles enable row level security;
alter table public.goals enable row level security;
alter table public.reviews enable row level security;
alter table public.goal_ratings enable row level security;

-- employees
create policy employees_select on public.employees
  for select using (
    id = public.current_employee_id()
    or manager_id = public.current_employee_id()
    or public.is_hr_admin()
  );

create policy employees_insert_hr on public.employees
  for insert with check (public.is_hr_admin());

create policy employees_update_hr on public.employees
  for update using (public.is_hr_admin())
  with check (public.is_hr_admin());

-- review_cycles
create policy cycles_select on public.review_cycles
  for select using (public.current_employee_id() is not null);

create policy cycles_write_hr on public.review_cycles
  for all using (public.is_hr_admin())
  with check (public.is_hr_admin());

-- goals
create policy goals_select on public.goals
  for select using (
    employee_id = public.current_employee_id()
    or public.is_manager_of(employee_id)
    or public.is_hr_admin()
  );

create policy goals_insert_own on public.goals
  for insert with check (
    employee_id = public.current_employee_id()
    or public.is_hr_admin()
  );

create policy goals_update on public.goals
  for update using (
    (employee_id = public.current_employee_id() and status in ('draft', 'sent_back'))
    or public.is_manager_of(employee_id)
    or public.is_hr_admin()
  );

create policy goals_delete_own on public.goals
  for delete using (
    (employee_id = public.current_employee_id() and status in ('draft', 'sent_back'))
    or public.is_hr_admin()
  );

-- reviews
create policy reviews_select on public.reviews
  for select using (
    employee_id = public.current_employee_id()
    or manager_id = public.current_employee_id()
    or public.is_hr_admin()
  );

create policy reviews_insert on public.reviews
  for insert with check (
    employee_id = public.current_employee_id()
    or public.is_hr_admin()
  );

create policy reviews_update on public.reviews
  for update using (
    employee_id = public.current_employee_id()
    or manager_id = public.current_employee_id()
    or public.is_hr_admin()
  );

-- goal_ratings
create policy goal_ratings_select on public.goal_ratings
  for select using (
    exists (
      select 1 from public.reviews r
      where r.id = review_id
        and (
          r.employee_id = public.current_employee_id()
          or r.manager_id = public.current_employee_id()
          or public.is_hr_admin()
        )
    )
  );

create policy goal_ratings_write on public.goal_ratings
  for all using (
    exists (
      select 1 from public.reviews r
      where r.id = review_id
        and (
          r.employee_id = public.current_employee_id()
          or r.manager_id = public.current_employee_id()
          or public.is_hr_admin()
        )
    )
  )
  with check (
    exists (
      select 1 from public.reviews r
      where r.id = review_id
        and (
          r.employee_id = public.current_employee_id()
          or r.manager_id = public.current_employee_id()
          or public.is_hr_admin()
        )
    )
  );
