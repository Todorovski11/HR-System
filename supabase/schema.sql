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

create table if not exists public.absence_history (
  id uuid primary key default gen_random_uuid(),
  absence_id uuid,
  employee_id uuid,
  action text not null check (action in ('created', 'updated', 'status_changed', 'deleted')),
  old_data jsonb,
  new_data jsonb,
  changed_by uuid references public.profiles(id) on delete set null,
  changed_at timestamptz not null default now()
);

create table if not exists public.personal_hours (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  date date not null,
  number_of_hours numeric(5,2) not null check (number_of_hours > 0 and number_of_hours <= 24),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.personal_hours_history (
  id uuid primary key default gen_random_uuid(),
  personal_hours_id uuid,
  employee_id uuid,
  action text not null check (action in ('created', 'updated', 'deleted')),
  old_data jsonb,
  new_data jsonb,
  changed_by uuid references public.profiles(id) on delete set null,
  changed_at timestamptz not null default now()
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
create index if not exists absence_history_absence_id_idx on public.absence_history (absence_id);
create index if not exists absence_history_employee_id_idx on public.absence_history (employee_id);
create index if not exists absence_history_changed_at_idx on public.absence_history (changed_at desc);
create index if not exists personal_hours_employee_id_idx on public.personal_hours (employee_id);
create index if not exists personal_hours_date_idx on public.personal_hours (date);
create index if not exists personal_hours_created_by_idx on public.personal_hours (created_by);
create index if not exists personal_hours_history_record_id_idx on public.personal_hours_history (personal_hours_id);
create index if not exists personal_hours_history_employee_id_idx on public.personal_hours_history (employee_id);
create index if not exists personal_hours_history_changed_at_idx on public.personal_hours_history (changed_at desc);
create index if not exists profiles_role_idx on public.profiles (role);

create or replace function public.set_updated_at()
returns trigger
as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

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

drop trigger if exists set_personal_hours_updated_at on public.personal_hours;
create trigger set_personal_hours_updated_at
before update on public.personal_hours
for each row execute function public.set_updated_at();

drop trigger if exists set_app_settings_updated_at on public.app_settings;
create trigger set_app_settings_updated_at
before update on public.app_settings
for each row execute function public.set_updated_at();

create or replace function public.audit_absences()
returns trigger
as $$
declare
  admin_id uuid := auth.uid();
  history_action text;
begin
  if tg_op = 'INSERT' then
    insert into public.absence_history (absence_id, employee_id, action, old_data, new_data, changed_by)
    values (new.id, new.employee_id, 'created', null, to_jsonb(new), coalesce(new.created_by, admin_id));
    return new;
  elsif tg_op = 'UPDATE' then
    history_action := case
      when old.status is distinct from new.status then 'status_changed'
      else 'updated'
    end;

    insert into public.absence_history (absence_id, employee_id, action, old_data, new_data, changed_by)
    values (new.id, new.employee_id, history_action, to_jsonb(old), to_jsonb(new), admin_id);
    return new;
  elsif tg_op = 'DELETE' then
    insert into public.absence_history (absence_id, employee_id, action, old_data, new_data, changed_by)
    values (old.id, old.employee_id, 'deleted', to_jsonb(old), null, admin_id);
    return old;
  end if;

  return null;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists audit_absences_insert on public.absences;
create trigger audit_absences_insert
after insert on public.absences
for each row execute function public.audit_absences();

drop trigger if exists audit_absences_update on public.absences;
create trigger audit_absences_update
after update on public.absences
for each row execute function public.audit_absences();

drop trigger if exists audit_absences_delete on public.absences;
create trigger audit_absences_delete
after delete on public.absences
for each row execute function public.audit_absences();

create or replace function public.audit_personal_hours()
returns trigger
as $$
declare
  admin_id uuid := auth.uid();
begin
  if tg_op = 'INSERT' then
    insert into public.personal_hours_history (personal_hours_id, employee_id, action, old_data, new_data, changed_by)
    values (new.id, new.employee_id, 'created', null, to_jsonb(new), coalesce(new.created_by, admin_id));
    return new;
  elsif tg_op = 'UPDATE' then
    insert into public.personal_hours_history (personal_hours_id, employee_id, action, old_data, new_data, changed_by)
    values (new.id, new.employee_id, 'updated', to_jsonb(old), to_jsonb(new), admin_id);
    return new;
  elsif tg_op = 'DELETE' then
    insert into public.personal_hours_history (personal_hours_id, employee_id, action, old_data, new_data, changed_by)
    values (old.id, old.employee_id, 'deleted', to_jsonb(old), null, admin_id);
    return old;
  end if;

  return null;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists audit_personal_hours_insert on public.personal_hours;
create trigger audit_personal_hours_insert
after insert on public.personal_hours
for each row execute function public.audit_personal_hours();

drop trigger if exists audit_personal_hours_update on public.personal_hours;
create trigger audit_personal_hours_update
after update on public.personal_hours
for each row execute function public.audit_personal_hours();

drop trigger if exists audit_personal_hours_delete on public.personal_hours;
create trigger audit_personal_hours_delete
after delete on public.personal_hours
for each row execute function public.audit_personal_hours();

create or replace function public.is_admin()
returns boolean
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$ language sql stable security definer set search_path = public;

alter table public.profiles enable row level security;
alter table public.employees enable row level security;
alter table public.absences enable row level security;
alter table public.absence_history enable row level security;
alter table public.personal_hours enable row level security;
alter table public.personal_hours_history enable row level security;
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

drop policy if exists "Admins can read absence history" on public.absence_history;
create policy "Admins can read absence history"
on public.absence_history for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can manage personal hours" on public.personal_hours;
create policy "Admins can manage personal hours"
on public.personal_hours for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can read personal hours history" on public.personal_hours_history;
create policy "Admins can read personal hours history"
on public.personal_hours_history for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can manage app settings" on public.app_settings;
create policy "Admins can manage app settings"
on public.app_settings for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into public.app_settings (key, value)
values (
  'general',
  '{"app_name":"HR Leave Manager","default_yearly_vacation_days":20,"default_language":"mk"}'::jsonb
)
on conflict (key) do nothing;
