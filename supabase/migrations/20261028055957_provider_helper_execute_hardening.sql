-- Separate, reviewable provider hardening. Verified provider owner: postgres;
-- ensure_rls remains its enabled ddl_command_end event trigger. Do not replace it.
begin;
do $$
begin
  if not exists(select 1 from pg_proc p where p.oid='public.rls_auto_enable()'::regprocedure and p.prorettype='event_trigger'::regtype and p.proowner='postgres'::regrole and p.prosecdef)
    or not exists(select 1 from pg_event_trigger where evtname='ensure_rls' and evtfoid='public.rls_auto_enable()'::regprocedure and evtevent='ddl_command_end' and evtenabled='O') then
    raise exception 'Provider RLS helper differs from the reviewed configuration. Stop and inspect.';
  end if;
end;
$$;
revoke execute on function public.rls_auto_enable() from public,anon,authenticated,service_role;
-- Its owning postgres role retains owner privileges for event-trigger execution.
commit;
