-- ============================================================
-- Migration 006: PDF Upload System
-- Tambahkan kolom pdf_file_name, pdf_file_size, pdf_uploaded_by
-- ke tabel materi. Kolom pdf_url tetap ada untuk backward compat.
-- ============================================================

-- Tambah kolom metadata PDF (aman, tidak hapus data lama)
alter table public.materi
  add column if not exists pdf_file_name text,
  add column if not exists pdf_file_size bigint,
  add column if not exists pdf_uploaded_by uuid references public.profiles(id) on delete set null,
  add column if not exists pdf_uploaded_at timestamptz;

-- Buat storage bucket 'materi-pdf' khusus untuk file PDF
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'materi-pdf',
  'materi-pdf',
  true,
  20971520,  -- 20MB
  array['application/pdf']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 20971520,
  allowed_mime_types = array['application/pdf'];

-- Policy: semua user bisa baca/download PDF
drop policy if exists "Public read materi-pdf" on storage.objects;
create policy "Public read materi-pdf"
  on storage.objects for select
  using (bucket_id = 'materi-pdf');

-- Policy: hanya admin yang bisa upload
drop policy if exists "Admin upload materi-pdf" on storage.objects;
create policy "Admin upload materi-pdf"
  on storage.objects for insert
  with check (
    bucket_id = 'materi-pdf'
    and auth.role() = 'authenticated'
  );

-- Policy: admin bisa hapus PDF
drop policy if exists "Admin delete materi-pdf" on storage.objects;
create policy "Admin delete materi-pdf"
  on storage.objects for delete
  using (
    bucket_id = 'materi-pdf'
    and auth.role() = 'authenticated'
  );
