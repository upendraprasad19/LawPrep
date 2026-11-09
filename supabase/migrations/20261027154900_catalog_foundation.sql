-- Task 3 foundation only. Creates no publisher, course content or learner data.
-- Publication RPCs, application integration and runtime verification follow.
-- Apply as one transaction; no statements may be selectively applied.
begin;

create schema lawprep_private;
revoke all on schema lawprep_private from public, anon, authenticated, service_role;
grant usage on schema lawprep_private to authenticated;
alter default privileges in schema lawprep_private revoke all on tables from public, anon, authenticated, service_role;
alter default privileges in schema lawprep_private revoke execute on functions from public, anon, authenticated, service_role;

create table lawprep_private.publisher_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  granted_at timestamptz not null default now()
);
create table public.exam_cycles (
  id text primary key check (id ~ '^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$'),
  exam_id text not null check (exam_id in ('clat-ug', 'blet-patna-llb', 'cuet-pg-llb')),
  label text not null check (length(label) between 1 and 200),
  status text not null default 'draft' check (status in ('draft', 'published', 'withdrawn')),
  source_url text check (length(source_url) <= 2048 and source_url ~ '^https://[^[:space:]]+$'),
  source_checked_at timestamptz,
  source_verified boolean not null default false,
  check (status <> 'published' or (source_verified and source_url is not null and source_checked_at is not null))
);
create table public.topics (
  cycle_id text not null references public.exam_cycles(id),
  id text not null check (id ~ '^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$'),
  title text not null check (length(title) between 1 and 200),
  status text not null default 'draft' check (status in ('draft', 'published', 'withdrawn')),
  primary key (cycle_id, id)
);
create table public.topic_prerequisites (
  cycle_id text not null, topic_id text not null, prerequisite_id text not null,
  primary key (cycle_id, topic_id, prerequisite_id),
  foreign key (cycle_id, topic_id) references public.topics(cycle_id, id),
  foreign key (cycle_id, prerequisite_id) references public.topics(cycle_id, id),
  check (topic_id <> prerequisite_id)
);
create table lawprep_private.source_versions (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) between 1 and 300),
  publisher text not null check (length(publisher) between 1 and 200),
  url text check (length(url) <= 2048 and url ~ '^https://[^[:space:]]+$'),
  storage_path text check (length(storage_path) between 1 and 512),
  sha256 text check (sha256 ~ '^[a-f0-9]{64}$'),
  checked_at timestamptz not null,
  rights text not null default 'unknown' check (rights in ('unknown', 'permitted', 'restricted')),
  review_note text not null default '' check (length(review_note) <= 4000),
  check (url is not null or (storage_path is not null and sha256 is not null)),
  check (storage_path is null or sha256 is not null)
);
create table lawprep_private.content_versions (
  id uuid primary key default gen_random_uuid(), content_id uuid not null,
  version_number integer not null check (version_number > 0),
  cycle_id text not null references public.exam_cycles(id),
  kind text not null check (kind in ('guide', 'lesson', 'question', 'current-affairs')),
  title text not null check (length(title) between 1 and 200),
  summary text not null check (length(summary) between 1 and 1000),
  body text not null check (length(body) between 1 and 100000),
  visibility text not null check (visibility in ('public', 'prepare')),
  created_at timestamptz not null default now(), created_by uuid,
  import_reference text check (length(import_reference) <= 512),
  unique (content_id, version_number), unique (id, cycle_id),
  unique (id, content_id, cycle_id, kind, visibility)
);
create table lawprep_private.version_sources (
  version_id uuid not null references lawprep_private.content_versions(id),
  source_id uuid not null references lawprep_private.source_versions(id),
  primary key (version_id, source_id)
);
create table lawprep_private.version_topics (
  version_id uuid not null, cycle_id text not null, topic_id text not null,
  primary key (version_id, topic_id),
  foreign key (version_id, cycle_id) references lawprep_private.content_versions(id, cycle_id),
  foreign key (cycle_id, topic_id) references public.topics(cycle_id, id)
);
create table lawprep_private.version_keys (
  version_id uuid primary key references lawprep_private.content_versions(id),
  answer_key jsonb not null check (jsonb_typeof(answer_key) = 'object' and octet_length(answer_key::text) <= 16000),
  explanation text not null check (length(explanation) between 1 and 30000)
);
create table lawprep_private.content_reviews (
  version_id uuid primary key references lawprep_private.content_versions(id),
  reviewer_id uuid not null, reviewed_at timestamptz not null default now(),
  source_verified boolean not null, rights_verified boolean not null,
  answer_verified boolean not null, explanation_verified boolean not null,
  note text not null check (length(note) between 1 and 4000)
);
create table lawprep_private.publication_events (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references lawprep_private.content_versions(id), actor_id uuid not null,
  action text not null check (action in ('published', 'corrected', 'withdrawn')),
  replacement_version_id uuid references lawprep_private.content_versions(id),
  mutation_id uuid not null unique, occurred_at timestamptz not null default now(),
  note text not null check (length(note) between 1 and 4000),
  check ((action = 'corrected') = (replacement_version_id is not null)),
  check (replacement_version_id is null or replacement_version_id <> version_id)
);
create table public.catalog_entries (
  version_id uuid primary key, content_id uuid not null, cycle_id text not null,
  topic_id text not null, kind text not null,
  title text not null check (length(title) between 1 and 200),
  summary text not null check (length(summary) between 1 and 1000), visibility text not null,
  status text not null check (status in ('draft', 'published', 'withdrawn')),
  unique (content_id, cycle_id),
  foreign key (version_id, content_id, cycle_id, kind, visibility)
    references lawprep_private.content_versions(id, content_id, cycle_id, kind, visibility),
  foreign key (cycle_id, topic_id) references public.topics(cycle_id, id)
);

-- Status is an availability projection; changing descriptive/source/route
-- identity requires new cycle/topic IDs, even if temporarily withdrawn.
create function lawprep_private.guard_catalog_identity() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    raise exception using errcode = '55000', message = 'Catalogue identity is immutable.';
  end if;
  if (to_jsonb(new) - 'status') is distinct from (to_jsonb(old) - 'status') then
    raise exception using errcode = '55000', message = 'Catalogue identity is immutable.';
  end if;
  return new;
end;
$$;
revoke all on function lawprep_private.guard_catalog_identity() from public, anon, authenticated, service_role;
create trigger guard_catalog_identity before update or delete on public.exam_cycles
  for each row execute function lawprep_private.guard_catalog_identity();
create trigger guard_catalog_identity before update or delete on public.topics
  for each row execute function lawprep_private.guard_catalog_identity();

-- Lock the cycle both when adding graph edges and when taking the first content
-- reference. This prevents concurrent reverse edges and graph/reference races.
create function lawprep_private.guard_cycle_graph() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if current_setting('transaction_isolation') <> 'read committed' then
    raise exception using errcode = '25000', message = 'Catalogue guards require READ COMMITTED.';
  end if;
  perform 1 from public.exam_cycles c where c.id = new.cycle_id for update;
  if tg_table_name = 'content_versions' then return new; end if;
  if new.topic_id = new.prerequisite_id then
    raise exception using errcode = '23514', message = 'Prerequisites must be acyclic.';
  end if;
  if not exists (select 1 from public.topics t where t.cycle_id = new.cycle_id and t.id = new.topic_id)
    or not exists (select 1 from public.topics t where t.cycle_id = new.cycle_id and t.id = new.prerequisite_id) then
    raise exception using errcode = '23503', message = 'Prerequisites must share a cycle.';
  end if;
  if exists (
    with recursive reachable(id) as (
      select new.prerequisite_id
      union
      select p.prerequisite_id from public.topic_prerequisites p
      join reachable r on p.topic_id = r.id where p.cycle_id = new.cycle_id
    ) select 1 from reachable where id = new.topic_id
  ) then
    raise exception using errcode = '23514', message = 'Prerequisites must be acyclic.';
  end if;
  if exists (select 1 from lawprep_private.content_versions v where v.cycle_id = new.cycle_id) then
    raise exception using errcode = '55000', message = 'Referenced cycle prerequisites are sealed.';
  end if;
  return new;
end;
$$;
revoke all on function lawprep_private.guard_cycle_graph() from public, anon, authenticated, service_role;
create trigger guard_cycle_graph before insert on public.topic_prerequisites
  for each row execute function lawprep_private.guard_cycle_graph();
create trigger guard_cycle_graph before insert on lawprep_private.content_versions
  for each row execute function lawprep_private.guard_cycle_graph();

-- Assembly and review lock the same parent. After a review record exists no
-- caller, including a future privileged RPC, may append a new binding/key.
create function lawprep_private.guard_version_seal() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if current_setting('transaction_isolation') <> 'read committed' then
    raise exception using errcode = '25000', message = 'Catalogue guards require READ COMMITTED.';
  end if;
  perform 1 from lawprep_private.content_versions v where v.id = new.version_id for update;
  if tg_table_name <> 'content_reviews' and exists (
    select 1 from lawprep_private.content_reviews r where r.version_id = new.version_id
  ) then
    raise exception using errcode = '55000', message = 'Reviewed version bindings are sealed.';
  end if;
  return new;
end;
$$;
revoke all on function lawprep_private.guard_version_seal() from public, anon, authenticated, service_role;
do $$
declare table_name text;
begin
  foreach table_name in array array['version_sources','version_topics','version_keys','content_reviews'] loop
    execute format('create trigger guard_version_seal before insert on lawprep_private.%I for each row execute function lawprep_private.guard_version_seal()', table_name);
  end loop;
end;
$$;

-- Historical actor UUIDs have no Auth FK: account deletion must not cascade
-- changes into an immutable source version or audit. Retention is a launch gate.
create function lawprep_private.reject_version_change() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  raise exception using errcode = '55000', message = 'Versioned records are append-only.';
end;
$$;
revoke all on function lawprep_private.reject_version_change() from public, anon, authenticated, service_role;
create trigger reject_version_change before update or delete on public.topic_prerequisites
  for each row execute function lawprep_private.reject_version_change();
do $$
declare table_name text;
begin
  foreach table_name in array array['source_versions','content_versions','version_sources','version_topics','version_keys','content_reviews','publication_events'] loop
    execute format('create trigger reject_version_change before update or delete on lawprep_private.%I for each row execute function lawprep_private.reject_version_change()', table_name);
  end loop;
  foreach table_name in array array['publisher_roles','source_versions','content_versions','version_sources','version_topics','version_keys','content_reviews','publication_events'] loop
    execute format('alter table lawprep_private.%I enable row level security', table_name);
    execute format('revoke all on table lawprep_private.%I from public, anon, authenticated, service_role', table_name);
  end loop;
  foreach table_name in array array['exam_cycles','topics','topic_prerequisites','catalog_entries'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on table public.%I from public, anon, authenticated, service_role', table_name);
    execute format('grant select on table public.%I to anon, authenticated', table_name);
  end loop;
end;
$$;
create policy published_exam_cycles on public.exam_cycles for select to anon, authenticated
  using (status = 'published' and source_verified);
create policy published_topics on public.topics for select to anon, authenticated
  using (status = 'published' and exists (select 1 from public.exam_cycles c where c.id = cycle_id));
create policy published_prerequisites on public.topic_prerequisites for select to anon, authenticated
  using (exists (select 1 from public.topics t where t.cycle_id = topic_prerequisites.cycle_id and t.id = topic_id)
    and exists (select 1 from public.topics t where t.cycle_id = topic_prerequisites.cycle_id and t.id = prerequisite_id));
create policy published_catalog_entries on public.catalog_entries for select to anon, authenticated
  using (status = 'published' and visibility = 'public'
    and exists (select 1 from public.topics t where t.cycle_id = catalog_entries.cycle_id and t.id = topic_id));

-- Deliberately exposes only current-caller membership to Storage policies.
-- No caller-supplied user identity, private row read or self-enrolment.
create function lawprep_private.is_publisher() returns boolean
language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is not null and exists (
    select 1 from lawprep_private.publisher_roles r where r.user_id = (select auth.uid())
  );
$$;
revoke all on function lawprep_private.is_publisher() from public, anon, authenticated, service_role;
grant execute on function lawprep_private.is_publisher() to authenticated;
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('lawprep-editorial', 'lawprep-editorial', false, 10485760, array['application/pdf','image/png','image/jpeg']);
create policy lawprep_editorial_read on storage.objects for select to authenticated
  using (bucket_id = 'lawprep-editorial' and (select lawprep_private.is_publisher()));
create policy lawprep_editorial_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'lawprep-editorial' and (select lawprep_private.is_publisher()));
-- No UPDATE/DELETE policy: publisher assets get new paths, never overwrites.
-- Privileged Storage maintenance requires a separate reviewed operation.

create index version_sources_source_idx on lawprep_private.version_sources(source_id);
create index version_topics_topic_idx on lawprep_private.version_topics(cycle_id, topic_id);
create index content_versions_cycle_idx on lawprep_private.content_versions(cycle_id);
create index publication_events_version_idx on lawprep_private.publication_events(version_id, occurred_at);
create index publication_events_replacement_idx on lawprep_private.publication_events(replacement_version_id) where replacement_version_id is not null;
create index prerequisites_reverse_idx on public.topic_prerequisites(cycle_id, prerequisite_id);
create index catalog_entries_topic_idx on public.catalog_entries(cycle_id, topic_id, version_id);
commit;
