# LifeLedger

Personal journal app. **MVP = expenses** (manual + bank-statement import). Other life areas get their own `src/features/*` later.

## Run

```bash
npm install
cp .env.example .env
npm run dev
```

Open the URL Vite prints. You must **sign in with Google** (Gmail) before the app shell loads. Data still lives in **IndexedDB** (Dexie) per Google user id.

### Google + Supabase

1. Create a [Supabase](https://supabase.com) project.
2. Run SQL in the editor: `supabase/migrations/001_init.sql` (optional until expense sync), then **`004_plans_and_splits.sql`**, then **`005_admin_roles.sql`**.
3. Put `VITE_SUPABASE_URL` and the **anon** key in `.env`. Restart Vite.
4. [Google Cloud Console](https://console.cloud.google.com/) → create an OAuth 2.0 **Web** client.
   - Authorized JavaScript origins: `http://localhost:5173` (and your production origin).
   - Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
5. Supabase → Authentication → Providers → **Google**: enable, paste Client ID and secret.
6. Supabase → Authentication → URL configuration:
   - Site URL: `http://localhost:5173` locally, or your Pages URL in production
   - Redirect URLs: `http://localhost:5173/**` and `https://<project>.pages.dev/**` (plus a custom domain if you add one)

Never put `service_role` in the client.

## Deploy (Cloudflare Pages)

The app is a static Vite SPA. Host it on [Cloudflare Pages](https://developers.cloudflare.com/pages/) (HTTPS, needed for PWA install).

1. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → this repo.
2. Build settings:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** `/`
   - **Node:** 20+ (set `NODE_VERSION=20` if the default is older)
3. **Environment variables** (Production, and Preview if you want Google login on preview URLs). Vite inlines these at **build** time — change them and trigger a new deploy:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY` (anon key only)
   - Optional `VITE_PUBLIC_APP_URL` — canonical site URL shown in Settings (use this so localhost still copies the Pages URL)
   - Do **not** set `VITE_LLM_API_KEY`; users paste a key in Settings.
4. After the first deploy, add the `https://<project>.pages.dev` origin to Google OAuth (JavaScript origin) and Supabase redirect URLs (step 6 above).
5. Smoke-test: hard-reload `/`, `/expenses`, and `/settings`; sign in with Google; install from a phone.

SPA deep links use [`public/_redirects`](public/_redirects) (`/*` → `/index.html`).

Optional one-off from a machine (env must already be in the built `dist/`):

```bash
npm run build
npx wrangler pages deploy dist --project-name lifeledger
```

## App shell

- Left nav and Home cards are [`src/shared/config/features.ts`](src/shared/config/features.ts) intersected with **role + `profile_modules`**. Admins get every catalog module. `/admin` is admin-only (not a grantable module).
- Expense tracker: `/expenses`. Splits (if enabled for that user): `/splits`.
- Themes use CSS variables (`--ll-*`) via [`src/shared/theme`](src/shared/theme).

## Modules

- `src/features/expenses` — capture, list, totals, accept/reject imported rows. Owns the expense contract.
- `src/features/imports` — CSV parse (no LLM), optional LLM extract if CSV is empty, month review LLM. Writes **proposals** through `proposeImported`.
- `src/features/splits` — group bills, balances, settle up (Supabase). Gated per user by an admin. Does not use expense-tracker tables.

Expense UI sections: **You entered** vs **From bank statements** (pending review, then committed with `origin: statement`).

## Admin and module access

1. Apply [`004_plans_and_splits.sql`](supabase/migrations/004_plans_and_splits.sql), then [`005_admin_roles.sql`](supabase/migrations/005_admin_roles.sql).
2. Sign in once with the Google account that should be admin so `auth.users` exists, then run `005` (it seeds that Auth email as admin). The email is only in SQL, not in the React app.
3. After refresh, **Admin** appears in nav. From `/admin`, set each person’s role and toggle Expenses / Splits. New **user** signups get the Free catalog (Home + Expenses) until an admin adds Splits.
4. Invitees must already have a LifeLedger Google login. Keep localhost **and** Pages URLs in Supabase redirect allow-list.

Phase 1: groups, equal/exact/shares/percent splits, balances, settle up. Not yet: friends 1:1, simplify debts, comments, receipts.

## CSV

Headers understood: `Date` / `Txn Date`, `Debit` / `Amount`, `Credit`, `Narration` / `Description`. Credits are skipped. See `public/sample-hdfc-style.csv`.

## Architecture blueprint

Decisions and a recreate-from-scratch pack live in [`docs/`](./docs/README.md). Start with [`docs/DECISIONS.md`](./docs/DECISIONS.md).

## LLM

Optional. Paste an OpenAI key in Settings (browser only). Month review sends **aggregates**, not the raw file. Extract is a fallback when CSV parsing finds no spends.
