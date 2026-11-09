-- Faithful, append-only private intake. No publication/mapping/rights approvals.
create table lawprep_private.import_batches (
  source_hash text primary key check(source_hash ~ '^[a-f0-9]{64}$'),
  file_hash text not null check(file_hash ~ '^[a-f0-9]{64}$'),
  records_hash text not null check(records_hash ~ '^[a-f0-9]{64}$'),
  source_path text not null check(length(source_path) between 1 and 512),
  format_version integer not null check(format_version=1),
  counts jsonb not null check(jsonb_typeof(counts)='object'),
  record_count integer not null check(record_count between 1 and 20000),
  errors jsonb not null check(jsonb_typeof(errors)='array' and octet_length(errors::text)<=16000),
  rights text not null default 'unknown' check(rights='unknown'),
  status text not null default 'loading' check(status in ('loading','complete')),
  imported_by uuid not null references auth.users(id),
  imported_at timestamptz not null default now()
);
create table lawprep_private.import_records (
  source_hash text not null references lawprep_private.import_batches(source_hash),
  ordinal integer not null check(ordinal between 0 and 19999),
  kind text not null check(kind in ('question','lesson','curriculum','deck','blueprint')),
  source_key text not null check(length(source_key) between 1 and 200),
  source_index integer not null check(source_index>=0),
  original_id text check(length(original_id)<=1000),
  title text not null check(length(title) between 1 and 200),
  exam text not null check(length(exam) between 1 and 200),
  record_json text not null check(octet_length(record_json)<=65536),
  record_hash text not null check(record_hash=encode(sha256(convert_to(record_json,'UTF8')),'hex')),
  envelope jsonb generated always as (record_json::jsonb) stored,
  primary key(source_hash,source_key,source_index), unique(source_hash,ordinal),
  check(jsonb_typeof(envelope)='object' and envelope ?& array['kind','sourceKey','sourceIndex','originalId','status','payload','issues']),
  check(envelope->>'kind'=kind and envelope->>'sourceKey'=source_key and (envelope->>'sourceIndex')::integer=source_index and envelope->>'status'='draft'),
  check((envelope->>'originalId') is not distinct from original_id),
  check(jsonb_typeof(envelope->'issues')='array')
);
alter table lawprep_private.import_batches enable row level security;
alter table lawprep_private.import_records enable row level security;
revoke all on lawprep_private.import_batches,lawprep_private.import_records from public,anon,authenticated,service_role;

create function lawprep_private.guard_intake_batch() returns trigger
language plpgsql security invoker set search_path='' as $$
declare actual_counts jsonb; actual_count integer; actual_hash text; first_ordinal integer; last_ordinal integer;
begin
  if current_setting('transaction_isolation')<>'read committed' then raise exception using errcode='25000',message='Intake requires READ COMMITTED.'; end if;
  if tg_op='INSERT' then
    if new.status<>'loading' then raise exception using errcode='23514',message='Intake must start loading.'; end if;
    return new;
  end if;
  if tg_op='DELETE' then raise exception using errcode='23514',message='Import provenance is immutable.'; end if;
  if old.status<>'loading' or new.status<>'complete' or (to_jsonb(old)-'status') is distinct from (to_jsonb(new)-'status') then
    raise exception using errcode='23514',message='Only validated completion may change an import batch.';
  end if;
  -- UPDATE holds the same parent row lock used by every record INSERT.
  select count(*)::integer,encode(sha256(convert_to(coalesce(string_agg(record_hash,'' order by ordinal),''),'UTF8')),'hex'),min(ordinal),max(ordinal)
    into actual_count,actual_hash,first_ordinal,last_ordinal from lawprep_private.import_records where source_hash=new.source_hash;
  select jsonb_build_object('question',count(*) filter(where kind='question'),'lesson',count(*) filter(where kind='lesson'),
    'curriculum',count(*) filter(where kind='curriculum'),'deck',count(*) filter(where kind='deck'),'blueprint',count(*) filter(where kind='blueprint'))
    into actual_counts from lawprep_private.import_records where source_hash=new.source_hash;
  if actual_count<>new.record_count or actual_counts<>new.counts or actual_hash<>new.records_hash or first_ordinal<>0 or last_ordinal<>actual_count-1 then
    raise exception using errcode='23514',message='Incomplete or changed intake cannot be sealed.';
  end if;
  return new;
end; $$;
create trigger guard_intake_batch before insert or update or delete on lawprep_private.import_batches for each row execute function lawprep_private.guard_intake_batch();
create function lawprep_private.guard_intake_record() returns trigger
language plpgsql security invoker set search_path='' as $$
declare batch_status text; expected integer;
begin
  if tg_op<>'INSERT' then raise exception using errcode='23514',message='Original import records are immutable.'; end if;
  -- Serialize inserts and sealing, and recheck after acquiring the parent lock.
  if current_setting('transaction_isolation')<>'read committed' then raise exception using errcode='25000',message='Intake requires READ COMMITTED.'; end if;
  select status,record_count into batch_status,expected from lawprep_private.import_batches where source_hash=new.source_hash for update;
  if batch_status is distinct from 'loading' or new.ordinal>=expected then raise exception using errcode='23514',message='Record requires an open matching batch.'; end if;
  return new;
end; $$;
create trigger guard_intake_record before insert or update or delete on lawprep_private.import_records for each row execute function lawprep_private.guard_intake_record();
revoke all on function lawprep_private.guard_intake_batch(),lawprep_private.guard_intake_record() from public,anon,authenticated,service_role;

create function lawprep_private.import_library(p_batch_hash text,p_kind text,p_query text,p_offset integer,p_limit integer,p_ordinal integer) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare selected_hash text; chosen jsonb; batches jsonb; selected_record jsonb; entries jsonb; total integer; search_text text;
begin
  perform lawprep_private.require_publisher();
  if p_offset is null or p_offset<0 or p_offset>20000 or p_limit is null or p_limit<1 or p_limit>50 or (p_ordinal is not null and (p_ordinal<0 or p_ordinal>19999))
    or (p_ordinal is not null and p_batch_hash is null) or (p_batch_hash is not null and p_batch_hash !~ '^[a-f0-9]{64}$') or (p_kind is not null and p_kind not in ('question','lesson','curriculum','deck','blueprint')) then
    raise exception using errcode='22023',message='Invalid import query.';
  end if;
  search_text:=lower(lawprep_private.text_field(jsonb_build_object('q',p_query),'q',100,0));
  select coalesce(jsonb_agg(meta order by imported_at desc,source_hash),'[]') into batches from (
    select b.source_hash,b.imported_at,jsonb_build_object('sourceHash',b.source_hash,'fileHash',b.file_hash,'recordsHash',b.records_hash,'sourcePath',b.source_path,
      'counts',b.counts,'recordCount',b.record_count,'rights',b.rights,'errors',b.errors,
      'missingExplanations',(select count(*) from lawprep_private.import_records r where r.source_hash=b.source_hash and r.envelope->'issues' ? 'missing-explanation')) meta
    from lawprep_private.import_batches b where b.status='complete' order by b.imported_at desc,b.source_hash limit 100
  ) ready;
  select b.source_hash into selected_hash from lawprep_private.import_batches b where b.status='complete' and (p_batch_hash is null or b.source_hash=p_batch_hash) order by b.imported_at desc,b.source_hash limit 1;
  if selected_hash is null and p_batch_hash is not null then raise exception using errcode='P0002',message='Complete import not found.'; end if;
  select item into chosen from jsonb_array_elements(batches) item where item->>'sourceHash'=selected_hash;
  if selected_hash is not null and chosen is null then
    select jsonb_build_object('sourceHash',b.source_hash,'fileHash',b.file_hash,'recordsHash',b.records_hash,'sourcePath',b.source_path,
      'counts',b.counts,'recordCount',b.record_count,'rights',b.rights,'errors',b.errors,
      'missingExplanations',(select count(*) from lawprep_private.import_records r where r.source_hash=b.source_hash and r.envelope->'issues' ? 'missing-explanation'))
      into chosen from lawprep_private.import_batches b where b.source_hash=selected_hash;
  end if;
  select count(*)::integer into total from lawprep_private.import_records r where r.source_hash=selected_hash and (p_kind is null or r.kind=p_kind)
    and strpos(lower(r.title||' '||r.exam||' '||coalesce(r.original_id,'')),search_text)>0;
  select coalesce(jsonb_agg(jsonb_build_object('ordinal',r.ordinal,'kind',r.kind,'sourceKey',r.source_key,'sourceIndex',r.source_index,'originalId',r.original_id,'title',r.title,'exam',r.exam,'issues',r.envelope->'issues') order by r.ordinal),'[]') into entries
    from (select r.* from lawprep_private.import_records r where r.source_hash=selected_hash and (p_kind is null or r.kind=p_kind)
      and strpos(lower(r.title||' '||r.exam||' '||coalesce(r.original_id,'')),search_text)>0 order by r.ordinal offset p_offset limit p_limit) r;
  if p_ordinal is not null then
    select jsonb_build_object('ordinal',r.ordinal,'recordHash',r.record_hash,'record',r.envelope) into selected_record from lawprep_private.import_records r where r.source_hash=selected_hash and r.ordinal=p_ordinal;
    if selected_record is null then raise exception using errcode='P0002',message='Imported record not found in batch.'; end if;
  end if;
  return jsonb_build_object('batches',batches,'batch',chosen,'records',entries,'total',total,'offset',p_offset,'limit',p_limit,'selected',selected_record);
end; $$;
revoke all on function lawprep_private.import_library(text,text,text,integer,integer,integer) from public,anon,authenticated,service_role;
grant execute on function lawprep_private.import_library(text,text,text,integer,integer,integer) to authenticated;
create function public.lawprep_import_library(p_batch_hash text default null,p_kind text default null,p_query text default '',p_offset integer default 0,p_limit integer default 20,p_ordinal integer default null) returns jsonb
language sql stable security invoker set search_path='' as $$ select lawprep_private.import_library(p_batch_hash,p_kind,p_query,p_offset,p_limit,p_ordinal); $$;
revoke all on function public.lawprep_import_library(text,text,text,integer,integer,integer) from public,anon,authenticated,service_role;
grant execute on function public.lawprep_import_library(text,text,text,integer,integer,integer) to authenticated;
