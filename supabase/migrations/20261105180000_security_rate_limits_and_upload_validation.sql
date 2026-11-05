-- Security hardening for QR scans, uploads, and public Data API grants.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.qr_scan_rate_limits (
  scope text not null check (scope in ('ip','ip_slug')),
  key_hash text not null check (key_hash ~ '^[a-f0-9]{64}$'),
  window_start timestamptz not null,
  request_count integer not null default 0 check (request_count >= 0),
  primary key (scope, key_hash, window_start)
);
create table if not exists private.qr_scan_abuse_events (
  id bigint generated always as identity primary key,
  scope text not null,
  key_hash text not null check (key_hash ~ '^[a-f0-9]{64}$'),
  slug text null,
  request_count integer not null,
  occurred_at timestamptz not null default now()
);
alter table private.qr_scan_rate_limits enable row level security;
alter table private.qr_scan_abuse_events enable row level security;
revoke all on all tables in schema private from public, anon, authenticated;

create or replace function public.consume_qr_scan_rate_limit(
  p_key_hash text,
  p_scope text,
  p_window_start timestamptz,
  p_limit integer,
  p_slug text default null
) returns integer
language plpgsql
security definer
set search_path = pg_catalog, private
as $$
declare
  v_count integer;
begin
  if p_key_hash !~ '^[a-f0-9]{64}$' or p_scope not in ('ip','ip_slug')
     or p_limit < 1 or p_limit > 10000 then
    raise exception 'Invalid rate limit parameters';
  end if;

  insert into private.qr_scan_rate_limits(scope,key_hash,window_start,request_count)
  values (p_scope,p_key_hash,p_window_start,1)
  on conflict (scope,key_hash,window_start)
  do update set request_count = private.qr_scan_rate_limits.request_count + 1
  returning request_count into v_count;

  if v_count > p_limit then
    insert into private.qr_scan_abuse_events(scope,key_hash,slug,request_count)
    values (p_scope,p_key_hash,left(p_slug,32),v_count);
  end if;

  if mod(abs(hashtext(p_key_hash)),100)=0 then
    delete from private.qr_scan_rate_limits where window_start < now() - interval '2 hours';
    delete from private.qr_scan_abuse_events where occurred_at < now() - interval '30 days';
  end if;
  return v_count;
end;
$$;
revoke all on function public.consume_qr_scan_rate_limit(text,text,timestamptz,integer,text) from public, anon, authenticated;
grant execute on function public.consume_qr_scan_rate_limit(text,text,timestamptz,integer,text) to service_role;

-- Public menu access is read-only through the security-invoker view. The view
-- needs only these four base-table columns; no public write privileges remain.
revoke all on public.qr_codes from anon;
grant select (id,title,slug,payload) on public.qr_codes to anon;
revoke insert, update, delete, truncate, references, trigger on public.qr_codes from anon;
revoke insert, update, delete, truncate, references, trigger on public.public_menu_qr_codes from anon, authenticated;
grant select on public.public_menu_qr_codes to anon, authenticated;

-- Scan rows are written only by the trusted redirect function (service_role).
revoke all on public.qr_scans from anon, authenticated;
grant select on public.qr_scans to authenticated;

-- Browser clients must use qr-upload, which verifies magic bytes before storage.
-- service_role used by that function bypasses these authenticated-user policies.
drop policy if exists "Authenticated users can upload own QR PDFs" on storage.objects;
drop policy if exists "Authenticated users can update own QR PDFs" on storage.objects;
drop policy if exists "Authenticated users can upload own restaurant menu images" on storage.objects;
drop policy if exists "Authenticated users can update own restaurant menu images" on storage.objects;
drop policy if exists "Users can upload their QR logos" on storage.objects;
drop policy if exists "Users can update their QR logos" on storage.objects;
