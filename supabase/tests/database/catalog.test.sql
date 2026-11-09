-- Transactional schema/role tests only. Real Auth/HTTP/Storage and multi-connection
-- publication tests are separate Task 3 requirements, not proved by set_config.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

select has_table('public', 'exam_cycles', 'versioned exam cycles exist');
select has_table('public', 'topics', 'topics exist');
select has_table('public', 'topic_prerequisites', 'prerequisite mappings exist');
select has_table('public', 'catalog_entries', 'public catalogue projection exists');
select has_table('lawprep_private', 'content_versions', 'private immutable versions exist');
select has_table('lawprep_private', 'version_keys', 'keys are separate and private');
select has_table('lawprep_private', 'publication_events', 'publication audit exists');

select ok(not exists (
  select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname in ('public', 'lawprep_private') and c.relkind = 'r'
  and not c.relrowsecurity
), 'all project tables have RLS');
select ok(not exists (
  select 1 from information_schema.columns
  where table_schema = 'public' and column_name in ('body', 'answer_key', 'explanation', 'payload')
), 'public metadata relations have no body, key or explanation columns');
select ok(not has_table_privilege('anon', 'lawprep_private.version_keys', 'SELECT'), 'anon cannot select keys');
select ok(not has_table_privilege('authenticated', 'lawprep_private.version_keys', 'SELECT'), 'learners cannot select keys');
select ok(not has_table_privilege('authenticated', 'lawprep_private.publisher_roles', 'INSERT'), 'learners cannot enrol themselves as publisher');
select ok(not has_table_privilege('authenticated', 'public.catalog_entries', 'INSERT'), 'authenticated cannot write catalogue directly');
select ok(not has_function_privilege('anon', 'lawprep_private.is_publisher()', 'EXECUTE'), 'anon cannot invoke publisher helper');
select ok(has_function_privilege('authenticated', 'lawprep_private.is_publisher()', 'EXECUTE'), 'authenticated has deliberate helper execution');
select is((select public from storage.buckets where id = 'lawprep-editorial'), false, 'editorial bucket is private');

-- Purely synthetic database identities. No emails are sent or real logins created.
insert into auth.users (id, aud, role, email, email_confirmed_at, is_anonymous) values
  ('10000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'owner-fixture@example.invalid', now(), false),
  ('10000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'student-fixture@example.invalid', now(), false);
insert into auth.sessions(id,user_id) values
  ('13000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001'),
  ('13000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002');
insert into lawprep_private.publisher_roles(user_id) values ('10000000-0000-4000-8000-000000000001');
insert into public.exam_cycles(id, exam_id, label, status, source_url, source_checked_at, source_verified)
values ('fixture-public', 'clat-ug', 'Synthetic test cycle', 'published', 'https://example.org/synthetic', now(), true),
       ('fixture-draft', 'clat-ug', 'Synthetic draft cycle', 'draft', null, null, false);
insert into public.topics(cycle_id, id, title, status) values
  ('fixture-public', 'test-topic', 'Synthetic topic', 'published'),
  ('fixture-draft', 'hidden-topic', 'Draft topic', 'draft');
insert into lawprep_private.content_versions(id, content_id, version_number, cycle_id, kind, title, summary, body, visibility)
values ('20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 1, 'fixture-public', 'question', 'Synthetic question', 'Synthetic public summary', 'Private question body', 'public'),
       ('20000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002', 1, 'fixture-public', 'lesson', 'Synthetic paid item', 'Restricted summary', 'Private lesson body', 'prepare');
insert into lawprep_private.version_keys(version_id, answer_key, explanation)
values ('20000000-0000-4000-8000-000000000001', '{"correctOptionId":"A"}', 'Private explanation');
insert into public.catalog_entries(version_id, content_id, cycle_id, topic_id, kind, title, summary, visibility, status)
values ('20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'fixture-public', 'test-topic', 'question', 'Synthetic question', 'Synthetic public summary', 'public', 'published'),
       ('20000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002', 'fixture-public', 'test-topic', 'lesson', 'Synthetic paid item', 'Restricted summary', 'prepare', 'published');

set local role anon;
select is((select count(*)::integer from public.exam_cycles), 1, 'anon sees only published sourced cycle');
select is((select count(*)::integer from public.topics), 1, 'anon sees only published topic in published cycle');
select is((select count(*)::integer from public.catalog_entries), 1, 'anon sees public summary but no restricted summary');
select throws_ok('select * from lawprep_private.version_keys', '42501', null, 'anon denied direct keys');
select throws_ok('select * from lawprep_private.content_versions', '42501', null, 'anon denied private bodies');
reset role;

select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000002","session_id":"13000000-0000-4000-8000-000000000002","role":"authenticated","user_metadata":{"role":"publisher"}}', true);
set local role authenticated;
select is(lawprep_private.is_publisher(), false, 'user metadata cannot grant publisher');
select is((select count(*)::integer from public.catalog_entries), 1, 'ordinary learner cannot read paid projection');
select throws_ok('select * from lawprep_private.version_keys', '42501', null, 'authenticated denied direct keys');
select throws_ok($$insert into lawprep_private.publisher_roles(user_id) values ('10000000-0000-4000-8000-000000000002')$$, '42501', null, 'learner cannot self-enrol');
select throws_ok($$delete from public.catalog_entries$$, '42501', null, 'learner cannot withdraw via direct table');
reset role;

select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000001","session_id":"13000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select is(lawprep_private.is_publisher(), true, 'current publisher membership is recognized');
select throws_ok('select * from lawprep_private.version_keys', '42501', null, 'publisher token still has no direct key relation privilege');
reset role;
delete from lawprep_private.publisher_roles where user_id = '10000000-0000-4000-8000-000000000001';
set local role authenticated;
select is(lawprep_private.is_publisher(), false, 'membership revocation affects existing caller claims');
reset role;

select throws_ok($$update lawprep_private.content_versions set body = 'changed' where id = '20000000-0000-4000-8000-000000000001'$$, '55000', 'Versioned records are append-only.', 'version payload cannot change');
select throws_ok($$delete from lawprep_private.version_keys where version_id = '20000000-0000-4000-8000-000000000001'$$, '55000', 'Versioned records are append-only.', 'historical key cannot be deleted');
insert into lawprep_private.source_versions(id,title,publisher,url,checked_at,rights) values
  ('40000000-0000-4000-8000-000000000001','Synthetic source','Fixture','https://example.org/source',now(),'permitted'),
  ('40000000-0000-4000-8000-000000000002','Another synthetic source','Fixture','https://example.org/second',now(),'permitted');
select lives_ok($$insert into lawprep_private.version_sources(version_id,source_id) values ('20000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001')$$, 'source assembly before review is allowed');
select lives_ok($$insert into lawprep_private.version_topics(version_id,cycle_id,topic_id) values ('20000000-0000-4000-8000-000000000001','fixture-public','test-topic')$$, 'topic assembly before review is allowed');
insert into lawprep_private.content_reviews(version_id,reviewer_id,source_verified,rights_verified,answer_verified,explanation_verified,note)
values ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001',true,true,true,true,'Synthetic reviewed snapshot'),
       ('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001',true,true,false,false,'Synthetic lesson review');
select throws_ok($$insert into lawprep_private.version_sources(version_id,source_id) values ('20000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000002')$$, '55000', 'Reviewed version bindings are sealed.', 'review prevents extra sources');
select throws_ok($$insert into lawprep_private.version_topics(version_id,cycle_id,topic_id) values ('20000000-0000-4000-8000-000000000002','fixture-public','test-topic')$$, '55000', 'Reviewed version bindings are sealed.', 'review prevents extra topics');
select throws_ok($$insert into lawprep_private.version_keys(version_id,answer_key,explanation) values ('20000000-0000-4000-8000-000000000002','{}','New key after review')$$, '55000', 'Reviewed version bindings are sealed.', 'review prevents late key');
select throws_ok($$insert into public.topic_prerequisites(cycle_id,topic_id,prerequisite_id) values ('fixture-public','test-topic','test-topic')$$, '23514', null, 'self prerequisite is invalid');
select throws_ok($$insert into public.topic_prerequisites(cycle_id,topic_id,prerequisite_id) values ('fixture-public','test-topic','hidden-topic')$$, '23503', null, 'cross-cycle prerequisite is invalid');
select throws_ok($$update public.exam_cycles set exam_id = 'blet-patna-llb' where id = 'fixture-public'$$, '55000', 'Catalogue identity is immutable.', 'cycle cannot silently change exam');
select throws_ok($$update public.exam_cycles set source_url = 'https://example.org/replaced' where id = 'fixture-public'$$, '55000', 'Catalogue identity is immutable.', 'cycle source identity is immutable');
select throws_ok($$update public.topics set title = 'Different meaning' where cycle_id = 'fixture-public'$$, '55000', 'Catalogue identity is immutable.', 'topic meaning is immutable');
select lives_ok($$update public.exam_cycles set status = 'withdrawn' where id = 'fixture-public'$$, 'withdrawal can change availability');
select throws_ok($$update public.exam_cycles set exam_id = 'blet-patna-llb' where id = 'fixture-public'$$, '55000', 'Catalogue identity is immutable.', 'withdrawing cannot bypass identity freeze');
update public.exam_cycles set status = 'published' where id = 'fixture-public';
insert into public.exam_cycles(id,exam_id,label) values ('fixture-graph','clat-ug','Synthetic graph cycle');
insert into public.topics(cycle_id,id,title) values ('fixture-graph','A','A'),('fixture-graph','B','B'),('fixture-graph','C','C');
select lives_ok($$insert into public.topic_prerequisites(cycle_id,topic_id,prerequisite_id) values ('fixture-graph','A','B')$$, 'acyclic prerequisite assembly is allowed');
select throws_ok($$insert into public.topic_prerequisites(cycle_id,topic_id,prerequisite_id) values ('fixture-graph','B','A')$$, '23514', 'Prerequisites must be acyclic.', 'indirect prerequisite cycle is rejected');
select throws_ok($$delete from public.topic_prerequisites where cycle_id = 'fixture-graph'$$, '55000', 'Versioned records are append-only.', 'prerequisite edges are immutable');
insert into lawprep_private.content_versions(content_id,version_number,cycle_id,kind,title,summary,body,visibility)
values ('30000000-0000-4000-8000-000000000003',1,'fixture-graph','lesson','Fixture','Fixture','Fixture','public');
select throws_ok($$insert into public.topic_prerequisites(cycle_id,topic_id,prerequisite_id) values ('fixture-graph','C','A')$$, '55000', 'Referenced cycle prerequisites are sealed.', 'content reference seals prerequisite graph');

-- Projection withdrawal cannot erase immutable source versions.
delete from public.catalog_entries where version_id = '20000000-0000-4000-8000-000000000001';
set local role anon;
select is((select count(*)::integer from public.catalog_entries), 0, 'withdrawn public projection is unavailable on next read');
reset role;
select is((select count(*)::integer from lawprep_private.content_versions where id = '20000000-0000-4000-8000-000000000001'), 1, 'withdrawal preserves historical version');

select * from finish();
rollback;
