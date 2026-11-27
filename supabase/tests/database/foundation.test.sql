begin;
create extension if not exists pgtap with schema extensions;

select plan(31);

-------------------------------------------------------------------------------
-- Fixtures (as postgres)
-------------------------------------------------------------------------------
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'tap-member@example.com', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a2', 'tap-outsider@example.org', 'authenticated', 'authenticated');

insert into public.team_members (email, display_name, can_approve)
values ('tap-member@example.com', 'TAP member', false);

-- the auth.users trigger links user_id only for rows that existed; link explicitly
update public.team_members set user_id = '00000000-0000-0000-0000-0000000000a1' where email = 'tap-member@example.com';

insert into public.settings_versions (id, version, data, created_by)
values ('00000000-0000-0000-0000-00000000005e', 9001, '{"sample": true}', null);

-------------------------------------------------------------------------------
-- RLS is on for every public table
-------------------------------------------------------------------------------
select is(
  (select count(*)::int from pg_tables where schemaname = 'public' and not rowsecurity),
  0,
  'every public table has row level security enabled'
);

-------------------------------------------------------------------------------
-- Allowlist hook
-------------------------------------------------------------------------------
select is(
  public.hook_before_user_created('{"user": {"email": "TAP-Member@Example.com"}}'::jsonb),
  '{}'::jsonb,
  'hook allows a team email (case-insensitive)'
);
select is(
  (public.hook_before_user_created('{"user": {"email": "stranger@example.org"}}'::jsonb) -> 'error' ->> 'http_code')::int,
  403,
  'hook rejects an email that is not on the team list'
);

-------------------------------------------------------------------------------
-- anon: no access at all
-------------------------------------------------------------------------------
set local role anon;
select throws_ok('select count(*) from public.enquiries', '42501', null, 'anon cannot read enquiries');
select throws_ok('select count(*) from public.team_members', '42501', null, 'anon cannot read team_members');
select throws_ok('select count(*) from public.quotes', '42501', null, 'anon cannot read quotes');
select throws_ok('select count(*) from public.settings_versions', '42501', null, 'anon cannot read settings');
reset role;

-------------------------------------------------------------------------------
-- authenticated outsider: RLS hides everything and blocks writes
-------------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub": "00000000-0000-0000-0000-0000000000a2", "email": "tap-outsider@example.org", "role": "authenticated"}';

select is(public.is_team_member(), false, 'outsider is not a team member');
select is((select count(*)::int from public.team_members), 0, 'outsider sees no team members');
select is((select count(*)::int from public.settings_versions), 0, 'outsider sees no settings');
select throws_ok(
  $$insert into public.enquiries (source, raw_text) values ('text', 'hello')$$,
  '42501', null, 'outsider cannot create an enquiry'
);
reset role;

-------------------------------------------------------------------------------
-- team member: normal work is allowed
-------------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub": "00000000-0000-0000-0000-0000000000a1", "email": "tap-member@example.com", "role": "authenticated"}';

select is(public.is_team_member(), true, 'member is a team member');
select is(public.can_approve(), false, 'member without the flag cannot approve');

select lives_ok(
  $$insert into public.enquiries (id, source, raw_text) values ('00000000-0000-0000-0000-0000000000e1', 'text', 'Wedding enquiry')$$,
  'member can create an enquiry'
);
select is(
  (select created_by from public.enquiries where id = '00000000-0000-0000-0000-0000000000e1'),
  '00000000-0000-0000-0000-0000000000a1'::uuid,
  'created_by defaults to the caller'
);
select throws_ok(
  $$insert into public.enquiries (source, raw_text) values ('text', repeat('x', 20001))$$,
  '23514', null, 'enquiry text is limited to 20,000 characters'
);

select lives_ok(
  $$insert into public.quotes (id, enquiry_id, version, settings_version_id, inputs, result, total_pesewas, deposit_pesewas, balance_pesewas)
    values ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000e1', 1, '00000000-0000-0000-0000-00000000005e', '{}', '{}', 1425000, 712500, 712500)$$,
  'member can create a draft quote'
);
select throws_ok(
  $$insert into public.quotes (enquiry_id, version, settings_version_id, inputs, result, total_pesewas, deposit_pesewas, balance_pesewas)
    values ('00000000-0000-0000-0000-0000000000e1', 2, '00000000-0000-0000-0000-00000000005e', '{}', '{}', 1000, 600, 500)$$,
  '23514', null, 'deposit + balance must equal total'
);
select throws_ok(
  $$update public.quotes set status = 'approved' where id = '00000000-0000-0000-0000-0000000000f1'$$,
  '42501', null, 'member cannot set quote status directly'
);
select throws_ok(
  $$update public.quotes set quote_number = 'GD-2026-0001' where id = '00000000-0000-0000-0000-0000000000f1'$$,
  '42501', null, 'member cannot set a quote number directly'
);
select throws_ok('select * from public.quote_number_counters', '42501', null, 'member cannot read the number counters');
select throws_ok(
  $$update public.activity_log set action = 'x'$$,
  '42501', null, 'activity log cannot be edited'
);
select throws_ok(
  $$update public.settings_versions set data = '{}'$$,
  '42501', null, 'settings versions cannot be edited'
);
reset role;

-------------------------------------------------------------------------------
-- Immutability of approved quotes (enforced even for the table owner)
-------------------------------------------------------------------------------
update public.quotes
   set status = 'approved', quote_number = 'GD-2026-9001', approved_at = now(),
       approved_by = '00000000-0000-0000-0000-0000000000a1'
 where id = '00000000-0000-0000-0000-0000000000f1';

select throws_ok(
  $$update public.quotes set total_pesewas = 1, deposit_pesewas = 1, balance_pesewas = 0 where id = '00000000-0000-0000-0000-0000000000f1'$$,
  '23514', null, 'an approved quote cannot be changed'
);
select throws_ok(
  $$delete from public.quotes where id = '00000000-0000-0000-0000-0000000000f1'$$,
  '23514', null, 'an approved quote cannot be deleted'
);
select throws_ok(
  $$delete from public.enquiries where id = '00000000-0000-0000-0000-0000000000e1'$$,
  '23514', null, 'an enquiry with an approved quote cannot be hard-deleted'
);

set local role authenticated;
set local request.jwt.claims to '{"sub": "00000000-0000-0000-0000-0000000000a1", "email": "tap-member@example.com", "role": "authenticated"}';
update public.quotes set inputs = '{"changed": true}' where id = '00000000-0000-0000-0000-0000000000f1';
reset role;
select is(
  (select inputs from public.quotes where id = '00000000-0000-0000-0000-0000000000f1'),
  '{}'::jsonb,
  'a member update to an approved quote changes nothing'
);

select lives_ok(
  $$update public.quotes set status = 'superseded' where id = '00000000-0000-0000-0000-0000000000f1'$$,
  'approved -> superseded is the one allowed change'
);
select throws_ok(
  $$update public.quotes set status = 'approved' where id = '00000000-0000-0000-0000-0000000000f1'$$,
  '23514', null, 'a superseded quote is frozen'
);

-------------------------------------------------------------------------------
-- Storage buckets are private
-------------------------------------------------------------------------------
select is(
  (select count(*)::int from storage.buckets where id in ('audio', 'documents', 'branding') and public = false),
  3,
  'audio, documents and branding buckets exist and are private'
);
select is(
  (select file_size_limit from storage.buckets where id = 'audio'),
  26214400::bigint,
  'audio uploads are limited to 25 MB'
);

select * from finish();
rollback;
