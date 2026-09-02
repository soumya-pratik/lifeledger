-- Monthly income sources per ledger (YYYY-MM). Multiple rows per month are allowed.

create table public.monthly_incomes (
  id uuid primary key,
  ledger_id uuid not null references public.ledgers (id) on delete cascade,
  month text not null check (month ~ '^[0-9]{4}-[0-9]{2}$'),
  amount_minor int not null check (amount_minor > 0),
  currency text not null default 'INR',
  note text not null default '',
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index monthly_incomes_ledger_month on public.monthly_incomes (ledger_id, month);

alter table public.monthly_incomes enable row level security;

create policy incomes_select on public.monthly_incomes
  for select using (public.is_ledger_member(ledger_id));

create policy incomes_write on public.monthly_incomes
  for insert with check (public.is_ledger_writer(ledger_id));

create policy incomes_update on public.monthly_incomes
  for update using (public.is_ledger_writer(ledger_id));

create policy incomes_delete on public.monthly_incomes
  for delete using (public.is_ledger_writer(ledger_id));
