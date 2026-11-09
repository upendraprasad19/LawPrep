begin;

-- These conflicts require a changed client request. PT409 avoids automatic
-- transaction retries in PostgREST and returns the intended HTTP status.
create or replace function lawprep_private.save_study_preferences(
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
    raise exception using errcode = 'PT409', message = 'Study preferences changed.';
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
      raise exception using errcode = 'PT409', message = 'Study preferences changed.';
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

create or replace function lawprep_private.record_sample_learning(
  p_unit_id text, p_mutation_id uuid, p_kind text, p_question_id text, p_option_id text
) returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare caller uuid := lawprep_private.current_user_id();
        prior lawprep_private.sample_events;
        request_body jsonb;
        result jsonb;
        question jsonb;
        repeated boolean;
begin
  if caller is null then
    raise exception using errcode = '28000', message = 'A verified live session is required.';
  end if;
  if current_setting('transaction_isolation') <> 'read committed' then
    raise exception using errcode = '55000', message = 'Sample activity requires READ COMMITTED.';
  end if;
  if p_unit_id is distinct from 'clat-reading-v1' or p_mutation_id is null
    or p_kind is null or p_kind not in ('read', 'answer')
    or (p_kind = 'read' and (p_question_id is not null or p_option_id is not null))
    or (p_kind = 'answer' and (p_question_id is null or p_option_id is null)) then
    raise exception using errcode = '22023', message = 'Invalid sample activity.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('lawprep:sample:' || caller::text, 0));
  if lawprep_private.current_user_id() is distinct from caller then
    raise exception using errcode = '28000', message = 'A verified live session is required.';
  end if;
  request_body := jsonb_build_object('kind', p_kind, 'questionId', p_question_id, 'optionId', p_option_id);
  select * into prior from lawprep_private.sample_events e where e.user_id = caller and e.mutation_id = p_mutation_id;
  if found then
    if prior.unit_id is distinct from p_unit_id or prior.request is distinct from request_body then
      raise exception using errcode = 'PT409', message = 'This activity ID was already used for a different action.';
    end if;
    return prior.receipt;
  end if;

  result := jsonb_build_object('userId', caller, 'unitId', p_unit_id, 'mutationId', p_mutation_id, 'kind', p_kind);
  if p_kind = 'answer' then
    select q into question from lawprep_private.sample_units u
      cross join lateral jsonb_array_elements(u.questions) q
      where u.id = p_unit_id and q->>'id' = p_question_id;
    if question is null or not exists (
      select 1 from jsonb_array_elements(question->'options') option where option->>'id' = p_option_id
    ) then
      raise exception using errcode = '22023', message = 'Choose an option for a question in this sample.';
    end if;
    select exists (
      select 1 from lawprep_private.sample_events e where e.user_id = caller and e.unit_id = p_unit_id
        and e.request->>'kind' = 'answer' and e.request->>'questionId' = p_question_id
    ) into repeated;
    result := result || jsonb_build_object('feedback', jsonb_build_object(
      'questionId', p_question_id, 'selectedOptionId', p_option_id,
      'correct', question->>'answer' = p_option_id, 'explanation', question->>'explanation', 'repeated', repeated
    ));
  end if;
  insert into lawprep_private.sample_events(user_id, unit_id, mutation_id, request, receipt)
    values (caller, p_unit_id, p_mutation_id, request_body, result);
  return result;
end;
$$;

commit;
