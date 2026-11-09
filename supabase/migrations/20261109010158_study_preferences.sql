begin;

create table public.study_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  cycle_id text references public.exam_cycles(id),
  target_date date check (target_date between date '0001-01-01' and date '9999-12-31'),
  daily_minutes integer not null check (daily_minutes between 5 and 240),
  familiarity text not null check (familiarity in ('new', 'some', 'preparing')),
  diagnostic_choice text not null check (diagnostic_choice in ('later', 'take', 'skip')),
  revision integer not null check (revision > 0)
);
create index study_preferences_cycle_idx on public.study_preferences(cycle_id);
alter table public.study_preferences enable row level security;
revoke all on public.study_preferences from public, anon, authenticated, service_role;
grant select on public.study_preferences to authenticated;
create policy own_live_study_preferences on public.study_preferences for select to authenticated
  using (user_id = (select lawprep_private.current_user_id()));

create function public.lawprep_study_preferences() returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare caller uuid := lawprep_private.current_user_id();
        preferences public.study_preferences;
begin
  if caller is null then
    raise exception using errcode = '28000', message = 'A verified live session is required.';
  end if;
  select * into preferences from public.study_preferences where user_id = caller;
  return jsonb_build_object(
    'userId', caller, 'cycleId', preferences.cycle_id, 'targetDate', to_char(preferences.target_date, 'YYYY-MM-DD'),
    'dailyMinutes', coalesce(preferences.daily_minutes, 30), 'familiarity', coalesce(preferences.familiarity, 'new'),
    'diagnosticChoice', coalesce(preferences.diagnostic_choice, 'later'), 'revision', coalesce(preferences.revision, 0)
  );
end;
$$;
revoke all on function public.lawprep_study_preferences() from public, anon, authenticated, service_role;
grant execute on function public.lawprep_study_preferences() to authenticated;

create function lawprep_private.save_study_preferences(
  p_cycle_id text, p_target_date text, p_daily_minutes integer, p_familiarity text,
  p_diagnostic_choice text, p_expected_revision integer
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare caller uuid := lawprep_private.current_user_id();
        previous public.study_preferences;
        personal_date date;
begin
  if caller is null then
    raise exception using errcode = '28000', message = 'A verified live session is required.';
  end if;
  if p_daily_minutes is null or p_daily_minutes not between 5 and 240
    or p_familiarity is null or p_familiarity not in ('new', 'some', 'preparing')
    or p_diagnostic_choice is null or p_diagnostic_choice not in ('later', 'take', 'skip')
    or p_expected_revision is null or p_expected_revision not between 0 and 2147483646
    or (p_cycle_id is not null and p_cycle_id !~ '^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$') then
    raise exception using errcode = '22023', message = 'Invalid study preferences.';
  end if;
  if p_target_date is not null then
    if p_target_date !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
      raise exception using errcode = '22023', message = 'Invalid personal target date.';
    end if;
    begin
      personal_date := p_target_date::date;
    exception when invalid_datetime_format or datetime_field_overflow then
      raise exception using errcode = '22023', message = 'Invalid personal target date.';
    end;
    if personal_date not between date '0001-01-01' and date '9999-12-31'
      or to_char(personal_date, 'YYYY-MM-DD') <> p_target_date then
      raise exception using errcode = '22023', message = 'Invalid personal target date.';
    end if;
  end if;

  select * into previous from public.study_preferences where user_id = caller for update;
  if coalesce(previous.revision, 0) <> p_expected_revision then
    raise exception using errcode = '40001', message = 'Study preferences changed.';
  end if;
  if p_cycle_id is not null and p_cycle_id is distinct from previous.cycle_id then
    perform 1 from public.exam_cycles
      where id = p_cycle_id and exam_id = 'clat-ug' and status = 'published' and source_verified
      for share;
    if not found then
      raise exception using errcode = '22023', message = 'Choose a published CLAT cycle.';
    end if;
  end if;
  if p_expected_revision = 0 then
    insert into public.study_preferences(user_id, cycle_id, target_date, daily_minutes, familiarity, diagnostic_choice, revision)
      values (caller, p_cycle_id, personal_date, p_daily_minutes, p_familiarity, p_diagnostic_choice, 1)
      on conflict (user_id) do nothing;
    if not found then
      raise exception using errcode = '40001', message = 'Study preferences changed.';
    end if;
  else
    update public.study_preferences set cycle_id = p_cycle_id, target_date = personal_date,
      daily_minutes = p_daily_minutes, familiarity = p_familiarity, diagnostic_choice = p_diagnostic_choice,
      revision = previous.revision + 1 where user_id = caller;
  end if;
  if p_cycle_id is not null and p_cycle_id is distinct from previous.cycle_id then
    insert into public.target_history(user_id, exam_id, cycle_id) values (caller, 'clat-ug', p_cycle_id);
  end if;
  return public.lawprep_study_preferences();
end;
$$;
revoke all on function lawprep_private.save_study_preferences(text, text, integer, text, text, integer) from public, anon, authenticated, service_role;
grant execute on function lawprep_private.save_study_preferences(text, text, integer, text, text, integer) to authenticated;

create function public.lawprep_save_study_preferences(
  p_cycle_id text, p_target_date text, p_daily_minutes integer, p_familiarity text,
  p_diagnostic_choice text, p_expected_revision integer
) returns jsonb language sql security invoker set search_path = '' as $$
  select lawprep_private.save_study_preferences(p_cycle_id, p_target_date, p_daily_minutes, p_familiarity, p_diagnostic_choice, p_expected_revision);
$$;
revoke all on function public.lawprep_save_study_preferences(text, text, integer, text, text, integer) from public, anon, authenticated, service_role;
grant execute on function public.lawprep_save_study_preferences(text, text, integer, text, text, integer) to authenticated;

commit;
