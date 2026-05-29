create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'employee' check (role in ('admin', 'employee')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text,
  job_title text,
  department text,
  employment_start_date date,
  employment_status text not null default 'active' check (employment_status in ('active', 'inactive')),
  yearly_vacation_days integer not null default 20 check (yearly_vacation_days >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.absences (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  type text not null check (type in ('vacation', 'sick', 'personal', 'unpaid', 'other')),
  start_date date not null,
  end_date date not null,
  number_of_days integer not null check (number_of_days > 0),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint absences_end_after_start check (end_date >= start_date)
);

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists employees_full_name_idx on public.employees using btree (full_name);
create index if not exists employees_status_idx on public.employees (employment_status);
create index if not exists absences_employee_id_idx on public.absences (employee_id);
create index if not exists absences_status_idx on public.absences (status);
create index if not exists absences_type_idx on public.absences (type);
create index if not exists absences_start_end_idx on public.absences (start_date, end_date);
create index if not exists profiles_role_idx on public.profiles (role);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_employees_updated_at on public.employees;
create trigger set_employees_updated_at
before update on public.employees
for each row execute function public.set_updated_at();

drop trigger if exists set_absences_updated_at on public.absences;
create trigger set_absences_updated_at
before update on public.absences
for each row execute function public.set_updated_at();

drop trigger if exists set_app_settings_updated_at on public.app_settings;
create trigger set_app_settings_updated_at
before update on public.app_settings
for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.employees enable row level security;
alter table public.absences enable row level security;
alter table public.app_settings enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles for select
to authenticated
using (id = auth.uid());

drop policy if exists "Admins can read all profiles" on public.profiles;
create policy "Admins can read all profiles"
on public.profiles for select
to authenticated
using (public.is_admin());

drop policy if exists "Users can create own profile" on public.profiles;
create policy "Users can create own profile"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "Admins can manage profiles" on public.profiles;
create policy "Admins can manage profiles"
on public.profiles for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can manage employees" on public.employees;
create policy "Admins can manage employees"
on public.employees for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can manage absences" on public.absences;
create policy "Admins can manage absences"
on public.absences for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can manage app settings" on public.app_settings;
create policy "Admins can manage app settings"
on public.app_settings for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into public.app_settings (key, value)
values (
  'general',
  '{"app_name":"HR Leave Manager","default_yearly_vacation_days":20}'::jsonb
)
on conflict (key) do nothing;
