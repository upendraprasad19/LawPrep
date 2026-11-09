begin;

-- Original starter material. Change the version ID when teaching text or keys change.
create table lawprep_private.sample_units (
  id text primary key,
  lesson jsonb not null check (jsonb_typeof(lesson) = 'object'),
  questions jsonb not null check (jsonb_typeof(questions) = 'array')
);
create table lawprep_private.sample_events (
  event_order bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  unit_id text not null references lawprep_private.sample_units(id),
  mutation_id uuid not null,
  request jsonb not null check (jsonb_typeof(request) = 'object'),
  receipt jsonb not null check (jsonb_typeof(receipt) = 'object'),
  unique (user_id, mutation_id)
);
create index sample_events_user_unit_idx on lawprep_private.sample_events(user_id, unit_id, event_order desc);
create index sample_events_unit_idx on lawprep_private.sample_events(unit_id);

alter table lawprep_private.sample_units enable row level security;
alter table lawprep_private.sample_events enable row level security;
revoke all on lawprep_private.sample_units, lawprep_private.sample_events from public, anon, authenticated, service_role;

create trigger reject_version_change before update or delete on lawprep_private.sample_units
  for each row execute function lawprep_private.reject_version_change();
create trigger reject_version_change before update on lawprep_private.sample_events
  for each row execute function lawprep_private.reject_version_change();

-- The Auth foreign key may remove personal activity when the account is erased.
create function lawprep_private.reject_sample_event_deletion() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if exists (select 1 from auth.users where id = old.user_id) then
    raise exception using errcode = '55000', message = 'Sample activity is append-only.';
  end if;
  return old;
end;
$$;
revoke all on function lawprep_private.reject_sample_event_deletion() from public, anon, authenticated, service_role;
create trigger reject_sample_event_deletion before delete on lawprep_private.sample_events
  for each row execute function lawprep_private.reject_sample_event_deletion();

insert into lawprep_private.sample_units(id, lesson, questions) values (
  'clat-reading-v1',
  $lesson$
  {
    "title":"Find the main point of a passage",
    "objective":"Separate a writer's main claim from the details used to support it.",
    "explanation":"Ask what the writer wants you to take away from the whole passage. Then ask which details help make that point. A strong summary reflects the author's main claim and its limits. It avoids adding a stronger claim than the passage supports.",
    "example":{
      "passage":"A housing society planted trees near a walkway. Residents said the shade made the walk more comfortable at noon. The committee decided to try the same approach on a second walkway before extending the project further.",
      "reasoning":"The main point is that an encouraging result led to a second trial. The shade reports support that decision. Saying the society has committed to planting trees on every walkway goes beyond the passage."
    }
  }$lesson$::jsonb,
  $questions$[
    {
      "id":"main-point",
      "prompt":"A college opened a quiet room for study between classes on a trial basis. The room filled most afternoons, so the college decided to keep it open for another term while it monitored demand. Which option best summarises the passage?",
      "options":[
        {"id":"pilot","text":"Demand for the quiet room led the college to extend its trial."},
        {"id":"rule","text":"The college required every student to use the quiet room."},
        {"id":"permanent","text":"The college made the quiet room a permanent service."}
      ],
      "answer":"pilot",
      "explanation":"The room's frequent use explains the extension. Keeping it open for another term while monitoring demand is a trial extension. The passage does not establish a permanent service or compulsory use."
    },
    {
      "id":"support",
      "prompt":"A bus service added a morning trip on a trial basis. It recorded more passengers before 9 a.m. on the route. A report says the added trip was followed by higher morning ridership. Which detail directly supports the report?",
      "options":[
        {"id":"schedule","text":"The service initially described the trip as a trial."},
        {"id":"count","text":"The service recorded more passengers before 9 a.m. on the route."},
        {"id":"other","text":"The passage discusses a bus route."}
      ],
      "answer":"count",
      "explanation":"The passenger count supports the claim about higher morning ridership. The trial label and the fact that the passage concerns a bus route do not establish an increase."
    }
  ]$questions$::jsonb
);

create function lawprep_private.sample_learning() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare caller uuid := lawprep_private.current_user_id();
        unit lawprep_private.sample_units;
        public_questions jsonb;
        prior_feedback jsonb;
        reading_completed boolean;
begin
  if caller is null then
    raise exception using errcode = '28000', message = 'A verified live session is required.';
  end if;
  select * into strict unit from lawprep_private.sample_units where id = 'clat-reading-v1';
  select jsonb_agg(jsonb_build_object('id', q->>'id', 'prompt', q->>'prompt', 'options', (
    select jsonb_agg(jsonb_build_object('id', option->>'id', 'text', option->>'text') order by option_order)
    from jsonb_array_elements(q->'options') with ordinality as choices(option, option_order)
  )) order by ord)
    into public_questions from jsonb_array_elements(unit.questions) with ordinality as questions(q, ord);
  select coalesce(jsonb_agg(latest.feedback order by latest.question_id), '[]'::jsonb) into prior_feedback
  from (
    select distinct on (e.request->>'questionId')
      e.request->>'questionId' as question_id, e.receipt->'feedback' as feedback
    from lawprep_private.sample_events e
    where e.user_id = caller and e.unit_id = unit.id and e.request->>'kind' = 'answer'
    order by e.request->>'questionId', e.event_order desc
  ) latest;
  select exists (
    select 1 from lawprep_private.sample_events e
    where e.user_id = caller and e.unit_id = unit.id and e.request->>'kind' = 'read'
  ) into reading_completed;
  return jsonb_build_object('userId', caller,
    'lesson', jsonb_build_object('id', unit.id, 'title', unit.lesson->>'title',
      'objective', unit.lesson->>'objective', 'explanation', unit.lesson->>'explanation',
      'example', jsonb_build_object('passage', unit.lesson#>>'{example,passage}', 'reasoning', unit.lesson#>>'{example,reasoning}'),
      'questions', public_questions),
    'readingCompleted', reading_completed, 'feedback', prior_feedback);
end;
$$;
revoke all on function lawprep_private.sample_learning() from public, anon, authenticated, service_role;
grant execute on function lawprep_private.sample_learning() to authenticated;

create function lawprep_private.record_sample_learning(
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
      raise exception using errcode = '40001', message = 'This activity ID was already used for a different action.';
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
revoke all on function lawprep_private.record_sample_learning(text, uuid, text, text, text) from public, anon, authenticated, service_role;
grant execute on function lawprep_private.record_sample_learning(text, uuid, text, text, text) to authenticated;

create function public.lawprep_sample_learning() returns jsonb
language sql stable security invoker set search_path = '' as $$
  select lawprep_private.sample_learning();
$$;
revoke all on function public.lawprep_sample_learning() from public, anon, authenticated, service_role;
grant execute on function public.lawprep_sample_learning() to authenticated;

create function public.lawprep_record_sample_learning(
  p_unit_id text, p_mutation_id uuid, p_kind text, p_question_id text, p_option_id text
) returns jsonb language sql volatile security invoker set search_path = '' as $$
  select lawprep_private.record_sample_learning(p_unit_id, p_mutation_id, p_kind, p_question_id, p_option_id);
$$;
revoke all on function public.lawprep_record_sample_learning(text, uuid, text, text, text) from public, anon, authenticated, service_role;
grant execute on function public.lawprep_record_sample_learning(text, uuid, text, text, text) to authenticated;

commit;
