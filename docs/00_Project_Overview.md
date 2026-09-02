# 00 — Project overview

## Purpose

LifeLedger is a **super-app** (installable PWA): one shell, one identity, one sync story. Life areas are **submodules** — the first is **expense tracking** (manual capture, bank-statement import, spending patterns, optional LLM month review). New modules are always submodules of LifeLedger, never a second app. Which modules a user sees is **configurable per user** (intent; not wired yet). Expense rows still live on a **ledger** (household tenancy), not on the user id alone.

## Target users

- Primary: a single person in India (INR), using phone and laptop.
- Secondary: the same person plus a small household (2–10) on a **shared ledger**.
- Also valid: many unrelated people each with their own personal ledger (SaaS isolation) once Auth is connected.

Not a target: banks, accountants at scale, public social feeds, B2B finance teams with SSO.

## Core functionality (implemented)

1. Boot a local workspace: personal ledger, owner membership, default categories.
2. Manually add expenses (amount, date, category, payment method, note).
3. See month totals split **manual / statement / all**.
4. Upload a CSV statement; parse spends; stage as proposals.
5. Confirm or skip proposals on the expenses screen; confirmed rows are expenses with `origin: statement`.
6. Optional LLM extract if CSV produced no spends (user checkbox + API key).
7. Optional LLM month review from aggregated summary JSON.
8. Store LLM key in the browser (BYOK).

## Explicitly not in the current codebase

- Supabase Auth session (magic link)
- Outbox flush / multi-device sync
- Shared ledger creation, invites, role UI
- OFX / PDF parsers
- Receipt photos, budgets, recurring bills, FX
- Journal entries feature (`src/features/journal` is a placeholder)
- Automated tests, CI, production deploy config

## High-level architecture

**Modular monolith PWA.** Feature folders by life domain. Device DB (Dexie) for reads/writes. Planned cloud DB (Supabase Postgres) with RLS keyed by ledger membership. LLM is a side door inside the import feature only.

```text
User → React PWA → Dexie (source of truth)
                 → outbox (queued, not flushed)
                 → OpenAI (optional, BYOK, redacted/aggregates)
                 → Supabase (schema ready, client constructed if env set)
```

## Constraints used for all design

- Solo developer, MVP speed, personal/household scale (not 100k concurrent).
- Offline capture is more important than live collaboration.
- Financial data is sensitive; do not make the app backend a bank-statement processor for strangers via a shared LLM key.

## Naming

- npm / folder: `lifeledger`
- PWA name: LifeLedger
- IndexedDB name: `lifeledger`
