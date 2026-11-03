-- Qraft database reference snapshot for a NEW Supabase project.
-- Do not run blindly on the already-configured Qraft project; its migrations are already applied.

create table if not exists public.qr_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) >= 1 and char_length(title) <= 80),
  slug text not null unique check (slug ~ '^[A-Za-z0-9_-]{6,32}$'),
  target_url text null check (target_url is null or target_url ~* '^https?://'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  qr_type text not null default 'website' check (qr_type in ('website','text','email','phone','sms','whatsapp','wifi','vcard','event','location','upi','product','social','pdf','menu','app','review')),
  payload jsonb not null default '{}'::jsonb,
  design jsonb not null default '{}'::jsonb,
  is_dynamic boolean not null default true
);

create table if not exists public.qr_scans (
  id bigint generated always as identity primary key,
  qr_code_id uuid not null references public.qr_codes(id) on delete cascade,
  scanned_at timestamptz not null default now(),
  referrer text null,
  device_type text not null default 'unknown' check (device_type in ('mobile','desktop','tablet','unknown'))
);

create index if not exists qr_codes_user_created_idx on public.qr_codes(user_id, created_at desc);
create index if not exists qr_codes_slug_active_idx on public.qr_codes(slug, is_active);
create index if not exists qr_scans_code_time_idx on public.qr_scans(qr_code_id, scanned_at desc);

alter table public.qr_codes enable row level security;
alter table public.qr_scans enable row level security;
grant select, insert, update, delete on public.qr_codes to authenticated;
grant select on public.qr_codes to anon;
grant select on public.qr_scans to authenticated;

-- Recreate policies safely on a fresh project.
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='qr_codes' and policyname='Owners can create their QR codes') then
    create policy "Owners can create their QR codes" on public.qr_codes for insert to authenticated with check ((select auth.uid()) = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='qr_codes' and policyname='Owners can view their QR codes') then
    create policy "Owners can view their QR codes" on public.qr_codes for select to authenticated using ((select auth.uid()) = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='qr_codes' and policyname='Owners can update their QR codes') then
    create policy "Owners can update their QR codes" on public.qr_codes for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='qr_codes' and policyname='Owners can delete their QR codes') then
    create policy "Owners can delete their QR codes" on public.qr_codes for delete to authenticated using ((select auth.uid()) = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='qr_codes' and policyname='Public can view active restaurant menu QR payloads') then
    create policy "Public can view active restaurant menu QR payloads" on public.qr_codes for select to anon using (qr_type='menu' and is_active=true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='qr_scans' and policyname='Owners can view scans for their QR codes') then
    create policy "Owners can view scans for their QR codes" on public.qr_scans for select to authenticated using (exists (select 1 from public.qr_codes where qr_codes.id=qr_scans.qr_code_id and qr_codes.user_id=(select auth.uid())));
  end if;
end $$;

-- Public buckets used by Qraft. Public read is intentional for QR-linked assets.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types) values
  ('qr-logos','qr-logos',true,1048576,array['image/png','image/jpeg','image/webp']),
  ('qr-pdfs','qr-pdfs',true,20971520,array['application/pdf']),
  ('qr-menu-assets','qr-menu-assets',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='QR logo images are public') then
    create policy "QR logo images are public" on storage.objects for select to anon, authenticated using (bucket_id='qr-logos');
  end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Users can upload their QR logos') then
    create policy "Users can upload their QR logos" on storage.objects for insert to authenticated with check (bucket_id='qr-logos' and (storage.foldername(name))[1]=(select auth.uid())::text);
  end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Users can update their QR logos') then
    create policy "Users can update their QR logos" on storage.objects for update to authenticated using (bucket_id='qr-logos' and (storage.foldername(name))[1]=(select auth.uid())::text) with check (bucket_id='qr-logos' and (storage.foldername(name))[1]=(select auth.uid())::text);
  end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Users can delete their QR logos') then
    create policy "Users can delete their QR logos" on storage.objects for delete to authenticated using (bucket_id='qr-logos' and (storage.foldername(name))[1]=(select auth.uid())::text);
  end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Authenticated users can upload own QR PDFs') then
    create policy "Authenticated users can upload own QR PDFs" on storage.objects for insert to authenticated with check (bucket_id='qr-pdfs' and (storage.foldername(name))[1]=(select auth.uid())::text);
  end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Authenticated users can read own QR PDFs') then
    create policy "Authenticated users can read own QR PDFs" on storage.objects for select to authenticated using (bucket_id='qr-pdfs' and (storage.foldername(name))[1]=(select auth.uid())::text);
  end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Authenticated users can update own QR PDFs') then
    create policy "Authenticated users can update own QR PDFs" on storage.objects for update to authenticated using (bucket_id='qr-pdfs' and (storage.foldername(name))[1]=(select auth.uid())::text) with check (bucket_id='qr-pdfs' and (storage.foldername(name))[1]=(select auth.uid())::text);
  end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Authenticated users can delete own QR PDFs') then
    create policy "Authenticated users can delete own QR PDFs" on storage.objects for delete to authenticated using (bucket_id='qr-pdfs' and (storage.foldername(name))[1]=(select auth.uid())::text);
  end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Authenticated users can upload own restaurant menu images') then
    create policy "Authenticated users can upload own restaurant menu images" on storage.objects for insert to authenticated with check (bucket_id='qr-menu-assets' and (storage.foldername(name))[1]=(select auth.uid())::text);
  end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Authenticated users can read own restaurant menu images') then
    create policy "Authenticated users can read own restaurant menu images" on storage.objects for select to authenticated using (bucket_id='qr-menu-assets' and (storage.foldername(name))[1]=(select auth.uid())::text);
  end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Authenticated users can update own restaurant menu images') then
    create policy "Authenticated users can update own restaurant menu images" on storage.objects for update to authenticated using (bucket_id='qr-menu-assets' and (storage.foldername(name))[1]=(select auth.uid())::text) with check (bucket_id='qr-menu-assets' and (storage.foldername(name))[1]=(select auth.uid())::text);
  end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Authenticated users can delete own restaurant menu images') then
    create policy "Authenticated users can delete own restaurant menu images" on storage.objects for delete to authenticated using (bucket_id='qr-menu-assets' and (storage.foldername(name))[1]=(select auth.uid())::text);
  end if;
end $$;
