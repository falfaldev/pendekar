-- ============================================================
-- Migration 007: Fix Storage Policies untuk PDF viewer
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. Pastikan bucket materi-pdf sudah public
update storage.buckets
set public = true
where id = 'materi-pdf';

-- 2. Pastikan bucket materi-assets sudah public  
update storage.buckets
set public = true
where id = 'materi-assets';

-- 3. Drop policy lama yang mungkin konflik
drop policy if exists "Public read materi-pdf" on storage.objects;
drop policy if exists "Admin upload materi-pdf" on storage.objects;
drop policy if exists "Admin delete materi-pdf" on storage.objects;
drop policy if exists "Authenticated upload materi-pdf" on storage.objects;
drop policy if exists "Authenticated delete materi-pdf" on storage.objects;
drop policy if exists "Authenticated update materi-pdf" on storage.objects;
drop policy if exists "Public read materi-assets" on storage.objects;
drop policy if exists "Admin upload materi-assets" on storage.objects;
drop policy if exists "Admin delete materi-assets" on storage.objects;
drop policy if exists "Authenticated upload materi-assets" on storage.objects;
drop policy if exists "Authenticated delete materi-assets" on storage.objects;

-- 4. Buat ulang policy yang bersih untuk materi-pdf
create policy "Public read materi-pdf"
  on storage.objects for select
  using (bucket_id = 'materi-pdf');

create policy "Authenticated upload materi-pdf"
  on storage.objects for insert
  with check (bucket_id = 'materi-pdf' and auth.role() = 'authenticated');

create policy "Authenticated delete materi-pdf"
  on storage.objects for delete
  using (bucket_id = 'materi-pdf' and auth.role() = 'authenticated');

create policy "Authenticated update materi-pdf"
  on storage.objects for update
  using (bucket_id = 'materi-pdf' and auth.role() = 'authenticated');

-- 5. Buat ulang policy untuk materi-assets
create policy "Public read materi-assets"
  on storage.objects for select
  using (bucket_id = 'materi-assets');

create policy "Authenticated upload materi-assets"
  on storage.objects for insert
  with check (bucket_id = 'materi-assets' and auth.role() = 'authenticated');

create policy "Authenticated delete materi-assets"
  on storage.objects for delete
  using (bucket_id = 'materi-assets' and auth.role() = 'authenticated');
