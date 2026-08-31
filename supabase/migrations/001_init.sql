-- LifeLedger v1 — run in the Supabase SQL editor (or supabase db push).
-- Tenancy is ledger membership, not user_id on expense rows.

create table public.ledgers (
  id uuid primary key,
  name text not null,
  kind text not null check (kind in ('personal', 'shared')),
  currency text not null default 'INR',
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index ledgers_one_personal_per_user
  on public.ledgers (created_by)
  where kind = 'personal';

create table public.ledger_members (
  ledger_id uuid not null references public.ledgers (id) on delete cascade,
  user_id uuid not null references auth.users (id),
  role text not null check (role in ('owner', 'editor', 'viewer')),
  status text not null check (status in ('active', 'invited')),
  created_at timestamptz not null default now(),
  primary key (ledger_id, user_id)
);

create index ledger_members_user on public.ledger_members (user_id);

create table public.ledger_invites (
  id uuid primary key default gen_random_uuid(),
  ledger_id uuid not null references public.ledgers (id) on delete cascade,
  email text not null,
  role text not null check (role in ('editor', 'viewer')),
  token_hash text not null,
  expires_at timestamptz not null,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

create table public.expense_categories (
  id uuid primary key,
  ledger_id uuid not null references public.ledgers (id) on delete cascade,
  name text not null,
  kind text not null default 'unspecified' check (kind in ('need', 'want', 'unspecified')),
  archived_at timestamptz
);

create table public.expenses (
  id uuid primary key,
  ledger_id uuid not null references public.ledgers (id) on delete cascade,
  amount_minor int not null check (amount_minor > 0),
  currency text not null default 'INR',
  spent_on date not null,
  category_id uuid references public.expense_categories (id),
  note text,
  payment_method text not null default 'other'
    check (payment_method in ('upi', 'card', 'cash', 'other')),
  origin text not null default 'manual' check (origin in ('manual', 'statement')),
  import_batch_id uuid,
  fingerprint text,
  raw_description text,
  bank_txn_id text,
  created_by uuid not null references auth.users (id),
  updated_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index expenses_fingerprint
  on public.expenses (ledger_id, fingerprint)
  where fingerprint is not null and deleted_at is null;

create index expenses_ledger_spent on public.expenses (ledger_id, spent_on);

create table public.import_batches (
  id uuid primary key,
  ledger_id uuid not null references public.ledgers (id) on delete cascade,
  filename text not null,
  extractor text not null,
  status text not null check (status in ('parsed', 'reviewed', 'committed')),
  review_json jsonb,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

create table public.expense_proposals (
  id uuid primary key,
  ledger_id uuid not null references public.ledgers (id) on delete cascade,
  import_batch_id uuid not null references public.import_batches (id) on delete cascade,
  amount_minor int not null check (amount_minor > 0),
  currency text not null default 'INR',
  spent_on date not null,
  category_id uuid references public.expense_categories (id),
  note text,
  payment_method text not null default 'other',
  fingerprint text not null,
  raw_description text,
  bank_txn_id text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_by uuid not null references auth.users (id)
);

create unique index proposals_fingerprint
  on public.expense_proposals (ledger_id, fingerprint);

alter table public.ledgers enable row level security;
alter table public.ledger_members enable row level security;
alter table public.ledger_invites enable row level security;
alter table public.expense_categories enable row level security;
alter table public.expenses enable row level security;
alter table public.import_batches enable row level security;
alter table public.expense_proposals enable row level security;

create or replace function public.is_ledger_member(p_ledger uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.ledger_members m
    where m.ledger_id = p_ledger
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

create or replace function public.is_ledger_writer(p_ledger uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.ledger_members m
    where m.ledger_id = p_ledger
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner', 'editor')
  );
$$;

create policy ledgers_select on public.ledgers
  for select using (public.is_ledger_member(id));

create policy ledgers_insert on public.ledgers
  for insert with check (created_by = auth.uid());

create policy members_select on public.ledger_members
  for select using (public.is_ledger_member(ledger_id) or user_id = auth.uid());

create policy members_insert_self on public.ledger_members
  for insert with check (user_id = auth.uid() and role = 'owner');

create policy categories_all on public.expense_categories
  for all using (public.is_ledger_member(ledger_id))
  with check (public.is_ledger_writer(ledger_id));

create policy expenses_select on public.expenses
  for select using (public.is_ledger_member(ledger_id));

create policy expenses_write on public.expenses
  for insert with check (public.is_ledger_writer(ledger_id));

create policy expenses_update on public.expenses
  for update using (public.is_ledger_writer(ledger_id));

create policy imports_select on public.import_batches
  for select using (public.is_ledger_member(ledger_id));

create policy imports_write on public.import_batches
  for all using (public.is_ledger_writer(ledger_id))
  with check (public.is_ledger_writer(ledger_id));

create policy proposals_select on public.expense_proposals
  for select using (public.is_ledger_member(ledger_id));

create policy proposals_write on public.expense_proposals
  for all using (public.is_ledger_writer(ledger_id))
  with check (public.is_ledger_writer(ledger_id));

-- Accept invite: add later as SECURITY DEFINER RPC. Do not let the client insert arbitrary members.
