-- Restrict anonymous menu access to the minimum columns required by public menu pages.
-- The view is security-invoker: RLS still applies, and anon only has column-level
-- SELECT grants for the fields projected by this view.
create or replace view public.public_menu_qr_codes
with (security_invoker = true, security_barrier = true)
as
select id, title, slug, payload
from public.qr_codes
where qr_type = 'menu' and is_active is true;

revoke all on table public.qr_codes from anon;
grant select (id, title, slug, payload, qr_type, is_active)
  on table public.qr_codes to anon;
grant select on table public.public_menu_qr_codes to anon;

comment on view public.public_menu_qr_codes is
  'Public-safe projection of active restaurant menu QR records. RLS and column grants apply.';
