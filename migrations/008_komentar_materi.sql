-- ============================================================
-- Migration 008: Tabel komentar materi + fix streak update
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. Buat tabel komentar materi
create table if not exists public.komentar_materi (
  id uuid primary key default gen_random_uuid(),
  materi_id uuid not null references public.materi(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  teks text not null check (char_length(teks) > 0 and char_length(teks) <= 1000),
  created_at timestamptz not null default timezone('utc', now())
);

-- 2. Grant akses eksplisit (wajib untuk Supabase)
grant select, insert, delete on public.komentar_materi to authenticated;
grant select on public.komentar_materi to anon;

-- 3. Aktifkan RLS
alter table public.komentar_materi enable row level security;

-- 4. Drop policy lama jika ada, buat ulang
drop policy if exists "Public read komentar" on public.komentar_materi;
drop policy if exists "Users insert own komentar" on public.komentar_materi;
drop policy if exists "Users delete own komentar" on public.komentar_materi;

-- Semua user (termasuk anon) bisa baca komentar
create policy "Public read komentar" on public.komentar_materi
  for select to authenticated, anon
  using (true);

-- User login hanya bisa insert komentar dengan user_id miliknya
create policy "Users insert own komentar" on public.komentar_materi
  for insert to authenticated
  with check (auth.uid() = user_id);

-- User bisa hapus komentar miliknya, admin bisa hapus semua
create policy "Users delete own komentar" on public.komentar_materi
  for delete to authenticated
  using (
    auth.uid() = user_id
    or public.is_admin()
  );

-- 5. Pastikan kolom last_active_date dan streak ada di profiles
alter table public.profiles
  add column if not exists last_active_date date default current_date,
  add column if not exists streak integer default 1;

-- 6. Index untuk performa query komentar per materi
create index if not exists idx_komentar_materi_id
  on public.komentar_materi(materi_id);

create index if not exists idx_komentar_created_at
  on public.komentar_materi(created_at desc);
