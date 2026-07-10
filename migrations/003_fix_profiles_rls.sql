-- ============================================================
-- Fix: infinite recursion pada RLS policy tabel profiles
-- Jalankan query ini di Supabase SQL Editor
-- ============================================================

-- Hapus semua policy profiles yang bermasalah
drop policy if exists "Allow public view for profiles" on public.profiles;
drop policy if exists "Allow insert own profile" on public.profiles;
drop policy if exists "Allow update for users on their own profile" on public.profiles;
drop policy if exists "Allow admins to manage all profiles" on public.profiles;

-- Buat function untuk cek role admin (pakai security definer agar
-- tidak trigger RLS dan tidak menyebabkan recursive loop)
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Buat ulang semua policy profiles yang bersih
create policy "profiles_select_all"
  on public.profiles for select
  using (true);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles_delete_admin"
  on public.profiles for delete
  using (public.is_admin());

create policy "profiles_update_admin"
  on public.profiles for update
  using (public.is_admin());

-- Fix juga semua tabel lain yang pakai subquery ke profiles
-- supaya tidak ada recursion dari tabel lain

-- kategori_materi
drop policy if exists "Admin manage kategori" on public.kategori_materi;
create policy "Admin manage kategori" on public.kategori_materi
  for all using (public.is_admin());

-- materi
drop policy if exists "Admin manage materi" on public.materi;
create policy "Admin manage materi" on public.materi
  for all using (public.is_admin());

-- quiz
drop policy if exists "Admin manage quiz" on public.quiz;
create policy "Admin manage quiz" on public.quiz
  for all using (public.is_admin());

-- quiz_soal
drop policy if exists "Admin manage quiz_soal" on public.quiz_soal;
create policy "Admin manage quiz_soal" on public.quiz_soal
  for all using (public.is_admin());

-- game
drop policy if exists "Admin manage game" on public.game;
create policy "Admin manage game" on public.game
  for all using (public.is_admin());

-- game_soal
drop policy if exists "Admin manage game_soal" on public.game_soal;
create policy "Admin manage game_soal" on public.game_soal
  for all using (public.is_admin());

-- misi_harian
drop policy if exists "Admin manage misi_harian" on public.misi_harian;
create policy "Admin manage misi_harian" on public.misi_harian
  for all using (public.is_admin());

-- badge
drop policy if exists "Admin manage badge" on public.badge;
create policy "Admin manage badge" on public.badge
  for all using (public.is_admin());

-- konsultasi
drop policy if exists "Admin manage all konsultasi" on public.konsultasi;
create policy "Admin manage all konsultasi" on public.konsultasi
  for all using (public.is_admin());

-- informasi_layanan
drop policy if exists "Admin manage informasi_layanan" on public.informasi_layanan;
create policy "Admin manage informasi_layanan" on public.informasi_layanan
  for all using (public.is_admin());

-- aktivitas (admin bisa baca semua log)
drop policy if exists "Admin read all aktivitas" on public.aktivitas;
create policy "Admin read all aktivitas" on public.aktivitas
  for select using (public.is_admin());

-- hasil_quiz (admin bisa baca semua)
drop policy if exists "Admin read all hasil_quiz" on public.hasil_quiz;
create policy "Admin read all hasil_quiz" on public.hasil_quiz
  for select using (public.is_admin());

-- hasil_game (admin bisa baca semua)
drop policy if exists "Admin read all hasil_game" on public.hasil_game;
create policy "Admin read all hasil_game" on public.hasil_game
  for select using (public.is_admin());

-- progress_materi (admin bisa baca semua)
drop policy if exists "Admin read all progress_materi" on public.progress_materi;
create policy "Admin read all progress_materi" on public.progress_materi
  for select using (public.is_admin());

-- user_badge (admin bisa baca semua)
drop policy if exists "Admin read all badges" on public.user_badge;
create policy "Admin read all badges" on public.user_badge
  for select using (public.is_admin());
