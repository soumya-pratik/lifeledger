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
2. Run `supabase/migrations/001_init.sql` in the SQL editor (optional until cloud sync).
3. Put `VITE_SUPABASE_URL` and the **anon** key in `.env`. Restart Vite.
4. [Google Cloud Console](https://console.cloud.google.com/) → create an OAuth 2.0 **Web** client.
   - Authorized JavaScript origins: `http://localhost:5173` (and your production origin).
   - Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
5. Supabase → Authentication → Providers → **Google**: enable, paste Client ID and secret.
6. Supabase → Authentication → URL configuration:
   - Site URL: `http://localhost:5173`
   - Redirect URLs: `http://localhost:5173/**` and your production origin.

Never put `service_role` in the client.

## App shell

- Left nav and Home cards are driven by [`src/shared/config/features.ts`](src/shared/config/features.ts). Add a feature object there to register a new section.
- Expense tracker lives at `/expenses`; statement import is `/expenses/import`.
- Themes use CSS variables (`--ll-*`) via [`src/shared/theme`](src/shared/theme). Light and dark are builtin; `cacheRemoteThemes()` is the hook for backend packs.

## Modules

- `src/features/expenses` — capture, list, totals, accept/reject imported rows. Owns the expense contract.
- `src/features/imports` — CSV parse (no LLM), optional LLM extract if CSV is empty, month review LLM. Writes **proposals** through `proposeImported`.
- `src/shared/domain/expense.ts` — the shared model. Do not invent a second expense shape.

Expense UI sections: **You entered** vs **From bank statements** (pending review, then committed with `origin: statement`).

## CSV

Headers understood: `Date` / `Txn Date`, `Debit` / `Amount`, `Credit`, `Narration` / `Description`. Credits are skipped. See `public/sample-hdfc-style.csv`.

## Architecture blueprint

Decisions and a recreate-from-scratch pack live in [`docs/`](./docs/README.md). Start with [`docs/DECISIONS.md`](./docs/DECISIONS.md).

## LLM

Optional. Paste an OpenAI key in Settings (browser only). Month review sends **aggregates**, not the raw file. Extract is a fallback when CSV parsing finds no spends.
