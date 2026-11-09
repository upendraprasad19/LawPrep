begin;

create table public.access_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cycle_id text not null references public.exam_cycles(id),
  kind text not null check (kind in ('prepare', 'ai-guide')),
  starts_at timestamptz(3) not null check (starts_at >= '0001-01-01T00:00:00Z' and starts_at < '10000-01-01T00:00:00Z'),
  ends_at timestamptz(3) not null check (ends_at > starts_at and ends_at < '10000-01-01T00:00:00Z'),
  revoked_at timestamptz(3) check (revoked_at >= '0001-01-01T00:00:00Z' and revoked_at < '10000-01-01T00:00:00Z')
);
create index access_grants_user_idx on public.access_grants(user_id);
create index access_grants_cycle_idx on public.access_grants(cycle_id);

alter table public.access_grants enable row level security;
revoke all on public.access_grants from public, anon, authenticated, service_role;
grant select on public.access_grants to authenticated;
create policy own_live_access_grants on public.access_grants for select to authenticated
  using (user_id = (select lawprep_private.current_user_id()));

create function public.lawprep_access() returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare caller uuid := lawprep_private.current_user_id();
        checked_at timestamptz := statement_timestamp();
        cycles jsonb;
begin
  if caller is null then
    raise exception using errcode = '28000', message = 'A verified live session is required.';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'cycleId', period.cycle_id, 'examId', period.exam_id, 'label', period.label,
    'prepareUntil', to_char(period.prepare_until at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'aiUntil', case when period.ai_until is not null then
      to_char(least(period.ai_until, period.prepare_until) at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') end
  ) order by period.cycle_id), '[]'::jsonb) into cycles
  from (
    select c.id as cycle_id, c.exam_id, c.label,
      max(g.ends_at) filter (where g.kind = 'prepare') as prepare_until,
      max(g.ends_at) filter (where g.kind = 'ai-guide') as ai_until
    from public.access_grants g join public.exam_cycles c on c.id = g.cycle_id
    where g.user_id = caller and c.status = 'published'
      and g.starts_at <= checked_at and g.ends_at > checked_at and g.revoked_at is null
    group by c.id
  ) period
  where period.prepare_until is not null;
  return jsonb_build_object('userId', caller,
    'checkedAt', to_char(checked_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'), 'cycles', cycles);
end;
$$;
revoke all on function public.lawprep_access() from public, anon, authenticated, service_role;
grant execute on function public.lawprep_access() to authenticated;

commit;
