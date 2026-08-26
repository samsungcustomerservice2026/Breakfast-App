# El Shabrawy — Office Breakfast (React + Supabase)

A standalone breakfast-ordering app. Employees sign in with email + password,
place a daily order from the El Shabrawy menu (prices in EGP, Shami/Balady
tiers, S/M/L combo boxes), and an admin compiles everyone's orders by date —
either as a full order grouped by category (to read to the store) or per person
with a "who pays what" breakdown and a paid/unpaid toggle.

Data and auth live in **Supabase**. The browser only ever holds the public
`anon` key; Row Level Security enforces who can read/write what.

## 1. Create a Supabase project
1. Go to supabase.com, create a project, and wait for it to provision.
2. In **Project Settings → API**, copy the **Project URL** and the **anon public** key.

## 2. Create the database
1. Open **SQL Editor → New query**.
2. Paste and run `supabase/schema.sql` (tables, RLS policies).
3. Paste and run `supabase/seed_menu.sql` (the menu).

## 3. Configure auth
- **Authentication → Providers → Email** is on by default.
- For a quick internal rollout you can turn **"Confirm email"** off
  (Authentication → Providers → Email) so people can sign in immediately.
  Leave it on if you want verified emails.

## 4. Point the app at your project
```bash
cp .env.example .env
# edit .env:
#   VITE_SUPABASE_URL=https://YOUR-ref.supabase.co
#   VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

## 5. Run it
```bash
npm install
npm run dev      # local dev at http://localhost:5173
npm run build    # production build in dist/
```

## 6. Make yourself the admin
1. Start the app and **create an account**, then fill in name + phone.
2. Back in Supabase **SQL Editor**, run (with your email):
   ```sql
   update public.profiles set is_admin = true
   where id = (select id from auth.users where email = 'you@example.com');
   ```
3. Refresh the app — the **Admin** button now appears in the header.

## Deploying
Any static host works (Vercel, Netlify, Cloudflare Pages, or your own Nginx).
Build with `npm run build` and serve the `dist/` folder. Set the two `VITE_…`
environment variables in your host's dashboard.

## How the data is structured
- `profiles` — one row per user: name, phone, `is_admin`.
- `menu_categories` / `menu_items` — the menu; only admins can edit, everyone
  signed in can read. Prices are per tier columns (`price_shami`,
  `price_balady`, or `price_sm/md/lg`).
- `orders` — one row per person per day (`unique(user_id, order_date)`), so
  resubmitting the same day **updates** that row instead of duplicating. The
  `items` column is JSON so each line remembers its category, tier, and price
  at order time. `paid` backs the admin toggle.

## Security notes
- RLS means a normal user can only read/write **their own** orders and profile;
  admins can read all orders and profiles and toggle `paid`. The menu is
  read-only to non-admins.
- The `anon` key is meant to be public — it's safe in the browser bundle. Never
  put the **service_role** key in this app.
- The Admin button is gated on `is_admin` in the UI, but the real protection is
  the RLS policies, so a user can't reach other people's data even by poking the
  API directly.

## About the menu
Transcribed from the El Shabrawy menu photos (the clear page): Foul, Falafel,
Potato, Egg, Assorted sandwiches, and combo boxes. The second (rotated/blurry)
photo's grill/combo section wasn't legible enough to price reliably and was left
out — add it in `seed_menu.sql` (or later via an admin menu editor) once you have
clear prices.
