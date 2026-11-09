-- Synthetic roles only. Exact intake/provenance, private reads and no publication.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
select no_plan();
select has_table('lawprep_private','import_batches','intake batches exist');
select has_table('lawprep_private','import_records','intake records exist');
select ok((select relrowsecurity from pg_class where oid='lawprep_private.import_records'::regclass),'raw records have RLS');
select ok(not has_table_privilege('authenticated','lawprep_private.import_records','SELECT'),'no direct learner or publisher table read');
select ok(not has_table_privilege('authenticated','lawprep_private.import_records','INSERT'),'no client intake writer');
select ok(not has_function_privilege('anon','public.lawprep_import_library(text,text,text,integer,integer,integer)','EXECUTE'),'anonymous RPC execution denied');
insert into auth.users(id,email,email_confirmed_at,is_anonymous) values
 ('71000000-0000-4000-8000-000000000001','intake-owner@example.invalid',now(),false),
 ('71000000-0000-4000-8000-000000000002','intake-learner@example.invalid',now(),false);
insert into auth.sessions(id,user_id,not_after) values
 ('72000000-0000-4000-8000-000000000001','71000000-0000-4000-8000-000000000001',now()+interval '1 hour'),
 ('72000000-0000-4000-8000-000000000002','71000000-0000-4000-8000-000000000002',now()+interval '1 hour');
insert into lawprep_private.publisher_roles(user_id) values('71000000-0000-4000-8000-000000000001');
create temp table intake_fixture(ordinal integer,kind text,source_key text,source_index integer,title text,record_json text);
insert into intake_fixture values
 (0,'question','BANK.questions',0,'Raw question','{"kind":"question","sourceKey":"BANK.questions","sourceIndex":0,"originalId":null,"status":"draft","payload":{"q":"Raw question","expl":"","verify":true},"issues":["missing-explanation"]}'),
 (1,'curriculum','BANK.curriculum',0,'Raw curriculum','{"kind":"curriculum","sourceKey":"BANK.curriculum","sourceIndex":0,"originalId":null,"status":"draft","payload":{"html":"<img src=x onerror=alert(1)>"},"issues":[]}');
insert into lawprep_private.import_batches(source_hash,file_hash,records_hash,source_path,format_version,counts,record_count,errors,imported_by)
 select repeat('a',64),repeat('b',64),encode(sha256(convert_to(string_agg(encode(sha256(convert_to(record_json,'UTF8')),'hex'),'' order by ordinal),'UTF8')),'hex'),'fixture.html',1,'{"question":1,"lesson":0,"curriculum":1,"deck":0,"blueprint":0}',2,'["BLUEPRINTS unsupported"]','71000000-0000-4000-8000-000000000001' from intake_fixture;
select throws_ok($$update lawprep_private.import_batches set status='complete' where source_hash=repeat('a',64)$$,'23514',null,'partial batch cannot be sealed');
select throws_ok($$update lawprep_private.import_batches set file_hash=repeat('c',64) where source_hash=repeat('a',64)$$,'23514',null,'batch provenance cannot change');
insert into lawprep_private.import_records(source_hash,ordinal,kind,source_key,source_index,title,exam,record_json,record_hash)
 select repeat('a',64),ordinal,kind,source_key,source_index,title,'unassigned',record_json,encode(sha256(convert_to(record_json,'UTF8')),'hex') from intake_fixture;
select set_config('request.jwt.claims','{"sub":"71000000-0000-4000-8000-000000000001","session_id":"72000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;
select throws_ok($$select public.lawprep_import_library(repeat('a',64))$$,'P0002',null,'loading batch stays hidden when another complete import exists');
reset role;
update lawprep_private.import_batches set status='complete' where source_hash=repeat('a',64);
select throws_ok($$update lawprep_private.import_records set title='Changed' where source_hash=repeat('a',64)$$,'23514',null,'records cannot change');
select throws_ok($$delete from lawprep_private.import_records where source_hash=repeat('a',64)$$,'23514',null,'records cannot be removed');
select throws_ok($$delete from lawprep_private.import_batches where source_hash=repeat('a',64)$$,'23514',null,'batch cannot be removed');
select throws_ok($$insert into lawprep_private.import_records(source_hash,ordinal,kind,source_key,source_index,title,exam,record_json,record_hash) select repeat('a',64),ordinal,kind,source_key,source_index,title,'unassigned',record_json,encode(sha256(convert_to(record_json,'UTF8')),'hex') from intake_fixture limit 1$$,'23514',null,'sealed batch rejects every append');
set local role authenticated;
select is((public.lawprep_import_library()->>'total')::integer,2,'owner reads complete intake');
select is((public.lawprep_import_library()->'batch'->>'missingExplanations')::integer,1,'missing explanation remains visible');
select is(public.lawprep_import_library(repeat('a',64),null,'',0,20,0)#>>'{selected,record,payload,expl}','','missing explanation remains empty');
select is(public.lawprep_import_library(repeat('a',64),null,'',0,20,0)#>>'{selected,record,payload,verify}','true','legacy flag preserved as payload only');
select is(public.lawprep_import_library(repeat('a',64),null,'',0,20,1)#>>'{selected,record,payload,html}','<img src=x onerror=alert(1)>','raw HTML preserved without interpretation');
select is((public.lawprep_import_library(null,'curriculum')->>'total')::integer,1,'kind filter uses original kind');
select is((public.lawprep_import_library(null,null,'%',0,20)->>'total')::integer,0,'search wildcard is literal');
select is((public.lawprep_import_library(null,null,'curriculum',0,20)->>'total')::integer,1,'title search finds original record');
select is(jsonb_array_length(public.lawprep_import_library(null,null,'',1,1)->'records'),1,'paging respects limit and offset');
select throws_ok($$select public.lawprep_import_library(null,null,'',0,51)$$,'22023',null,'oversized page rejected');
select throws_ok($$select public.lawprep_import_library(null,null,'',-1,20)$$,'22023',null,'negative offset rejected');
select throws_ok($$select public.lawprep_import_library(repeat('a',64),null,'',0,20,2)$$,'P0002',null,'unknown record not replaced by empty success');
select throws_ok($$select public.lawprep_import_library(null,null,'',0,20,0)$$,'22023',null,'detail requires explicit batch identity');
select is(public.lawprep_import_library()->'batch'->>'rights','unknown','intake never grants rights');
select is(jsonb_array_length(public.lawprep_catalog('clat-ug')->'items'),0,'raw import has no public catalogue entry');
reset role;
select set_config('request.jwt.claims','{"sub":"71000000-0000-4000-8000-000000000002","session_id":"72000000-0000-4000-8000-000000000002","role":"authenticated","user_metadata":{"role":"publisher"}}',true);
set local role authenticated;
select throws_ok($$select public.lawprep_import_library()$$,'42501',null,'learner cannot read keys through imports');
reset role;
delete from auth.sessions where id='72000000-0000-4000-8000-000000000001';
select set_config('request.jwt.claims','{"sub":"71000000-0000-4000-8000-000000000001","session_id":"72000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;
select throws_ok($$select public.lawprep_import_library()$$,'28000',null,'revoked publisher session denied');
select * from finish();
rollback;
