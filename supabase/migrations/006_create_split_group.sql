-- Create group + owner membership in one SECURITY DEFINER txn.
-- Client insert+select fails RLS: SELECT requires membership that does not exist yet.

create or replace function public.create_split_group(p_name text, p_kind text)
returns public.split_groups
language plpgsql
security definer
set search_path = public
as $$
declare
  g public.split_groups;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_kind not in ('home', 'trip', 'couple', 'other') then
    raise exception 'invalid kind';
  end if;
  if length(trim(p_name)) = 0 then
    raise exception 'name required';
  end if;

  insert into public.split_groups (name, kind, created_by, currency)
  values (trim(p_name), p_kind, auth.uid(), 'INR')
  returning * into g;

  insert into public.split_group_members (group_id, user_id, role)
  values (g.id, auth.uid(), 'owner');

  return g;
end;
$$;

revoke all on function public.create_split_group(text, text) from public;
grant execute on function public.create_split_group(text, text) to authenticated;
