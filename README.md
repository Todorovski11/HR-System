# HR Leave Manager

A small React + Vite + Tailwind CSS MVP for managing employees and tracking vacation days, sick days, personal days, unpaid days, and other absences. The app connects to Supabase for Auth, PostgreSQL, and Row Level Security.

## What is included

- Supabase email/password login
- Admin-only employee CRUD
- Admin-only absence CRUD
- Manual pending/approved/rejected statuses
- Dashboard totals and vacation balance calculations
- Employee detail pages with absence history
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
- `app_settings` stores simple MVP settings as JSON.
- RLS is enabled on all tables.
- Admin access is checked through `public.is_admin()`, which looks up the signed-in user's profile role.

## Vacation calculation

The app calculates:

- Used vacation days: approved `vacation` absences in the current year.
- Remaining vacation days: `yearly_vacation_days - used vacation days`.
- Sick days are tracked separately and do not reduce vacation balance.
- `number_of_days` is calculated in the frontend as calendar days from `start_date` through `end_date`, including weekends.

The date counting logic is intentionally isolated in `src/utils/dates.ts` so it can later be changed to exclude weekends or holidays.
