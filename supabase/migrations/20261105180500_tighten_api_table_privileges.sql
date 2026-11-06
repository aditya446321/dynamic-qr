-- Remove non-row-scoped table privileges that RLS does not protect.
revoke truncate, references, trigger on public.qr_codes from authenticated;
revoke insert, update, truncate, references, trigger on public.qr_scans from anon, authenticated;
revoke insert, update, truncate, references, trigger on public.public_menu_qr_codes from anon, authenticated;
revoke insert, update, truncate, references, trigger on storage.objects from anon;
revoke insert, update, truncate, references, trigger on storage.objects from authenticated;