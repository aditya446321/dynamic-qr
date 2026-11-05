-- Run with Supabase's local database test harness after migrations.
begin;
select plan(5);
select has_table('public', 'public_menu_qr_codes', 'public menu projection exists');
select ok(has_table_privilege('anon', 'public.public_menu_qr_codes', 'SELECT'), 'anon can read the public menu projection');
select ok(has_column_privilege('anon', 'public.qr_codes', 'payload', 'SELECT'), 'anon can read menu payloads');
select ok(not has_column_privilege('anon', 'public.qr_codes', 'user_id', 'SELECT'), 'anon cannot read owner IDs');
select ok(not has_column_privilege('anon', 'public.qr_codes', 'target_url', 'SELECT'), 'anon cannot read redirect destinations');
select * from finish();
rollback;
