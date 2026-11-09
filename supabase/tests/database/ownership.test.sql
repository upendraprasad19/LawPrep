-- Synthetic SQL roles/sessions only; not real Auth or REST/Storage proof.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();
select has_table('public', 'profiles', 'profiles exist');
select has_table('public', 'target_history', 'target history read boundary exists');
select ok(not has_table_privilege('authenticated', 'public.profiles', 'UPDATE'), 'direct profile writes cannot bypass revision checks');
select ok(not has_table_privilege('authenticated', 'public.target_history', 'INSERT'), 'history writer is not exposed early');
insert into auth.users(id,email,email_confirmed_at,is_anonymous) values
 ('11000000-0000-4000-8000-000000000001','a@example.invalid',now(),false),
 ('11000000-0000-4000-8000-000000000002','b@example.invalid',now(),false);
insert into auth.sessions(id,user_id,not_after) values
 ('12000000-0000-4000-8000-000000000001','11000000-0000-4000-8000-000000000001',now()+interval '1 hour'),
 ('12000000-0000-4000-8000-000000000002','11000000-0000-4000-8000-000000000002',now()+interval '1 hour');
insert into lawprep_private.publisher_roles(user_id) values ('11000000-0000-4000-8000-000000000001');
insert into public.exam_cycles(id,exam_id,label) values('ownership-fixture-cycle','clat-ug','Synthetic ownership cycle');
insert into public.target_history(user_id,exam_id,cycle_id) values
 ('11000000-0000-4000-8000-000000000001','clat-ug','ownership-fixture-cycle'),
 ('11000000-0000-4000-8000-000000000002','clat-ug','ownership-fixture-cycle');
select set_config('request.jwt.claims','{"sub":"11000000-0000-4000-8000-000000000001","session_id":"12000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;
select is(public.lawprep_actor()->>'role','publisher','current membership is authoritative');
select is(public.lawprep_save_profile('A student','Asia/Kolkata',0)->>'revision','1','profile creation is acknowledged');
select throws_ok($$select public.lawprep_save_profile('Lost update','UTC',0)$$,'40001',null,'stale revision is rejected');
select is(public.lawprep_save_profile('Updated A','UTC',1)->>'revision','2','matching revision updates exactly once');
select throws_ok($$select public.lawprep_save_profile('Unsupported timezone','Factory',2)$$,'22023',null,'Postgres sentinel unsupported by Intl cannot poison a saved profile');
select is((select count(*)::integer from public.profiles),1,'A sees own profile');
select is((select count(*)::integer from public.target_history),1,'A sees only own history');
select is((select count(*)::integer from public.target_history where user_id='11000000-0000-4000-8000-000000000002'),0,'A cannot guess B history');
reset role;
select set_config('request.jwt.claims','{"sub":"11000000-0000-4000-8000-000000000002","session_id":"12000000-0000-4000-8000-000000000002","role":"authenticated","user_metadata":{"role":"publisher"}}',true);
set local role authenticated;
select is(public.lawprep_actor()->>'role','learner','user metadata does not grant owner');
select is((select count(*)::integer from public.profiles),0,'B cannot read A profile');
select is((select count(*)::integer from public.target_history),1,'B sees only own history');
select throws_ok($$select public.lawprep_editor_state(null)$$,'42501',null,'learner cannot read editor');
select throws_ok($$select public.lawprep_editor_command('{"op":"publish"}')$$,'42501',null,'learner cannot publish');
reset role;
delete from auth.sessions where id='12000000-0000-4000-8000-000000000001';
select set_config('request.jwt.claims','{"sub":"11000000-0000-4000-8000-000000000001","session_id":"12000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;
select is((select count(*)::integer from public.profiles),0,'revoked session cannot read own profile directly');
select is(lawprep_private.is_publisher(),false,'revoked session loses direct Storage capability');
select throws_ok($$select public.lawprep_actor()$$,'28000',null,'revoked session cannot restore API capability');
select throws_ok($$select public.lawprep_save_profile('Revoked','UTC',2)$$,'28000',null,'revoked session cannot save');
reset role;
update auth.sessions set not_after=now()-interval '1 second' where id='12000000-0000-4000-8000-000000000002';
select set_config('request.jwt.claims','{"sub":"11000000-0000-4000-8000-000000000002","session_id":"12000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
set local role authenticated;
select throws_ok($$select public.lawprep_actor()$$,'28000',null,'expired session cannot restore API capability');
reset role;
update auth.sessions set not_after=null where id='12000000-0000-4000-8000-000000000002';
update auth.users set email_confirmed_at=null where id='11000000-0000-4000-8000-000000000002';
set local role authenticated;
select throws_ok($$select public.lawprep_actor()$$,'28000',null,'unconfirmed identity is denied');
reset role;
update auth.users set email_confirmed_at=now(),is_anonymous=true where id='11000000-0000-4000-8000-000000000002';
set local role authenticated;
select throws_ok($$select public.lawprep_actor()$$,'28000',null,'anonymous Auth identity is denied');
reset role;
update auth.users set is_anonymous=false where id='11000000-0000-4000-8000-000000000002';
select set_config('request.jwt.claims','{"sub":"11000000-0000-4000-8000-000000000002","session_id":"not-a-uuid","role":"authenticated"}',true);
set local role authenticated;
select is(lawprep_private.current_user_id(),null::uuid,'malformed session claim has no identity');
reset role;
select * from finish();
rollback;
