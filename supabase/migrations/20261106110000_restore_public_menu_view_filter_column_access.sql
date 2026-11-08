-- The security-invoker public menu view filters on these two columns.
-- Grant only the filter columns needed by the view; RLS still limits anon rows
-- to active restaurant menu records, and the view exposes only id/title/slug/payload.
grant select (qr_type, is_active) on public.qr_codes to anon, authenticated;
