alter table public.expense_categories
  add column if not exists icon text not null default 'tag';
