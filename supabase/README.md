# Connecting Living Dose to Supabase

When `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set (in `.env.local` locally,
and in Netlify → Site configuration → Environment variables for the live site),
the app uses Supabase. Without them it runs in demo mode on the device.

## What's connected

| Feature | On the server |
| --- | --- |
| Sign-in (phone or email code) | ✅ |
| Health check results | ✅ |
| **Orders** (prices checked on the server) | ✅ new |
| **Consultations** (no double-booking, fees set on the server) | ✅ new |
| Staff console: orders, consultations, activity log | ✅ |
| **Community** (posts, replies, helpful, reports; anonymous posts stay anonymous) | ✅ phase 2 |
| **Staff moderation** | ✅ phase 2 |
| **Professionals' portal** (consultations, shared results, summaries, private notes, hours) | ✅ phase 2 |
| **Organisations** (joining with a code; anonymised totals worked out on the server) | ✅ phase 2 |
| **Online payments with Paystack** (see PAYMENTS.md) | ✅ |
| **Personal data across your devices**: meal plan, food diary (photos stay on the device), habits, unfinished health check, household, notification choices, saved articles, groups and challenges | ✅ phase 3 |

## Set up, step by step

Run each file in **Supabase → SQL Editor → New query → paste → Run**, in this order.
Each one is safe to run once; stop and check if any shows an error.

1. `migrations/0001_profiles_and_contact.sql`
2. `migrations/0002_health_checks.sql`
3. `migrations/0003_orders.sql`
4. `migrations/0004_appointments.sql`
5. `migrations/0005_community.sql`
6. `migrations/0006_staff.sql`
7. `migrations/0007_professionals.sql`
8. `migrations/0008_organisations.sql`
9. `migrations/0009_secure_shop_and_care.sql`
10. `migrations/0010_community_professionals_organisations.sql`
11. `migrations/0011_personal_sync.sql`
12. `migrations/0012_payments.sql` (then follow `PAYMENTS.md` to switch on Pay now)
13. `seed/products.sql`: the catalogue, prices and delivery settings
14. `seed/sample_professionals.sql`: **for testing only.** These 10 people are fictional.
    Delete them before launch (the command is at the top of the file).
15. `seed/sample_organisations.sql`: **for testing only.** Three sample organisations.

## Make yourself staff

In the SQL Editor (use your own email):

```sql
update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"staff"}'
where email = 'you@example.com';
```

Sign out and back in, then open `/staff`.

## Link a professional or an organisation's administrator

Only after verifying them. In the SQL Editor (use their email and IDs):

```sql
-- A professional (professional_id must match their profile)
update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"professional","professional_id":"funmi-adeyemi"}'
where email = 'funmi@example.com';

-- An organisation's administrator
update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"org_admin","org_id":"lagos-foods"}'
where email = 'hr@example.com';
```

They sign out and back in, then open `/pro` or `/org`.

## Changing prices or products

Edit `src/data/products.js` (or delivery settings in `src/config/shop.js`), then:

```bash
npm run db:seed
```

and run the regenerated `seed/products.sql` in the SQL Editor. The server only ever
charges the prices in the `products` table.

## Testing the database rules (optional)

With PostgreSQL 15+ installed locally:

```bash
npm run db:test
```

This builds a throwaway database, runs every migration and seed, then checks 135
security rules. For example: prices can't be changed from the browser, nobody can
see another member's orders, two people can't book the same time, anonymous posts
never reveal who wrote them, private notes stay private, and organisations never
see individual results or counts under 5.

## How personal sync works

Everything saves on the device first, so the app stays fast and works offline.
Changes go up to the server shortly after they happen; newer copies come down when
the app opens, comes back online, or returns to the screen. If the same thing
changed on two devices, the most recent change wins, and the device keeps a backup
copy of its version (`ld.sync.backup.*` in the browser's storage).
