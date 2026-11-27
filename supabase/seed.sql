-- LOCAL DEVELOPMENT ONLY. `supabase db reset` runs this against the local database.
-- Hosted environments get team members from ALLOWED_EMAILS via `pnpm seed:team`.
-- example.com addresses are reserved and never receive mail.
insert into public.team_members (email, display_name, can_approve) values
  ('approver@example.com', 'Local approver', true),
  ('member@example.com', 'Local member', false)
on conflict (email) do nothing;
