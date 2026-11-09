-- Prepared locally. Apply only after independent review and owner instruction.
-- Additive continuation; never changes the applied catalog migration's bytes.
begin;

-- ECMAScript String.trim whitespace, shared with the Zod text contracts.
create function lawprep_private.trim_text(value text) returns text
language sql immutable security invoker set search_path = '' as $$
  select btrim(value,U&'\0020\0009\000A\000D\000C\000B\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF');
$$;
revoke all on function lawprep_private.trim_text(text) from public,anon,authenticated,service_role;
create function lawprep_private.utf16_length(value text) returns integer
language sql immutable security invoker set search_path = '' as $$
  select length(value)+regexp_count(value,U&'[\+010000-\+10FFFF]');
$$;
revoke all on function lawprep_private.utf16_length(text) from public,anon,authenticated,service_role;

create function lawprep_private.current_user_id() returns uuid
language plpgsql stable security definer set search_path = '' as $$
declare caller uuid; session_claim text;
begin
  caller := auth.uid(); session_claim := auth.jwt()->>'session_id';
  if caller is null or session_claim is null or session_claim !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' then return null; end if;
  if exists (select 1 from auth.sessions s join auth.users u on u.id=s.user_id
    where s.id=session_claim::uuid and s.user_id=caller
      and (s.not_after is null or s.not_after>statement_timestamp())
      and u.email is not null and u.email_confirmed_at is not null and not u.is_anonymous) then return caller; end if;
  return null;
end;
$$;
revoke all on function lawprep_private.current_user_id() from public,anon,authenticated,service_role;
grant execute on function lawprep_private.current_user_id() to authenticated;
create or replace function lawprep_private.is_publisher() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from lawprep_private.publisher_roles r where r.user_id=(select lawprep_private.current_user_id()));
$$;

create function lawprep_private.actor() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare caller uuid := lawprep_private.current_user_id();
begin
  if caller is null then raise exception using errcode='28000',message='A verified live session is required.'; end if;
  return jsonb_build_object('userId',caller,'role',case when exists(select 1 from lawprep_private.publisher_roles where user_id=caller) then 'publisher' else 'learner' end);
end;
$$;
revoke all on function lawprep_private.actor() from public,anon,authenticated,service_role;
grant execute on function lawprep_private.actor() to authenticated;
create function public.lawprep_actor() returns jsonb
language sql stable security invoker set search_path = '' as $$ select lawprep_private.actor(); $$;
revoke all on function public.lawprep_actor() from public,anon,authenticated,service_role;
grant execute on function public.lawprep_actor() to authenticated;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check(length(btrim(display_name)) between 1 and 80),
  timezone text not null check(length(timezone) between 1 and 100),
  revision integer not null check(revision>0), updated_at timestamptz not null default now()
);
create table public.target_history (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  exam_id text not null check(exam_id in ('clat-ug','blet-patna-llb','cuet-pg-llb')),
  cycle_id text not null references public.exam_cycles(id), changed_at timestamptz not null default now()
);
create index target_history_owner_idx on public.target_history(user_id,changed_at,id);
alter table public.profiles enable row level security;
alter table public.target_history enable row level security;
revoke all on public.profiles,public.target_history from public,anon,authenticated,service_role;
grant select on public.profiles,public.target_history to authenticated;
create policy own_live_profile on public.profiles for select to authenticated using(user_id=(select lawprep_private.current_user_id()));
create policy own_live_target_history on public.target_history for select to authenticated using(user_id=(select lawprep_private.current_user_id()));

create function lawprep_private.save_profile(p_display_name text,p_timezone text,p_expected_revision integer) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare caller uuid := lawprep_private.current_user_id(); saved public.profiles;
begin
  if caller is null then raise exception using errcode='28000',message='A verified live session is required.'; end if;
  if p_display_name is null or lawprep_private.utf16_length(lawprep_private.trim_text(p_display_name)) not between 1 and 80 or p_timezone is null or length(p_timezone)>100
    or p_timezone='Factory' or not exists(select 1 from pg_catalog.pg_timezone_names where name=p_timezone)
    or p_expected_revision is null or p_expected_revision<0 or p_expected_revision>=2147483647 then
    raise exception using errcode='22023',message='Invalid profile fields.';
  end if;
  if p_expected_revision=0 then
    insert into public.profiles(user_id,display_name,timezone,revision) values(caller,lawprep_private.trim_text(p_display_name),p_timezone,1)
      on conflict(user_id) do nothing returning * into saved;
  else
    update public.profiles set display_name=lawprep_private.trim_text(p_display_name),timezone=p_timezone,revision=revision+1,updated_at=now()
      where user_id=caller and revision=p_expected_revision returning * into saved;
  end if;
  if saved.user_id is null then raise exception using errcode='40001',message='Profile revision changed.'; end if;
  return jsonb_build_object('userId',saved.user_id,'displayName',saved.display_name,'timezone',saved.timezone,'revision',saved.revision);
end;
$$;
revoke all on function lawprep_private.save_profile(text,text,integer) from public,anon,authenticated,service_role;
grant execute on function lawprep_private.save_profile(text,text,integer) to authenticated;
create function public.lawprep_save_profile(p_display_name text,p_timezone text,p_expected_revision integer) returns jsonb
language sql security invoker set search_path = '' as $$ select lawprep_private.save_profile(p_display_name,p_timezone,p_expected_revision); $$;
revoke all on function public.lawprep_save_profile(text,text,integer) from public,anon,authenticated,service_role;
grant execute on function public.lawprep_save_profile(text,text,integer) to authenticated;

alter table lawprep_private.content_versions add column structure jsonb not null default '{}'::jsonb
  check(jsonb_typeof(structure)='object' and octet_length(structure::text)<=110000);
alter table lawprep_private.publication_events drop constraint publication_events_mutation_id_key;
alter table lawprep_private.publication_events add constraint publication_events_actor_mutation_key unique(actor_id,mutation_id);
create table lawprep_private.mutation_receipts (
  user_id uuid not null, mutation_id uuid not null, digest text not null check(digest ~ '^[a-f0-9]{64}$'),
  result jsonb not null, created_at timestamptz not null default now(), primary key(user_id,mutation_id)
);
create index mutation_receipts_budget_idx on lawprep_private.mutation_receipts(user_id,created_at);
alter table lawprep_private.mutation_receipts enable row level security;
revoke all on lawprep_private.mutation_receipts from public,anon,authenticated,service_role;
create trigger reject_version_change before update or delete on lawprep_private.mutation_receipts
  for each row execute function lawprep_private.reject_version_change();

-- These invoker validators are internal only. All API entry points below enforce
-- caller/session/role themselves; a wrapper is never the authorization boundary.
create function lawprep_private.assert_object(value jsonb,required text[],optional text[] default '{}') returns void
language plpgsql immutable security invoker set search_path = '' as $$
begin
  if jsonb_typeof(value) is distinct from 'object' then raise exception using errcode='22023',message='Expected an object.'; end if;
  if not(value ?& required) or exists(select 1 from jsonb_object_keys(value) k where not(k=any(required||optional))) then
    raise exception using errcode='22023',message='Invalid object fields.';
  end if;
end;
$$;
create function lawprep_private.text_field(value jsonb,key text,maximum integer,minimum integer default 1) returns text
language plpgsql immutable security invoker set search_path = '' as $$
declare item text;
begin
  if jsonb_typeof(value->key) is distinct from 'string' then raise exception using errcode='22023',message='Expected text.'; end if;
  item:=lawprep_private.trim_text(value->>key);
  if lawprep_private.utf16_length(item) not between minimum and maximum then raise exception using errcode='22023',message='Invalid text length.'; end if;
  return item;
end;
$$;
create function lawprep_private.identifier(value jsonb,key text) returns text
language plpgsql immutable security invoker set search_path = '' as $$
declare item text := lawprep_private.text_field(value,key,128);
begin
  if item !~ '^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$' then raise exception using errcode='22023',message='Invalid identifier.'; end if;
  return item;
end;
$$;
create function lawprep_private.uuid_field(value jsonb,key text) returns uuid
language plpgsql immutable security invoker set search_path = '' as $$
begin
  return lawprep_private.text_field(value,key,36)::uuid;
exception when invalid_text_representation then raise exception using errcode='22023',message='Invalid UUID.';
end;
$$;
create function lawprep_private.bool_field(value jsonb,key text) returns boolean
language plpgsql immutable security invoker set search_path = '' as $$
begin
  if jsonb_typeof(value->key) is distinct from 'boolean' then raise exception using errcode='22023',message='Expected boolean.'; end if;
  return (value->>key)::boolean;
end;
$$;
create function lawprep_private.require_publisher() returns uuid
language plpgsql stable security definer set search_path = '' as $$
declare caller uuid:=lawprep_private.current_user_id();
begin
  if caller is null then raise exception using errcode='28000',message='A verified live session is required.'; end if;
  if not exists(select 1 from lawprep_private.publisher_roles where user_id=caller) then raise exception using errcode='42501',message='Publisher access required.'; end if;
  return caller;
end;
$$;

-- Validate snapshots both when assembled and again at publication. A version
-- created through a later import/service cannot skip the publication checks.
create function lawprep_private.assert_publishable(p_version_id uuid) returns void
language plpgsql security invoker set search_path = '' as $$
declare v lawprep_private.content_versions; r lawprep_private.content_reviews; k lawprep_private.version_keys; opt jsonb; option_ids text[]:='{}';
begin
  select * into v from lawprep_private.content_versions where id=p_version_id;
  select * into r from lawprep_private.content_reviews where version_id=p_version_id;
  if v.id is null or r.version_id is null or not(r.source_verified and r.rights_verified and r.explanation_verified and r.answer_verified)
    or not exists(select 1 from public.exam_cycles c where c.id=v.cycle_id and c.status='published' and c.source_verified)
    or (select count(*) from lawprep_private.version_topics where version_id=v.id)<>1
    or not exists(select 1 from lawprep_private.version_topics vt join public.topics t on t.cycle_id=vt.cycle_id and t.id=vt.topic_id where vt.version_id=v.id and t.status='published')
    or not exists(select 1 from lawprep_private.version_sources where version_id=v.id)
    or exists(select 1 from lawprep_private.version_sources vs join lawprep_private.source_versions s on s.id=vs.source_id where vs.version_id=v.id and (s.rights<>'permitted' or length(btrim(s.review_note))=0)) then
    raise exception using errcode='23514',message='Content, source, mapping and rights review required.';
  end if;
  if v.kind='question' then
    perform lawprep_private.assert_object(v.structure,array['options']);
    if jsonb_typeof(v.structure->'options') is distinct from 'array' then raise exception using errcode='23514',message='Question options required.'; end if;
    if jsonb_array_length(v.structure->'options') not between 2 and 6 then raise exception using errcode='23514',message='Question options required.'; end if;
    for opt in select * from jsonb_array_elements(v.structure->'options') loop
      perform lawprep_private.assert_object(opt,array['id','text']);
      option_ids:=array_append(option_ids,lawprep_private.text_field(opt,'id',32));
      perform lawprep_private.text_field(opt,'text',4000);
    end loop;
    select * into k from lawprep_private.version_keys where version_id=v.id;
    if k.version_id is null then raise exception using errcode='23514',message='Question key required.'; end if;
    perform lawprep_private.assert_object(k.answer_key,array['correctOptionId']);
    if not(lawprep_private.text_field(k.answer_key,'correctOptionId',32)=any(option_ids)) or cardinality(option_ids)<>(select count(distinct x) from unnest(option_ids) x) then
      raise exception using errcode='23514',message='Invalid question options or key.';
    end if;
  elsif v.structure<>'{}'::jsonb or exists(select 1 from lawprep_private.version_keys where version_id=v.id) then
    raise exception using errcode='23514',message='Only questions have answer keys.';
  end if;
end;
$$;

create function lawprep_private.editor_command(p_command jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  caller uuid:=lawprep_private.require_publisher(); operation text; mutation uuid; command_digest text; receipt lawprep_private.mutation_receipts;
  data jsonb; item jsonb; source lawprep_private.source_versions; v lawprep_private.content_versions; replacement lawprep_private.content_versions;
  record_id uuid; content_uuid uuid; cycle text; topic text; title text; kind text; visibility text; note text;
  source_ids uuid[]:='{}'; option_ids text[]:='{}'; canonical_options jsonb:='[]'; prerequisite_ids text[]:='{}'; checked_at timestamptz; result jsonb;
begin
  if current_setting('transaction_isolation')<>'read committed' then raise exception using errcode='25000',message='Editorial commands require READ COMMITTED.'; end if;
  if p_command is null or octet_length(p_command::text)>262144 then raise exception using errcode='22023',message='Command too large.'; end if;
  operation:=lawprep_private.text_field(p_command,'op',20); mutation:=lawprep_private.uuid_field(p_command,'mutationId');
  -- Per-publisher lock serializes the shared budget and duplicate receipts.
  -- Every content lock is taken after this lock, in the same order.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('lawprep:publisher:'||caller::text,0));
  perform lawprep_private.require_publisher();
  command_digest:=encode(sha256(convert_to(p_command::text,'UTF8')),'hex');
  select * into receipt from lawprep_private.mutation_receipts where user_id=caller and mutation_id=mutation;
  if found then
    if receipt.digest<>command_digest then raise exception using errcode='23505',message='Mutation identity reused with different input.'; end if;
    return receipt.result;
  end if;
  if (select count(*) from lawprep_private.mutation_receipts where user_id=caller and created_at>statement_timestamp()-interval '1 minute')>=30 then
    raise exception using errcode='P0001',message='RATE_LIMITED';
  end if;

  if operation='source' then
    perform lawprep_private.assert_object(p_command,array['op','mutationId','source']); data:=p_command->'source';
    perform lawprep_private.assert_object(data,array['title','publisher','url','checkedAt','rights','reviewNote']);
    note:=lawprep_private.text_field(data,'reviewNote',4000,0); title:=lawprep_private.text_field(data,'url',2048);
    if title !~ '^https://[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*\.[A-Za-z]{2,63}(:[0-9]{1,5})?([/?][^#[:space:]]*)?$'
      or title ~ U&'[\0020\0009\000A\000D\000C\000B\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF]'
      or coalesce(substring(title from '^https://[^/:]+:([0-9]+)'), '443')::integer>65535 then raise exception using errcode='22023',message='Safe HTTPS source required.'; end if;
    begin
      if lawprep_private.text_field(data,'checkedAt',40) !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$' then raise invalid_datetime_format; end if;
      checked_at:=(data->>'checkedAt')::timestamptz;
    exception when invalid_datetime_format or datetime_field_overflow then raise exception using errcode='22023',message='Valid checked date required.'; end;
    if checked_at<timestamptz '0001-01-01 00:00:00+00' or checked_at>=timestamptz '10000-01-01 00:00:00+00' then
      raise exception using errcode='22023',message='Checked date must remain in UTC years 0001 through 9999.';
    end if;
    insert into lawprep_private.source_versions(title,publisher,url,checked_at,rights,review_note)
      values(lawprep_private.text_field(data,'title',300),lawprep_private.text_field(data,'publisher',200),title,checked_at,lawprep_private.text_field(data,'rights',20),note) returning id into record_id;

  elsif operation='cycle' then
    perform lawprep_private.assert_object(p_command,array['op','mutationId','cycle']); data:=p_command->'cycle';
    perform lawprep_private.assert_object(data,array['id','examId','label','sourceId','sourceVerified']);
    select * into source from lawprep_private.source_versions where id=lawprep_private.uuid_field(data,'sourceId');
    if source.id is null or source.rights<>'permitted' or length(btrim(source.review_note))=0 or source.url is null or not lawprep_private.bool_field(data,'sourceVerified') then
      raise exception using errcode='23514',message='Reviewed official source required.';
    end if;
    cycle:=lawprep_private.identifier(data,'id');
    insert into public.exam_cycles(id,exam_id,label,status,source_url,source_checked_at,source_verified)
      values(cycle,lawprep_private.text_field(data,'examId',30),lawprep_private.text_field(data,'label',200),'published',source.url,source.checked_at,true);

  elsif operation='topic' then
    perform lawprep_private.assert_object(p_command,array['op','mutationId','topic']); data:=p_command->'topic';
    perform lawprep_private.assert_object(data,array['id','cycleId','title','prerequisiteIds']);
    cycle:=lawprep_private.identifier(data,'cycleId'); topic:=lawprep_private.identifier(data,'id');
    perform 1 from public.exam_cycles where id=cycle and status='published' for update;
    if not found then raise exception using errcode='23514',message='Published cycle required.'; end if;
    if jsonb_typeof(data->'prerequisiteIds') is distinct from 'array' then raise exception using errcode='22023',message='Prerequisite list required.'; end if;
    if jsonb_array_length(data->'prerequisiteIds')>20 then raise exception using errcode='22023',message='Too many prerequisites.'; end if;
    for item in select * from jsonb_array_elements(data->'prerequisiteIds') loop
      prerequisite_ids:=array_append(prerequisite_ids,lawprep_private.identifier(jsonb_build_object('id',item),'id'));
    end loop;
    if cardinality(prerequisite_ids)<>(select count(distinct x) from unnest(prerequisite_ids) x) then raise exception using errcode='22023',message='Duplicate prerequisite.'; end if;
    insert into public.topics(cycle_id,id,title,status) values(cycle,topic,lawprep_private.text_field(data,'title',200),'published');
    insert into public.topic_prerequisites(cycle_id,topic_id,prerequisite_id) select cycle,topic,x from unnest(prerequisite_ids) x;

  elsif operation='draft' then
    perform lawprep_private.assert_object(p_command,array['op','mutationId','draft']); data:=p_command->'draft';
    perform lawprep_private.assert_object(data,array['cycleId','topicId','kind','title','summary','body','visibility','sourceIds'],array['contentId','question','importReference']);
    content_uuid:=case when data ? 'contentId' then lawprep_private.uuid_field(data,'contentId') else gen_random_uuid() end;
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('lawprep:content:'||content_uuid::text,0));
    cycle:=lawprep_private.identifier(data,'cycleId'); topic:=lawprep_private.identifier(data,'topicId');
    kind:=lawprep_private.text_field(data,'kind',30); visibility:=lawprep_private.text_field(data,'visibility',20);
    if not exists(select 1 from public.topics t join public.exam_cycles c on c.id=t.cycle_id where t.cycle_id=cycle and t.id=topic and t.status='published' and c.status='published') then raise exception using errcode='23514',message='Published cycle/topic required.'; end if;
    if data ? 'contentId' then
      select * into v from lawprep_private.content_versions where content_id=content_uuid order by version_number desc limit 1;
      if not found or v.cycle_id<>cycle or v.kind<>kind then raise exception using errcode='23514',message='Revisions preserve content identity, cycle and kind.'; end if;
    end if;
    if jsonb_typeof(data->'sourceIds') is distinct from 'array' then raise exception using errcode='22023',message='Source list required.'; end if;
    if jsonb_array_length(data->'sourceIds') not between 1 and 12 then raise exception using errcode='22023',message='Invalid source count.'; end if;
    for item in select * from jsonb_array_elements(data->'sourceIds') loop
      source_ids:=array_append(source_ids,lawprep_private.uuid_field(jsonb_build_object('id',item),'id'));
    end loop;
    if cardinality(source_ids)<>(select count(distinct x) from unnest(source_ids) x) then raise exception using errcode='22023',message='Duplicate source.'; end if;
    if (kind='question') is distinct from (data ? 'question') then raise exception using errcode='22023',message='Only question drafts require a question structure.'; end if;
    if kind='question' then
      perform lawprep_private.assert_object(data->'question',array['options','correctOptionId','explanation']);
      if jsonb_typeof(data->'question'->'options') is distinct from 'array' then raise exception using errcode='22023',message='Options required.'; end if;
      if jsonb_array_length(data->'question'->'options') not between 2 and 6 then raise exception using errcode='22023',message='Invalid option count.'; end if;
      for item in select * from jsonb_array_elements(data->'question'->'options') loop
        perform lawprep_private.assert_object(item,array['id','text']);
        option_ids:=array_append(option_ids,lawprep_private.text_field(item,'id',32));
        canonical_options:=canonical_options||jsonb_build_array(jsonb_build_object('id',lawprep_private.text_field(item,'id',32),'text',lawprep_private.text_field(item,'text',4000)));
      end loop;
      if cardinality(option_ids)<>(select count(distinct x) from unnest(option_ids) x) or not(lawprep_private.text_field(data->'question','correctOptionId',32)=any(option_ids)) then raise exception using errcode='22023',message='Distinct options and matching key required.'; end if;
    end if;
    insert into lawprep_private.content_versions(content_id,version_number,cycle_id,kind,title,summary,body,visibility,created_by,import_reference,structure)
      values(content_uuid,coalesce(v.version_number,0)+1,cycle,kind,lawprep_private.text_field(data,'title',200),lawprep_private.text_field(data,'summary',1000),lawprep_private.text_field(data,'body',100000),visibility,caller,
        case when data ? 'importReference' then lawprep_private.text_field(data,'importReference',512) end,
        case when kind='question' then jsonb_build_object('options',canonical_options) else '{}'::jsonb end) returning id into record_id;
    insert into lawprep_private.version_sources(version_id,source_id) select record_id,x from unnest(source_ids) x;
    insert into lawprep_private.version_topics(version_id,cycle_id,topic_id) values(record_id,cycle,topic);
    if kind='question' then insert into lawprep_private.version_keys(version_id,answer_key,explanation) values(record_id,jsonb_build_object('correctOptionId',lawprep_private.text_field(data->'question','correctOptionId',32)),lawprep_private.text_field(data->'question','explanation',30000)); end if;

  elsif operation in ('review','publish','correct','withdraw') then
    record_id:=lawprep_private.uuid_field(p_command,'versionId');
    select * into v from lawprep_private.content_versions where id=record_id;
    if not found then raise exception using errcode='P0002',message='Version not found.'; end if;
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('lawprep:content:'||v.content_id::text,0));
    -- Re-read after the lock so checks use the current committed projection.
    perform 1 from lawprep_private.content_versions where id=record_id for update;
    note:=lawprep_private.text_field(p_command,'note',4000);
    if operation='review' then
      perform lawprep_private.assert_object(p_command,array['op','mutationId','versionId','sourceVerified','rightsVerified','answerVerified','explanationVerified','note']);
      insert into lawprep_private.content_reviews(version_id,reviewer_id,source_verified,rights_verified,answer_verified,explanation_verified,note)
        values(record_id,caller,lawprep_private.bool_field(p_command,'sourceVerified'),lawprep_private.bool_field(p_command,'rightsVerified'),lawprep_private.bool_field(p_command,'answerVerified'),lawprep_private.bool_field(p_command,'explanationVerified'),note);
    else
      perform lawprep_private.assert_object(p_command,array['op','mutationId','versionId','note'],case when operation='correct' then array['replacementVersionId'] else '{}'::text[] end);
      if operation='correct' then
        select * into replacement from lawprep_private.content_versions where id=lawprep_private.uuid_field(p_command,'replacementVersionId');
        if not found or replacement.id=v.id or replacement.content_id<>v.content_id or replacement.cycle_id<>v.cycle_id or replacement.kind<>v.kind then raise exception using errcode='23514',message='Correction must replace the same content identity.'; end if;
        perform lawprep_private.assert_publishable(replacement.id);
        if exists(select 1 from lawprep_private.publication_events where version_id=replacement.id or replacement_version_id=replacement.id) then raise exception using errcode='23514',message='Replacement must be unpublished.'; end if;
      elsif operation='publish' then
        perform lawprep_private.assert_publishable(v.id);
        if exists(select 1 from lawprep_private.publication_events where version_id=v.id or replacement_version_id=v.id) then raise exception using errcode='23514',message='Previously published versions cannot be republished.'; end if;
      end if;
      if operation in ('correct','withdraw') then
        delete from public.catalog_entries where version_id=v.id and status='published';
        if not found then raise exception using errcode='40001',message='Publication changed.'; end if;
      end if;
      if operation in ('publish','correct') then
        if operation='correct' then v:=replacement; end if;
        insert into public.catalog_entries(version_id,content_id,cycle_id,topic_id,kind,title,summary,visibility,status)
          select v.id,v.content_id,v.cycle_id,vt.topic_id,v.kind,v.title,v.summary,v.visibility,'published' from lawprep_private.version_topics vt where vt.version_id=v.id;
      end if;
      insert into lawprep_private.publication_events(version_id,actor_id,action,replacement_version_id,mutation_id,note)
        values(record_id,caller,case operation when 'publish' then 'published' when 'correct' then 'corrected' else 'withdrawn' end,case when operation='correct' then replacement.id end,mutation,note);
    end if;
  else raise exception using errcode='22023',message='Unsupported editorial operation.';
  end if;
  result:=jsonb_build_object('op',operation,'id',case when operation='cycle' then cycle when operation='topic' then topic else record_id::text end);
  insert into lawprep_private.mutation_receipts(user_id,mutation_id,digest,result) values(caller,mutation,command_digest,result);
  return result;
end;
$$;
revoke all on function lawprep_private.editor_command(jsonb) from public,anon,authenticated,service_role;
grant execute on function lawprep_private.editor_command(jsonb) to authenticated;
create function public.lawprep_editor_command(p_command jsonb) returns jsonb
language sql security invoker set search_path = '' as $$ select lawprep_private.editor_command(p_command); $$;
revoke all on function public.lawprep_editor_command(jsonb) from public,anon,authenticated,service_role;
grant execute on function public.lawprep_editor_command(jsonb) to authenticated;

-- Revoke every internal helper explicitly, including provider default grants.
revoke all on function lawprep_private.assert_object(jsonb,text[],text[]),lawprep_private.text_field(jsonb,text,integer,integer),lawprep_private.identifier(jsonb,text),lawprep_private.uuid_field(jsonb,text),lawprep_private.bool_field(jsonb,text),lawprep_private.require_publisher(),lawprep_private.assert_publishable(uuid) from public,anon,authenticated,service_role;

create function lawprep_private.editor_state(p_version_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare selected jsonb;
begin
  perform lawprep_private.require_publisher();
  if p_version_id is not null then
    select jsonb_build_object(
      'id',v.id,'contentId',v.content_id,'versionNumber',v.version_number,
      'draft',jsonb_strip_nulls(jsonb_build_object('contentId',v.content_id,'cycleId',v.cycle_id,'topicId',(select topic_id from lawprep_private.version_topics where version_id=v.id limit 1),
        'kind',v.kind,'title',v.title,'summary',v.summary,'body',v.body,'visibility',v.visibility,'importReference',v.import_reference,
        'sourceIds',(select coalesce(jsonb_agg(source_id order by source_id),'[]') from lawprep_private.version_sources where version_id=v.id),
        'question',case when v.kind='question' then (select jsonb_build_object('options',v.structure->'options','correctOptionId',k.answer_key->>'correctOptionId','explanation',k.explanation) from lawprep_private.version_keys k where k.version_id=v.id) end)),
      'review',(select jsonb_build_object('sourceVerified',r.source_verified,'rightsVerified',r.rights_verified,'answerVerified',r.answer_verified,'explanationVerified',r.explanation_verified,'note',r.note) from lawprep_private.content_reviews r where r.version_id=v.id),
      'events',(select coalesce(jsonb_agg(jsonb_build_object('action',e.action,'occurredAt',e.occurred_at,'note',e.note,'replacementVersionId',e.replacement_version_id) order by e.occurred_at,e.id),'[]') from lawprep_private.publication_events e where e.version_id=v.id or e.replacement_version_id=v.id)
    ) into selected from lawprep_private.content_versions v where v.id=p_version_id;
    if selected is null then raise exception using errcode='P0002',message='Version not found.'; end if;
  end if;
  return jsonb_build_object(
    'cycles',(select coalesce(jsonb_agg(jsonb_build_object('id',c.id,'examId',c.exam_id,'label',c.label) order by c.id),'[]') from (select * from public.exam_cycles order by id limit 100) c),
    'topics',(select coalesce(jsonb_agg(jsonb_build_object('id',t.id,'cycleId',t.cycle_id,'title',t.title,'prerequisiteIds',(select coalesce(jsonb_agg(p.prerequisite_id order by p.prerequisite_id),'[]') from public.topic_prerequisites p where p.cycle_id=t.cycle_id and p.topic_id=t.id)) order by t.cycle_id,t.id),'[]') from (select * from public.topics order by cycle_id,id limit 500) t),
    'sources',(select coalesce(jsonb_agg(jsonb_build_object('id',s.id,'title',s.title,'publisher',s.publisher,'url',s.url,'checkedAt',s.checked_at,'rights',s.rights,'reviewNote',s.review_note) order by s.checked_at desc,s.id),'[]') from (select * from lawprep_private.source_versions where url is not null order by (id in (select source_id from lawprep_private.version_sources where version_id=p_version_id)) desc,checked_at desc,id limit 100) s),
    'versions',(select coalesce(jsonb_agg(jsonb_build_object('id',v.id,'contentId',v.content_id,'versionNumber',v.version_number,'cycleId',v.cycle_id,'title',v.title,'kind',v.kind,'reviewed',exists(select 1 from lawprep_private.content_reviews where version_id=v.id),
      'state',case when exists(select 1 from public.catalog_entries where version_id=v.id and status='published') then 'published' when exists(select 1 from lawprep_private.publication_events where version_id=v.id and action='withdrawn') then 'withdrawn' when exists(select 1 from lawprep_private.publication_events where version_id=v.id and action='corrected') then 'corrected' else 'draft' end) order by v.created_at desc,v.id),'[]') from (select * from lawprep_private.content_versions order by created_at desc,id limit 50) v),
    'selected',selected
  );
end;
$$;
revoke all on function lawprep_private.editor_state(uuid) from public,anon,authenticated,service_role;
grant execute on function lawprep_private.editor_state(uuid) to authenticated;
create function public.lawprep_editor_state(p_version_id uuid default null) returns jsonb
language sql stable security invoker set search_path = '' as $$ select lawprep_private.editor_state(p_version_id); $$;
revoke all on function public.lawprep_editor_state(uuid) from public,anon,authenticated,service_role;
grant execute on function public.lawprep_editor_state(uuid) to authenticated;

-- RLS remains active: this caller-invoker query has no path to keys or bodies.
create function public.lawprep_catalog(p_exam_id text) returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare result jsonb;
begin
  if p_exam_id is null or p_exam_id not in ('clat-ug','blet-patna-llb','cuet-pg-llb') then raise exception using errcode='22023',message='Unknown exam route.'; end if;
  select jsonb_build_object('examId',p_exam_id,
    'cycles',(select coalesce(jsonb_agg(jsonb_build_object('id',c.id,'examId',c.exam_id,'label',c.label) order by c.id),'[]') from (select * from public.exam_cycles where exam_id=p_exam_id order by id limit 100) c),
    'topics',(select coalesce(jsonb_agg(jsonb_build_object('id',t.id,'cycleId',t.cycle_id,'title',t.title,'prerequisiteIds',(select coalesce(jsonb_agg(p.prerequisite_id order by p.prerequisite_id),'[]') from public.topic_prerequisites p where p.cycle_id=t.cycle_id and p.topic_id=t.id)) order by t.cycle_id,t.id),'[]') from (select t.* from public.topics t join public.exam_cycles c on c.id=t.cycle_id where c.exam_id=p_exam_id order by t.cycle_id,t.id limit 500) t),
    'items',(select coalesce(jsonb_agg(jsonb_build_object('versionId',e.version_id,'cycleId',e.cycle_id,'topicId',e.topic_id,'kind',e.kind,'title',e.title,'summary',e.summary) order by e.cycle_id,e.topic_id,e.version_id),'[]') from (select e.* from public.catalog_entries e join public.exam_cycles c on c.id=e.cycle_id where c.exam_id=p_exam_id order by e.cycle_id,e.topic_id,e.version_id limit 100) e)
  ) into result;
  return result;
end;
$$;
revoke all on function public.lawprep_catalog(text) from public,anon,authenticated,service_role;
grant execute on function public.lawprep_catalog(text) to anon,authenticated;

commit;
