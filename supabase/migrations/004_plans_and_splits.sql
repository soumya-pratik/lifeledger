-- Plans, profiles, entitlements, and Splits (group bills).
-- Expense-tracker tables are unchanged (D04). Splits uses group membership.

create table public.plans (
  id text primary key,
  name text not null
);

insert into public.plans (id, name) values
  ('free', 'Free'),
  ('plus', 'Plus');

create table public.plan_modules (
  plan_id text not null references public.plans (id) on delete cascade,
  module_id text not null,
  primary key (plan_id, module_id)
);

insert into public.plan_modules (plan_id, module_id) values
  ('free', 'home'),
  ('free', 'expenses'),
  ('plus', 'home'),
  ('plus', 'expenses'),
  ('plus', 'splits');

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plan_id text not null default 'free' references public.plans (id),
  email text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, plan_id, email, display_name)
  values (
    new.id,
    'free',
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute procedure public.handle_new_user_profile();

-- Existing auth users
insert into public.profiles (user_id, plan_id, email)
select id, 'free', email from auth.users
on conflict (user_id) do nothing;

-- --- Splits ---

create table public.split_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null check (kind in ('home', 'trip', 'couple', 'other')),
  currency text not null default 'INR',
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.split_group_members (
  group_id uuid not null references public.split_groups (id) on delete cascade,
  user_id uuid not null references auth.users (id),
  role text not null check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create index split_group_members_user on public.split_group_members (user_id);

create table public.split_expenses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.split_groups (id) on delete cascade,
  amount_minor int not null check (amount_minor > 0),
  currency text not null default 'INR',
  description text not null,
  spent_on date not null,
  payer_id uuid not null references auth.users (id),
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index split_expenses_group on public.split_expenses (group_id, spent_on);

create table public.split_shares (
  expense_id uuid not null references public.split_expenses (id) on delete cascade,
  user_id uuid not null references auth.users (id),
  share_minor int not null check (share_minor >= 0),
  primary key (expense_id, user_id)
);

create table public.split_settlements (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.split_groups (id) on delete cascade,
  from_user uuid not null references auth.users (id),
  to_user uuid not null references auth.users (id),
  amount_minor int not null check (amount_minor > 0),
  spent_on date not null,
  note text,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  check (from_user <> to_user)
);

create index split_settlements_group on public.split_settlements (group_id);

alter table public.plans enable row level security;
alter table public.plan_modules enable row level security;
alter table public.profiles enable row level security;
alter table public.split_groups enable row level security;
alter table public.split_group_members enable row level security;
alter table public.split_expenses enable row level security;
alter table public.split_shares enable row level security;
alter table public.split_settlements enable row level security;

create policy plans_read on public.plans for select to authenticated using (true);
create policy plan_modules_read on public.plan_modules for select to authenticated using (true);

create policy profiles_select_self on public.profiles
  for select to authenticated using (user_id = auth.uid());

create policy profiles_select_groupmates on public.profiles
  for select to authenticated using (
    exists (
      select 1
      from public.split_group_members me
      join public.split_group_members them on them.group_id = me.group_id
      where me.user_id = auth.uid() and them.user_id = profiles.user_id
    )
  );

create policy profiles_insert_self on public.profiles
  for insert to authenticated with check (user_id = auth.uid() and plan_id = 'free');

create policy profiles_update_self on public.profiles
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

revoke update on public.profiles from authenticated;
grant select, insert on public.profiles to authenticated;
grant update (email, display_name, updated_at) on public.profiles to authenticated;

create or replace function public.is_split_group_member(p_group uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.split_group_members m
    where m.group_id = p_group and m.user_id = auth.uid()
  );
$$;

create policy split_groups_select on public.split_groups
  for select to authenticated using (public.is_split_group_member(id));

create policy split_groups_insert on public.split_groups
  for insert to authenticated with check (created_by = auth.uid());

create policy split_groups_update on public.split_groups
  for update to authenticated using (
    exists (
      select 1 from public.split_group_members m
      where m.group_id = id and m.user_id = auth.uid() and m.role = 'owner'
    )
  );

create policy split_groups_delete on public.split_groups
  for delete to authenticated using (
    exists (
      select 1 from public.split_group_members m
      where m.group_id = id and m.user_id = auth.uid() and m.role = 'owner'
    )
  );

create policy split_members_select on public.split_group_members
  for select to authenticated using (public.is_split_group_member(group_id));

create policy split_members_insert_self_owner on public.split_group_members
  for insert to authenticated with check (
    user_id = auth.uid() and role = 'owner'
    and exists (select 1 from public.split_groups g where g.id = group_id and g.created_by = auth.uid())
  );

create policy split_expenses_select on public.split_expenses
  for select to authenticated using (public.is_split_group_member(group_id));

create policy split_expenses_write on public.split_expenses
  for insert to authenticated with check (public.is_split_group_member(group_id) and created_by = auth.uid());

create policy split_shares_select on public.split_shares
  for select to authenticated using (
    exists (
      select 1 from public.split_expenses e
      where e.id = expense_id and public.is_split_group_member(e.group_id)
    )
  );

create policy split_shares_insert on public.split_shares
  for insert to authenticated with check (
    exists (
      select 1 from public.split_expenses e
      where e.id = expense_id and public.is_split_group_member(e.group_id) and e.created_by = auth.uid()
    )
  );

create policy split_settlements_select on public.split_settlements
  for select to authenticated using (public.is_split_group_member(group_id));

create policy split_settlements_insert on public.split_settlements
  for insert to authenticated with check (
    public.is_split_group_member(group_id) and created_by = auth.uid()
  );

create or replace function public.invite_split_group_member(p_group uuid, p_email text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid;
  normalized text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if not exists (
    select 1 from public.split_group_members m
    where m.group_id = p_group and m.user_id = auth.uid()
  ) then
    raise exception 'not a member';
  end if;
  normalized := lower(trim(p_email));
  if normalized = '' then
    return json_build_object('ok', false, 'error', 'invalid_email');
  end if;
  select u.id into target
  from auth.users u
  where lower(u.email) = normalized
  limit 1;
  if target is null then
    return json_build_object('ok', false, 'error', 'not_signed_up');
  end if;
  insert into public.split_group_members (group_id, user_id, role)
  values (p_group, target, 'member')
  on conflict (group_id, user_id) do nothing;
  return json_build_object('ok', true, 'user_id', target);
end;
$$;

revoke all on function public.invite_split_group_member(uuid, text) from public;
grant execute on function public.invite_split_group_member(uuid, text) to authenticated;
grant execute on function public.is_split_group_member(uuid) to authenticated;

grant select on public.plans, public.plan_modules to authenticated;
grant select, insert, update, delete on public.split_groups, public.split_group_members, public.split_expenses, public.split_shares, public.split_settlements to authenticated;
