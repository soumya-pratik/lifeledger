-- Admin / user roles and per-user module flags.
-- Run after 004_plans_and_splits.sql.

alter table public.profiles
  add column if not exists role text not null default 'user';

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check check (role in ('admin', 'user'));

create table if not exists public.profile_modules (
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  module_id text not null,
  primary key (user_id, module_id)
);

create or replace function public.seed_free_profile_modules(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profile_modules (user_id, module_id)
  select p_user, pm.module_id
  from public.plan_modules pm
  where pm.plan_id = 'free'
  on conflict do nothing;
end;
$$;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, plan_id, email, display_name, role)
  values (
    new.id,
    'free',
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(coalesce(new.email, ''), '@', 1)),
    'user'
  )
  on conflict (user_id) do nothing;
  perform public.seed_free_profile_modules(new.id);
  return new;
end;
$$;

insert into public.profile_modules (user_id, module_id)
select p.user_id, pm.module_id
from public.profiles p
cross join public.plan_modules pm
where pm.plan_id = 'free'
on conflict do nothing;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated;

drop policy if exists profiles_select_admin on public.profiles;
create policy profiles_select_admin on public.profiles
  for select to authenticated using (public.is_admin());

alter table public.profile_modules enable row level security;

drop policy if exists profile_modules_select on public.profile_modules;
create policy profile_modules_select on public.profile_modules
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

grant select on public.profile_modules to authenticated;

create or replace function public.admin_set_user_role(p_user uuid, p_role text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_count int;
begin
  if not public.is_admin() then
    raise exception 'not admin';
  end if;
  if p_role not in ('admin', 'user') then
    raise exception 'invalid role';
  end if;
  if p_role = 'user' then
    select count(*) into admin_count from public.profiles where role = 'admin';
    if admin_count <= 1 and exists (
      select 1 from public.profiles where user_id = p_user and role = 'admin'
    ) then
      return json_build_object('ok', false, 'error', 'last_admin');
    end if;
  end if;
  update public.profiles set role = p_role, updated_at = now() where user_id = p_user;
  if p_role = 'admin' then
    insert into public.profile_modules (user_id, module_id)
    values (p_user, 'home'), (p_user, 'expenses'), (p_user, 'splits')
    on conflict do nothing;
  end if;
  return json_build_object('ok', true);
end;
$$;

create or replace function public.admin_set_user_modules(p_user uuid, p_modules text[])
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  m text;
begin
  if not public.is_admin() then
    raise exception 'not admin';
  end if;
  delete from public.profile_modules where user_id = p_user;
  insert into public.profile_modules (user_id, module_id) values (p_user, 'home');
  foreach m in array p_modules loop
    if m in ('expenses', 'splits') then
      insert into public.profile_modules (user_id, module_id)
      values (p_user, m)
      on conflict do nothing;
    end if;
  end loop;
  return json_build_object('ok', true);
end;
$$;

revoke all on function public.admin_set_user_role(uuid, text) from public;
revoke all on function public.admin_set_user_modules(uuid, text[]) from public;
grant execute on function public.admin_set_user_role(uuid, text) to authenticated;
grant execute on function public.admin_set_user_modules(uuid, text[]) to authenticated;

revoke all on function public.seed_free_profile_modules(uuid) from public;
revoke all on function public.seed_free_profile_modules(uuid) from authenticated;

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles
  for insert to authenticated
  with check (user_id = auth.uid() and plan_id = 'free' and role = 'user');

create or replace function public.profiles_seed_modules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.seed_free_profile_modules(new.user_id);
  return new;
end;
$$;

drop trigger if exists profiles_seed_modules on public.profiles;
create trigger profiles_seed_modules
  after insert on public.profiles
  for each row execute procedure public.profiles_seed_modules();

revoke insert, update, delete on public.profile_modules from public;
revoke insert, update, delete on public.profile_modules from authenticated;
grant select on public.profile_modules to authenticated;

-- Super admin seed (Auth user must exist).
insert into public.profiles (user_id, plan_id, email, display_name, role)
select u.id, 'plus', u.email, coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)), 'admin'
from auth.users u
where lower(u.email) = 'soumyapratik015@gmail.com'
on conflict (user_id) do update
  set role = 'admin',
      email = excluded.email,
      plan_id = 'plus';

update public.profiles p
set role = 'admin'
from auth.users u
where p.user_id = u.id and lower(u.email) = 'soumyapratik015@gmail.com';

insert into public.profile_modules (user_id, module_id)
select p.user_id, m
from public.profiles p
cross join (values ('home'), ('expenses'), ('splits')) as x(m)
where p.role = 'admin'
on conflict do nothing;
