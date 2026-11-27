-- GigDesk foundation schema.
-- Every table has RLS. Access requires the caller's JWT email to be in team_members.
-- Money columns are integer pesewas (bigint). GH₵1 = 100.

-------------------------------------------------------------------------------
-- Enums
-------------------------------------------------------------------------------
create type public.enquiry_status as enum ('new', 'needs_info', 'ready_to_price', 'quoted', 'approved', 'booked', 'lost');
create type public.enquiry_source as enum ('text', 'voice');
create type public.field_status as enum ('found', 'uncertain', 'missing', 'confirmed');
create type public.field_origin as enum ('ai', 'user', 'reply');
create type public.quote_status as enum ('draft', 'approved', 'superseded');
create type public.doc_kind as enum ('quote', 'rider');
create type public.message_tone as enum ('friendly', 'formal');
create type public.explanation_source as enum ('ai', 'template');

-------------------------------------------------------------------------------
-- Team & auth helpers
-------------------------------------------------------------------------------
create table public.team_members (
  email        text primary key check (email = lower(email) and position('@' in email) > 1),
  user_id      uuid unique references auth.users (id) on delete set null,
  display_name text,
  can_approve  boolean not null default false,
  created_at   timestamptz not null default now()
);

create function public.jwt_email()
returns text
language sql
stable
set search_path = ''
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

create function public.is_team_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.team_members where email = public.jwt_email());
$$;

create function public.can_approve()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select can_approve from public.team_members where email = public.jwt_email()), false);
$$;

-- Auth hook: only allowlisted team emails can create an account.
create function public.hook_before_user_created(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  new_email text := lower(coalesce(event -> 'user' ->> 'email', ''));
begin
  if exists (select 1 from public.team_members where email = new_email) then
    return '{}'::jsonb;
  end if;
  return jsonb_build_object(
    'error', jsonb_build_object('http_code', 403, 'message', 'This email is not on the GigDesk team list.')
  );
end;
$$;

revoke execute on function public.hook_before_user_created(jsonb) from public, anon, authenticated;
grant execute on function public.hook_before_user_created(jsonb) to supabase_auth_admin;

-- Link a new auth user to their team_members row.
create function public.link_team_member()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.team_members set user_id = new.id where email = lower(new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.link_team_member();

create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-------------------------------------------------------------------------------
-- Settings (insert-only versions)
-------------------------------------------------------------------------------
create table public.settings_versions (
  id         uuid primary key default gen_random_uuid(),
  version    integer not null unique check (version > 0),
  data       jsonb not null,
  note       text,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

-------------------------------------------------------------------------------
-- Enquiries & brief
-------------------------------------------------------------------------------
create table public.enquiries (
  id                      uuid primary key default gen_random_uuid(),
  status                  public.enquiry_status not null default 'new',
  source                  public.enquiry_source not null,
  raw_text                text check (raw_text is null or char_length(raw_text) <= 20000),
  audio_path              text,
  transcript              text check (transcript is null or char_length(transcript) <= 20000),
  transcript_confirmed_by uuid references auth.users (id) on delete set null,
  transcript_confirmed_at timestamptz,
  received_date           date not null default (now() at time zone 'Africa/Accra')::date,
  budget_pesewas          bigint check (budget_pesewas is null or budget_pesewas >= 0),
  -- Denormalised for lists; written by the server from confirmed brief fields.
  client_name             text,
  event_date              date,
  anonymised_at           timestamptz,
  created_by              uuid default auth.uid() references auth.users (id) on delete set null,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  check (source <> 'text' or raw_text is not null),
  check (source <> 'voice' or audio_path is not null or anonymised_at is not null)
);
create index enquiries_status_idx on public.enquiries (status);
create index enquiries_event_date_idx on public.enquiries (event_date);
create trigger enquiries_touch before update on public.enquiries
  for each row execute function public.touch_updated_at();

create table public.brief_fields (
  id           uuid primary key default gen_random_uuid(),
  enquiry_id   uuid not null references public.enquiries (id) on delete cascade,
  key          text not null,
  value        jsonb,
  status       public.field_status not null,
  source_quote text,
  note         text,
  origin       public.field_origin not null,
  confirmed_by uuid references auth.users (id) on delete set null,
  confirmed_at timestamptz,
  updated_at   timestamptz not null default now(),
  unique (enquiry_id, key),
  check ((status = 'confirmed') = (confirmed_at is not null))
);
create trigger brief_fields_touch before update on public.brief_fields
  for each row execute function public.touch_updated_at();

create table public.clarifications (
  id                uuid primary key default gen_random_uuid(),
  enquiry_id        uuid not null references public.enquiries (id) on delete cascade,
  tone              public.message_tone not null,
  draft_text        text not null,
  reply_text        text check (reply_text is null or char_length(reply_text) <= 20000),
  suggested_changes jsonb,
  accepted_keys     text[] not null default '{}',
  created_by        uuid default auth.uid() references auth.users (id) on delete set null,
  created_at        timestamptz not null default now()
);
create index clarifications_enquiry_idx on public.clarifications (enquiry_id);

create table public.lineup_decisions (
  id                 uuid primary key default gen_random_uuid(),
  enquiry_id         uuid not null unique references public.enquiries (id) on delete cascade,
  facts              jsonb not null,
  recommended        text,
  selected           text,
  override_reason    text,
  explanation        text,
  explanation_source public.explanation_source,
  created_by         uuid default auth.uid() references auth.users (id) on delete set null,
  updated_at         timestamptz not null default now(),
  check (
    selected is null
    or selected is not distinct from recommended
    or length(trim(coalesce(override_reason, ''))) > 0
  )
);
create trigger lineup_decisions_touch before update on public.lineup_decisions
  for each row execute function public.touch_updated_at();

-------------------------------------------------------------------------------
-- Quotes (versioned, approved rows immutable)
-------------------------------------------------------------------------------
create table public.quotes (
  id                  uuid primary key default gen_random_uuid(),
  enquiry_id          uuid not null references public.enquiries (id) on delete cascade,
  version             integer not null check (version > 0),
  status              public.quote_status not null default 'draft',
  settings_version_id uuid not null references public.settings_versions (id) on delete restrict,
  inputs              jsonb not null,
  result              jsonb not null,
  total_pesewas       bigint not null check (total_pesewas >= 0),
  deposit_pesewas     bigint not null check (deposit_pesewas >= 0),
  balance_pesewas     bigint not null check (balance_pesewas >= 0),
  quote_number        text unique check (quote_number is null or quote_number ~ '^GD-[0-9]{4}-[0-9]{4,}$'),
  approved_by         uuid references auth.users (id) on delete set null,
  approved_at         timestamptz,
  created_by          uuid default auth.uid() references auth.users (id) on delete set null,
  created_at          timestamptz not null default now(),
  unique (enquiry_id, version),
  check (deposit_pesewas + balance_pesewas = total_pesewas),
  check (
    (status = 'draft' and quote_number is null and approved_at is null)
    or (status <> 'draft' and quote_number is not null and approved_at is not null)
  )
);
create index quotes_status_idx on public.quotes (status);

create table public.quote_number_counters (
  year integer primary key,
  last integer not null default 0 check (last >= 0)
);

-- Approved quotes are immutable. The only permitted change is approved -> superseded.
-- Superseded quotes are fully frozen. Approved/superseded quotes cannot be deleted.
create function public.guard_quote_immutability()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    if old.status <> 'draft' then
      raise exception 'Quote % is approved and cannot be deleted', coalesce(old.quote_number, old.id::text)
        using errcode = 'check_violation';
    end if;
    return old;
  end if;

  if old.status = 'superseded' then
    raise exception 'Quote % is superseded and cannot be changed', old.quote_number
      using errcode = 'check_violation';
  end if;

  if old.status = 'approved' then
    if new.status = 'superseded'
       and (to_jsonb(new) - 'status') = (to_jsonb(old) - 'status') then
      return new;
    end if;
    raise exception 'Quote % is approved and cannot be changed. Create a new version instead.', old.quote_number
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger quotes_immutable
  before update or delete on public.quotes
  for each row execute function public.guard_quote_immutability();

-------------------------------------------------------------------------------
-- Riders, documents, activity
-------------------------------------------------------------------------------
create table public.riders (
  id          uuid primary key default gen_random_uuid(),
  quote_id    uuid not null unique references public.quotes (id) on delete cascade,
  schedule    jsonb not null default '{}'::jsonb,
  hospitality text,
  contact     text,
  notes       text,
  updated_at  timestamptz not null default now()
);
create trigger riders_touch before update on public.riders
  for each row execute function public.touch_updated_at();

create table public.documents (
  id           uuid primary key default gen_random_uuid(),
  quote_id     uuid not null references public.quotes (id) on delete restrict,
  kind         public.doc_kind not null,
  final        boolean not null,
  storage_path text not null,
  created_by   uuid default auth.uid() references auth.users (id) on delete set null,
  created_at   timestamptz not null default now()
);
create index documents_quote_idx on public.documents (quote_id);

create table public.activity_log (
  id          bigint generated always as identity primary key,
  entity_type text not null,
  entity_id   uuid,
  action      text not null,
  actor       uuid default auth.uid() references auth.users (id) on delete set null,
  payload     jsonb not null default '{}'::jsonb,
  at          timestamptz not null default now()
);
create index activity_log_entity_idx on public.activity_log (entity_type, entity_id);
create index activity_log_at_idx on public.activity_log (at desc);

-------------------------------------------------------------------------------
-- Privileges: nothing for anon; authenticated gets only what the app needs.
-- Status, numbers and approval columns on quotes change only through
-- SECURITY DEFINER RPCs (added in Phase 4).
-------------------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke execute on all functions in schema public from anon;

grant select on public.team_members to authenticated;
grant select, insert on public.settings_versions to authenticated;
grant select, insert, update, delete on public.enquiries to authenticated;
grant select, insert, update, delete on public.brief_fields to authenticated;
grant select, insert, update, delete on public.clarifications to authenticated;
grant select, insert, update, delete on public.lineup_decisions to authenticated;
grant select on public.quotes to authenticated;
grant insert (id, enquiry_id, version, settings_version_id, inputs, result, total_pesewas, deposit_pesewas, balance_pesewas)
  on public.quotes to authenticated;
grant update (settings_version_id, inputs, result, total_pesewas, deposit_pesewas, balance_pesewas)
  on public.quotes to authenticated;
grant delete on public.quotes to authenticated;
grant select, insert, update on public.riders to authenticated;
grant select, insert on public.documents to authenticated;
grant select, insert on public.activity_log to authenticated;
-- quote_number_counters: no grants at all.

-------------------------------------------------------------------------------
-- Row level security
-------------------------------------------------------------------------------
alter table public.team_members          enable row level security;
alter table public.settings_versions     enable row level security;
alter table public.enquiries             enable row level security;
alter table public.brief_fields          enable row level security;
alter table public.clarifications        enable row level security;
alter table public.lineup_decisions      enable row level security;
alter table public.quotes                enable row level security;
alter table public.quote_number_counters enable row level security;
alter table public.riders                enable row level security;
alter table public.documents             enable row level security;
alter table public.activity_log          enable row level security;

create policy team_members_read on public.team_members
  for select to authenticated using (public.is_team_member());

create policy settings_read on public.settings_versions
  for select to authenticated using (public.is_team_member());
create policy settings_insert on public.settings_versions
  for insert to authenticated with check (public.is_team_member());

create policy enquiries_all on public.enquiries
  for all to authenticated using (public.is_team_member()) with check (public.is_team_member());
create policy brief_fields_all on public.brief_fields
  for all to authenticated using (public.is_team_member()) with check (public.is_team_member());
create policy clarifications_all on public.clarifications
  for all to authenticated using (public.is_team_member()) with check (public.is_team_member());
create policy lineup_decisions_all on public.lineup_decisions
  for all to authenticated using (public.is_team_member()) with check (public.is_team_member());

create policy quotes_read on public.quotes
  for select to authenticated using (public.is_team_member());
create policy quotes_insert on public.quotes
  for insert to authenticated with check (public.is_team_member() and status = 'draft');
create policy quotes_update on public.quotes
  for update to authenticated using (public.is_team_member() and status = 'draft')
  with check (public.is_team_member() and status = 'draft');
create policy quotes_delete on public.quotes
  for delete to authenticated using (public.is_team_member() and status = 'draft');

create policy riders_read on public.riders
  for select to authenticated using (public.is_team_member());
create policy riders_insert on public.riders
  for insert to authenticated with check (public.is_team_member());
create policy riders_update on public.riders
  for update to authenticated using (public.is_team_member()) with check (public.is_team_member());

create policy documents_read on public.documents
  for select to authenticated using (public.is_team_member());
create policy documents_insert on public.documents
  for insert to authenticated with check (public.is_team_member());

create policy activity_read on public.activity_log
  for select to authenticated using (public.is_team_member());
create policy activity_insert on public.activity_log
  for insert to authenticated with check (public.is_team_member() and actor = auth.uid());

-------------------------------------------------------------------------------
-- Storage: private buckets, team-only access, signed URLs only
-------------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('audio', 'audio', false, 26214400, array[
    'audio/ogg', 'audio/opus', 'audio/mp4', 'audio/x-m4a', 'audio/m4a', 'audio/aac',
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/wave', 'audio/webm', 'video/webm'
  ]),
  ('documents', 'documents', false, 10485760, array['application/pdf']),
  ('branding', 'branding', false, 2097152, array['image/png', 'image/jpeg']);

create policy storage_team_read on storage.objects
  for select to authenticated
  using (bucket_id in ('audio', 'documents', 'branding') and public.is_team_member());

create policy storage_team_insert on storage.objects
  for insert to authenticated
  with check (bucket_id in ('audio', 'documents', 'branding') and public.is_team_member());

-- Final documents are never overwritten or deleted from the app.
create policy storage_team_update on storage.objects
  for update to authenticated
  using (bucket_id in ('audio', 'branding') and public.is_team_member())
  with check (bucket_id in ('audio', 'branding') and public.is_team_member());

create policy storage_team_delete on storage.objects
  for delete to authenticated
  using (bucket_id in ('audio', 'branding') and public.is_team_member());
