-- The graph/seal locking protocol intentionally supports READ COMMITTED only.
-- A repeatable snapshot must be refused, rather than rely on stale guard reads.
begin isolation level repeatable read;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();
insert into public.exam_cycles(id,exam_id,label) values ('fixture-isolation','clat-ug','Synthetic isolation fixture');
select throws_ok($$insert into lawprep_private.content_versions(content_id,version_number,cycle_id,kind,title,summary,body,visibility) values ('50000000-0000-4000-8000-000000000001',1,'fixture-isolation','lesson','Fixture','Fixture','Fixture','public')$$,
  '25000', 'Catalogue guards require READ COMMITTED.', 'graph guard refuses repeatable snapshot');
select throws_ok($$insert into lawprep_private.content_reviews(version_id,reviewer_id,source_verified,rights_verified,answer_verified,explanation_verified,note) values ('50000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000003',true,true,true,true,'Fixture')$$,
  '25000', 'Catalogue guards require READ COMMITTED.', 'review guard refuses repeatable snapshot before checking bindings');
select * from finish();
rollback;
