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

  -- Record one event per threshold crossing, not one write per blocked request.
  if v_count = p_limit + 1 then
    insert into private.qr_scan_abuse_events(scope,key_hash,slug,request_count)
    values (p_scope,p_key_hash,left(p_slug,32),v_count);
  end if;

  if mod(hashtextextended(p_key_hash,0) & 9223372036854775807,100)=0 then
    delete from private.qr_scan_rate_limits where window_start < now() - interval '2 hours';
    delete from private.qr_scan_abuse_events where occurred_at < now() - interval '30 days';
  end if;
  return v_count;
end;
$$;
revoke all on function public.consume_qr_scan_rate_limit(text,text,timestamptz,integer,text) from public, anon, authenticated;
grant execute on function public.consume_qr_scan_rate_limit(text,text,timestamptz,integer,text) to service_role;