-- Reviewed operation template, never run by migrations or the app.
-- Requires explicit owner instruction AFTER the owner verifies email in Auth.
-- Supply lawprep.owner_email securely in this administrator's transaction.
begin;
do $$
declare wanted text:=nullif(current_setting('lawprep.owner_email',true),''); matched uuid; matches integer;
begin
  if wanted is null then raise exception 'Supply the explicitly approved owner email.'; end if;
  select count(*),min(id::text)::uuid into matches,matched from auth.users
    where lower(email)=lower(wanted) and email_confirmed_at is not null and not is_anonymous;
  if matches<>1 or not exists(select 1 from auth.sessions s where s.user_id=matched and (s.not_after is null or s.not_after>statement_timestamp())) then
    raise exception 'Exactly one matching verified identity with a live session is required. No role granted.';
  end if;
  insert into lawprep_private.publisher_roles(user_id) values(matched) on conflict(user_id) do nothing;
end;
$$;
commit;
