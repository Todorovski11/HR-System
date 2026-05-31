# HR Leave Manager

A small React + Vite + Tailwind CSS MVP for managing employees and tracking vacation days, sick days, personal days, unpaid days, and other absences. The app connects to Supabase for Auth, PostgreSQL, and Row Level Security.

## What is included

- Supabase email/password login
- Admin-only employee CRUD
- Admin-only absence CRUD
- Admin-only personal-hours CRUD
- Manual pending/approved/rejected statuses
- English and Macedonian UI with language switcher
- Dashboard totals and vacation balance calculations
- Personal-hours monthly/yearly dashboard totals
- Database audit history for absence and personal-hours changes
- Employee detail pages with absence history
- Employee detail pages with personal-hours records and audit history
- Mobile-friendly absence calendar list grouped by month
- Settings for app name, default yearly vacation days, and current year
- Complete Supabase SQL schema with RLS policies

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create a Supabase project.

3. In Supabase, open **SQL Editor**, paste the contents of `supabase/schema.sql`, and run it.

   If you already ran an older version of this project, run the updated `supabase/schema.sql` again. It adds:

   - `absence_history`
   - `personal_hours`
   - `personal_hours_history`
   - audit trigger functions
   - updated RLS policies

4. In Supabase, open **Authentication > Users** and create your admin user with email/password.

5. Find the new user's UUID in Supabase Auth, then create the first admin profile in **SQL Editor**:

```sql
insert into public.profiles (id, email, full_name, role)
values ('YOUR_AUTH_USER_UUID', 'you@example.com', 'Your Name', 'admin')
on conflict (id) do update set role = 'admin';
```

6. Copy `.env.example` to `.env` and fill in your Supabase project values:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Find these in **Supabase > Project Settings > API**. Supabase may label this key as the publishable key or anon public key depending on the dashboard version.

7. Run the app:

```bash
npm run dev
```

8. Open the local Vite URL, usually `http://localhost:5173`, and sign in.

## Build

```bash
npm run build
```

The generated `dist/` folder is deployment-ready for static hosts such as Vercel, Netlify, Cloudflare Pages, or Supabase hosting-compatible static deployment.

## Database notes

- `profiles` is connected to `auth.users`.
- `employees` stores employee records and vacation allowance.
- `absences` stores vacation/free-day, sick, personal, unpaid, and other records.
- `absence_history` stores automatic audit records for absence create, update, status change, and delete actions.
- `personal_hours` stores short personal time-away records.
- `personal_hours_history` stores automatic audit records for personal-hours create, update, and delete actions.
- `app_settings` stores simple MVP settings as JSON.
- RLS is enabled on all tables.
- Admin access is checked through `public.is_admin()`, which looks up the signed-in user's profile role.
- History tables are view-only from the frontend. The database writes them through PostgreSQL triggers.

## Import employees from the 2026 Word schedule

The private source document is kept in `data/`, which is ignored by Git.

To import the employees extracted from that file, run this in **Supabase > SQL Editor** after the main schema:

```sql
-- Paste and run the contents of:
-- supabase/seed_employees_2026.sql
```

The seed inserts employees only if the same `full_name` is not already present. It fills:

- `full_name`
- `employment_status = active`
- `yearly_vacation_days` from the source "ден" column
- `notes` with the source file and available "стаж" value

Fields such as email, phone, job title, object, and start date are intentionally left blank so you can complete them manually in the app.

If you also need to apply objects from the Ѕвездички/Први стапки schedules and add the missing people from `data/РАСПОРЕД ЗА ГОДИШНИ ОДМОРИ.doc`, run:

```sql
-- Paste and run the contents of:
-- supabase/import_departments_and_missing_employees.sql
```

That script updates existing employees by `full_name`, fills the object value in the `department` database column with `Ѕвездички` or `Први стапки`, and inserts missing names with default vacation days set to `20` where the old Word document could not reliably expose the vacation-day column.

To add the `Стаж` column and import the Бисерчиња employees, run:

```sql
-- Paste and run the contents of:
-- supabase/add_service_years_and_karposh4.sql
```

This script adds `employees.service_years`, inserts the Бисерчиња employees with Macedonian Cyrillic names, sets the object value with `department = Бисерчиња`, and fills yearly vacation days from the provided list.

To rename older labels already stored in Supabase, run:

```sql
-- Paste and run the contents of:
-- supabase/rename_departments_and_job_titles.sql
```

This changes `karposh 2` to `Ѕвездички`, `karposh 3` to `Први стапки`, `karposh 4` to `Бисерчиња`, and `Техничка служба/слушба` to `Технички персонал`.

To enable daily object assignments, run:

```sql
-- Paste and run the contents of:
-- supabase/add_employee_department_schedules.sql
```

Use the **Распоред по објект / Object Schedule** page to assign a person to a specific object on a specific date. The dashboard uses that scheduled object for today before falling back to the employee's default object.

To add employment type for employees, run:

```sql
-- Paste and run the contents of:
-- supabase/add_employment_type.sql
```

The default value is `редовен работен однос`. You can change individual employees to `договор на дело` from the employee edit form.

## Vacation calculation

The app calculates:

- Used vacation days: approved `vacation` absences in the current year.
- Remaining vacation days: `yearly_vacation_days - used vacation days`.
- Sick days are tracked separately and do not reduce vacation balance.
- `number_of_days` is calculated in the frontend as calendar days from `start_date` through `end_date`, including weekends.

The date counting logic is intentionally isolated in `src/utils/dates.ts` so it can later be changed to exclude weekends or holidays.

## Language

The app supports English and Macedonian.

- Default language is Macedonian.
- Use the `EN | MK` switcher in the header.
- The selected language is saved in browser `localStorage`.
- Database enum values stay in English, for example `vacation`, `approved`, and `pending`; only UI labels are translated.

## Audit history

Audit history is handled in Supabase with PostgreSQL triggers:

- Creating an absence writes `created`.
- Editing an absence writes `updated`.
- Changing absence status writes `status_changed`.
- Deleting an absence writes `deleted`.
- Creating, editing, or deleting personal-hours records writes history in `personal_hours_history`.

History rows keep JSON snapshots in `old_data` and `new_data`, so deleted records can still be reviewed later.

