-- ============================================================
-- Fix: pastikan kolom opsional di tabel materi bisa NULL
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- Kolom-kolom ini opsional, harus nullable
alter table public.materi
  alter column video_url drop not null,
  alter column pdf_url drop not null,
  alter column infographic_url drop not null,
  alter column thumbnail_url drop not null;

-- Pastikan default-nya NULL (bukan string kosong)
alter table public.materi
  alter column video_url set default null,
  alter column pdf_url set default null,
  alter column infographic_url set default null,
  alter column thumbnail_url set default null;

-- Buat storage bucket materi-assets jika belum ada
-- (jalankan ini kalau belum buat bucket manual di dashboard Storage)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'materi-assets',
  'materi-assets',
  true,
  52428800,  -- 50MB limit
  array['image/jpeg','image/png','image/gif','image/webp','image/svg+xml','application/pdf']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 52428800;

-- Policy baca public untuk storage
drop policy if exists "Public read materi-assets" on storage.objects;
create policy "Public read materi-assets"
  on storage.objects for select
  using (bucket_id = 'materi-assets');

-- Policy upload untuk admin
drop policy if exists "Admin upload materi-assets" on storage.objects;
create policy "Admin upload materi-assets"
  on storage.objects for insert
  with check (
    bucket_id = 'materi-assets'
    and auth.role() = 'authenticated'
  );

-- Policy delete untuk admin
drop policy if exists "Admin delete materi-assets" on storage.objects;
create policy "Admin delete materi-assets"
  on storage.objects for delete
  using (
    bucket_id = 'materi-assets'
    and auth.role() = 'authenticated'
  );
