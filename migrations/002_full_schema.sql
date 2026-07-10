-- ============================================================
-- PENDEKAR - Full Database Schema for Supabase
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

begin;

-- ============================================================
-- STEP 1: PROFILES TABLE (extend existing)
-- ============================================================
alter table public.profiles
  add column if not exists age integer default 16,
  add column if not exists gender text default 'Laki-laki',
  add column if not exists points integer default 0,
  add column if not exists xp integer default 0,
  add column if not exists level integer default 1,
  add column if not exists streak integer default 1,
  add column if not exists last_active_date date default current_date,
  add column if not exists role text default 'user',
  add column if not exists avatar_url text default '',
  add column if not exists name text;

alter table public.profiles alter column role set default 'user';
alter table public.profiles alter column role set not null;

-- ============================================================
-- STEP 2: KATEGORI MATERI
-- ============================================================
create table if not exists public.kategori_materi (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  slug text not null unique,
  deskripsi text not null default '',
  created_at timestamptz default timezone('utc', now())
);

alter table public.kategori_materi enable row level security;

drop policy if exists "Public read kategori" on public.kategori_materi;
create policy "Public read kategori" on public.kategori_materi
  for select using (true);

drop policy if exists "Admin manage kategori" on public.kategori_materi;
create policy "Admin manage kategori" on public.kategori_materi
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );


-- ============================================================
-- STEP 3: MATERI (LEARNING MATERIALS)
-- ============================================================
create table if not exists public.materi (
  id uuid primary key default gen_random_uuid(),
  kategori_id uuid references public.kategori_materi(id) on delete set null,
  judul text not null,
  slug text not null unique,
  deskripsi text not null default '',
  konten text not null default '',
  video_url text,
  pdf_url text,
  infographic_url text,
  thumbnail_url text,
  xp_reward integer not null default 50,
  created_at timestamptz default timezone('utc', now())
);

alter table public.materi enable row level security;

drop policy if exists "Public read materi" on public.materi;
create policy "Public read materi" on public.materi
  for select using (true);

drop policy if exists "Admin manage materi" on public.materi;
create policy "Admin manage materi" on public.materi
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- STEP 4: PROGRESS MATERI
-- ============================================================
create table if not exists public.progress_materi (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  materi_id uuid not null references public.materi(id) on delete cascade,
  completed boolean not null default false,
  completed_at timestamptz,
  unique(user_id, materi_id)
);

alter table public.progress_materi enable row level security;

drop policy if exists "Users read own progress_materi" on public.progress_materi;
create policy "Users read own progress_materi" on public.progress_materi
  for select using (auth.uid() = user_id);

drop policy if exists "Users upsert own progress_materi" on public.progress_materi;
create policy "Users upsert own progress_materi" on public.progress_materi
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users update own progress_materi" on public.progress_materi;
create policy "Users update own progress_materi" on public.progress_materi
  for update using (auth.uid() = user_id);

drop policy if exists "Admin read all progress_materi" on public.progress_materi;
create policy "Admin read all progress_materi" on public.progress_materi
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );


-- ============================================================
-- STEP 5: QUIZ & QUIZ SOAL
-- ============================================================
create table if not exists public.quiz (
  id uuid primary key default gen_random_uuid(),
  materi_id uuid references public.materi(id) on delete set null,
  judul text not null,
  deskripsi text not null default '',
  xp_reward integer not null default 100,
  points_reward integer not null default 50,
  created_at timestamptz default timezone('utc', now())
);

alter table public.quiz enable row level security;

drop policy if exists "Public read quiz" on public.quiz;
create policy "Public read quiz" on public.quiz for select using (true);

drop policy if exists "Admin manage quiz" on public.quiz;
create policy "Admin manage quiz" on public.quiz
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create table if not exists public.quiz_soal (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quiz(id) on delete cascade,
  pertanyaan text not null,
  opsi_a text not null,
  opsi_b text not null,
  opsi_c text not null default '',
  opsi_d text not null default '',
  jawaban_benar text not null check (jawaban_benar in ('A','B','C','D')),
  created_at timestamptz default timezone('utc', now())
);

alter table public.quiz_soal enable row level security;

drop policy if exists "Public read quiz_soal" on public.quiz_soal;
create policy "Public read quiz_soal" on public.quiz_soal for select using (true);

drop policy if exists "Admin manage quiz_soal" on public.quiz_soal;
create policy "Admin manage quiz_soal" on public.quiz_soal
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- STEP 6: HASIL QUIZ
-- ============================================================
create table if not exists public.hasil_quiz (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  quiz_id uuid not null references public.quiz(id) on delete cascade,
  skor integer not null default 0,
  xp_earned integer not null default 0,
  points_earned integer not null default 0,
  completed_at timestamptz default timezone('utc', now()),
  unique(user_id, quiz_id)
);

alter table public.hasil_quiz enable row level security;

drop policy if exists "Users read own hasil_quiz" on public.hasil_quiz;
create policy "Users read own hasil_quiz" on public.hasil_quiz
  for select using (auth.uid() = user_id);

drop policy if exists "Users insert own hasil_quiz" on public.hasil_quiz;
create policy "Users insert own hasil_quiz" on public.hasil_quiz
  for insert with check (auth.uid() = user_id);

drop policy if exists "Admin read all hasil_quiz" on public.hasil_quiz;
create policy "Admin read all hasil_quiz" on public.hasil_quiz
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );


-- ============================================================
-- STEP 7: GAME & GAME SOAL
-- ============================================================
create table if not exists public.game (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  tipe text not null check (tipe in ('benar_salah','memory','drag_drop','tebak_gambar','puzzle')),
  deskripsi text not null default '',
  xp_reward integer not null default 80,
  points_reward integer not null default 40,
  created_at timestamptz default timezone('utc', now())
);

alter table public.game enable row level security;

drop policy if exists "Public read game" on public.game;
create policy "Public read game" on public.game for select using (true);

drop policy if exists "Admin manage game" on public.game;
create policy "Admin manage game" on public.game
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create table if not exists public.game_soal (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.game(id) on delete cascade,
  data jsonb not null default '{}',
  levels jsonb,
  created_at timestamptz default timezone('utc', now()),
  unique(game_id)
);

alter table public.game_soal enable row level security;

drop policy if exists "Public read game_soal" on public.game_soal;
create policy "Public read game_soal" on public.game_soal for select using (true);

drop policy if exists "Admin manage game_soal" on public.game_soal;
create policy "Admin manage game_soal" on public.game_soal
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- STEP 8: HASIL GAME & GAME PROGRESS
-- ============================================================
create table if not exists public.hasil_game (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_id uuid not null references public.game(id) on delete cascade,
  skor integer not null default 0,
  level integer not null default 1,
  xp_earned integer not null default 0,
  points_earned integer not null default 0,
  completed_at timestamptz default timezone('utc', now())
);

alter table public.hasil_game enable row level security;

drop policy if exists "Users read own hasil_game" on public.hasil_game;
create policy "Users read own hasil_game" on public.hasil_game
  for select using (auth.uid() = user_id);

drop policy if exists "Users insert own hasil_game" on public.hasil_game;
create policy "Users insert own hasil_game" on public.hasil_game
  for insert with check (auth.uid() = user_id);

drop policy if exists "Admin read all hasil_game" on public.hasil_game;
create policy "Admin read all hasil_game" on public.hasil_game
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create table if not exists public.game_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_id uuid not null references public.game(id) on delete cascade,
  current_level integer not null default 1,
  completed_levels integer not null default 0,
  max_level integer not null default 3,
  completed boolean not null default false,
  updated_at timestamptz default timezone('utc', now()),
  unique(user_id, game_id)
);

alter table public.game_progress enable row level security;

drop policy if exists "Users manage own game_progress" on public.game_progress;
create policy "Users manage own game_progress" on public.game_progress
  for all using (auth.uid() = user_id);


-- ============================================================
-- STEP 9: MISI HARIAN & PROGRESS MISI
-- ============================================================
create table if not exists public.misi_harian (
  id uuid primary key default gen_random_uuid(),
  deskripsi text not null,
  tipe text not null check (tipe in ('baca_materi','kerjakan_quiz','main_game','login')),
  target_count integer not null default 1,
  points_reward integer not null default 10,
  created_at timestamptz default timezone('utc', now())
);

alter table public.misi_harian enable row level security;

drop policy if exists "Public read misi_harian" on public.misi_harian;
create policy "Public read misi_harian" on public.misi_harian for select using (true);

drop policy if exists "Admin manage misi_harian" on public.misi_harian;
create policy "Admin manage misi_harian" on public.misi_harian
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create table if not exists public.progress_misi (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  misi_id uuid not null references public.misi_harian(id) on delete cascade,
  current_count integer not null default 0,
  completed boolean not null default false,
  tanggal date not null default current_date,
  unique(user_id, misi_id, tanggal)
);

alter table public.progress_misi enable row level security;

drop policy if exists "Users manage own progress_misi" on public.progress_misi;
create policy "Users manage own progress_misi" on public.progress_misi
  for all using (auth.uid() = user_id);

-- ============================================================
-- STEP 10: BADGE & USER BADGE
-- ============================================================
create table if not exists public.badge (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  deskripsi text not null default '',
  icon text not null default 'stars',
  syarat_tipe text not null check (syarat_tipe in ('materi_count','quiz_count','game_count','quiz_perfect_score')),
  syarat_value integer not null default 1,
  created_at timestamptz default timezone('utc', now())
);

alter table public.badge enable row level security;

drop policy if exists "Public read badge" on public.badge;
create policy "Public read badge" on public.badge for select using (true);

drop policy if exists "Admin manage badge" on public.badge;
create policy "Admin manage badge" on public.badge
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create table if not exists public.user_badge (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_id uuid not null references public.badge(id) on delete cascade,
  unlocked_at timestamptz default timezone('utc', now()),
  unique(user_id, badge_id)
);

alter table public.user_badge enable row level security;

drop policy if exists "Users read own badges" on public.user_badge;
create policy "Users read own badges" on public.user_badge
  for select using (auth.uid() = user_id);

drop policy if exists "Users insert own badges" on public.user_badge;
create policy "Users insert own badges" on public.user_badge
  for insert with check (auth.uid() = user_id);

drop policy if exists "Admin read all badges" on public.user_badge;
create policy "Admin read all badges" on public.user_badge
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );


-- ============================================================
-- STEP 11: KONSULTASI
-- ============================================================
create table if not exists public.konsultasi (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  pertanyaan text not null,
  jawaban text,
  status text not null default 'pending' check (status in ('pending','answered')),
  admin_id uuid references public.profiles(id) on delete set null,
  ditanyakan_at timestamptz default timezone('utc', now()),
  dijawab_at timestamptz
);

alter table public.konsultasi enable row level security;

drop policy if exists "Users read own konsultasi" on public.konsultasi;
create policy "Users read own konsultasi" on public.konsultasi
  for select using (auth.uid() = user_id);

drop policy if exists "Users insert own konsultasi" on public.konsultasi;
create policy "Users insert own konsultasi" on public.konsultasi
  for insert with check (auth.uid() = user_id);

drop policy if exists "Admin manage all konsultasi" on public.konsultasi;
create policy "Admin manage all konsultasi" on public.konsultasi
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- STEP 12: INFORMASI LAYANAN
-- ============================================================
create table if not exists public.informasi_layanan (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  tipe text not null check (tipe in ('puskesmas','rumah_sakit','hotline')),
  alamat text,
  telepon text,
  jam_layanan text,
  koordinat_lokasi text,
  created_at timestamptz default timezone('utc', now())
);

alter table public.informasi_layanan enable row level security;

drop policy if exists "Public read informasi_layanan" on public.informasi_layanan;
create policy "Public read informasi_layanan" on public.informasi_layanan
  for select using (true);

drop policy if exists "Admin manage informasi_layanan" on public.informasi_layanan;
create policy "Admin manage informasi_layanan" on public.informasi_layanan
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- STEP 13: AKTIVITAS LOG
-- ============================================================
create table if not exists public.aktivitas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tipe_aktivitas text not null,
  detail text not null default '',
  created_at timestamptz default timezone('utc', now())
);

alter table public.aktivitas enable row level security;

drop policy if exists "Users read own aktivitas" on public.aktivitas;
create policy "Users read own aktivitas" on public.aktivitas
  for select using (auth.uid() = user_id);

drop policy if exists "Users insert own aktivitas" on public.aktivitas;
create policy "Users insert own aktivitas" on public.aktivitas
  for insert with check (auth.uid() = user_id);

drop policy if exists "Admin read all aktivitas" on public.aktivitas;
create policy "Admin read all aktivitas" on public.aktivitas
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );


-- ============================================================
-- STEP 14: PROFILES RLS POLICIES (fix from migration 001)
-- ============================================================
drop policy if exists "Allow public view for profiles" on public.profiles;
drop policy if exists "Allow insert own profile" on public.profiles;
drop policy if exists "Allow update for users on their own profile" on public.profiles;
drop policy if exists "Allow admins to manage all profiles" on public.profiles;

create policy "Allow public view for profiles" on public.profiles
  for select using (true);

create policy "Allow insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Allow update for users on their own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Allow admins to manage all profiles" on public.profiles
  for all using (
    exists (select 1 from public.profiles p2 where p2.id = auth.uid() and p2.role = 'admin')
  );

-- ============================================================
-- STEP 15: AUTO-CREATE PROFILE TRIGGER (update from 001)
-- ============================================================
create or replace function public.create_profile_on_auth_user_created()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (
    id, name, age, gender, points, xp, level, streak,
    role, last_active_date, avatar_url, created_at
  ) values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1),
      'Pengguna'
    ),
    coalesce((new.raw_user_meta_data->>'age')::integer, 16),
    coalesce(new.raw_user_meta_data->>'gender', 'Laki-laki'),
    0, 0, 1, 1,
    coalesce(new.raw_user_meta_data->>'role', 'user'),
    current_date,
    '',
    timezone('utc', now())
  ) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists create_profile_on_auth_user_created on auth.users;
create trigger create_profile_on_auth_user_created
  after insert on auth.users
  for each row execute function public.create_profile_on_auth_user_created();


-- ============================================================
-- STEP 16: SEED DATA - Kategori Materi
-- ============================================================
insert into public.kategori_materi (id, nama, slug, deskripsi) values
  ('10000000-0000-0000-0000-000000000001', 'Apa itu HIV?', 'apa-itu-hiv', 'Pahami dasar-dasar virus HIV, cara kerja, dan perkembangannya.'),
  ('10000000-0000-0000-0000-000000000002', 'Apa itu AIDS?', 'apa-itu-aids', 'Pelajari fase lanjut dari infeksi HIV dan bagaimana menjaga kesehatan tubuh.'),
  ('10000000-0000-0000-0000-000000000003', 'Cara Penularan', 'cara-penularan', 'Mitos vs Fakta seputar bagaimana HIV ditularkan antar manusia.'),
  ('10000000-0000-0000-0000-000000000004', 'Cara Pencegahan', 'cara-pencegahan', 'Langkah pencegahan HIV seperti metode ABCDE dan penanganan medis.'),
  ('10000000-0000-0000-0000-000000000005', 'Stigma & Diskriminasi', 'stigma-diskriminasi', 'Mari hapus diskriminasi terhadap Orang dengan HIV/AIDS (ODHIV).'),
  ('10000000-0000-0000-0000-000000000006', 'Tes HIV', 'tes-hiv', 'Mengenal metode pemeriksaan VCT, kerahasiaan, dan pentingnya tes sejak dini.'),
  ('10000000-0000-0000-0000-000000000007', 'Pengobatan (ART)', 'pengobatan-art', 'Mengenal Terapi Antiretroviral untuk menghambat virus dan menjaga imun tubuh.')
on conflict (slug) do nothing;

-- ============================================================
-- STEP 17: SEED DATA - Materi
-- ============================================================
insert into public.materi (id, kategori_id, judul, slug, deskripsi, konten, video_url, thumbnail_url, xp_reward) values
(
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'Pengenalan Dasar HIV',
  'pengenalan-dasar-hiv',
  'HIV (Human Immunodeficiency Virus) adalah virus yang menyerang sel kekebalan tubuh, khususnya sel CD4.',
  E'### Apa itu HIV?\n\n**HIV** adalah singkatan dari **Human Immunodeficiency Virus**. Virus ini menyerang sistem kekebalan tubuh manusia, khususnya sel-sel darah putih yang disebut sel **CD4** atau sel T helper.\n\n#### Hal Penting:\n1. **HIV bukan berarti langsung AIDS**. Seseorang dapat hidup dengan HIV selama bertahun-tahun tanpa menunjukkan gejala.\n2. **Tidak ada obat penawar** untuk membunuh virus sepenuhnya, tetapi ada obat **Antiretroviral (ART)** yang sangat efektif menekan jumlah virus.\n3. **Mendeteksi dini** lewat tes HIV adalah cara terbaik untuk melindungi dirimu dan orang lain.',
  'https://www.youtube.com/embed/FDVNdn0CoKI',
  'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&q=80&w=400',
  50
),
(
  '20000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000003',
  'Mitos vs Fakta Cara Penularan HIV',
  'mitos-vs-fakta-penularan',
  'Pelajari bagaimana HIV benar-benar menular dan hilangkan mitos keliru yang sering beredar.',
  E'### Bagaimana HIV Menular?\n\nHIV ditularkan melalui pertukaran berbagai cairan tubuh dari orang yang terinfeksi, seperti **darah, ASI, air mani, dan cairan vagina**.\n\n#### Fakta Penularan:\n- **Hubungan Seksual Tanpa Pelindung**\n- **Jarum Suntik Bergantian**\n- **Ibu ke Bayi** selama kehamilan atau menyusui\n\n#### TIDAK Menularkan HIV:\n- Gigitan nyamuk\n- Bersalaman atau berpelukan\n- Menggunakan toilet umum bersama\n- Berbagi kolam renang atau alat makan',
  'https://www.youtube.com/embed/UrMmv3Z5XvM',
  'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=400',
  50
),
(
  '20000000-0000-0000-0000-000000000003',
  '10000000-0000-0000-0000-000000000004',
  'Konsep Pencegahan ABCDE',
  'konsep-pencegahan-abcde',
  'Memahami metode ABCDE yang efektif untuk melindungi diri dan sesama dari infeksi HIV.',
  E'### Lindungi Dirimu: Konsep ABCDE\n\n#### A - Abstinence (Absen Seks)\nBagi remaja yang belum menikah, langkah paling aman adalah tidak melakukan hubungan seksual.\n\n#### B - Be Faithful (Setia pada Pasangan)\nSetialah pada satu pasangan yang sah.\n\n#### C - Condom (Gunakan Kondom)\nGunakan kondom secara konsisten dalam setiap hubungan seksual yang berisiko.\n\n#### D - Don''t Use Drugs (Hindari Narkoba)\nHindari penyalahgunaan narkoba, terutama jenis suntik.\n\n#### E - Education (Edukasi Diri)\nCari informasi yang benar mengenai HIV/AIDS seperti di platform PENDEKAR ini!',
  'https://www.youtube.com/embed/5g13E14x8OQ',
  'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=400',
  50
)
on conflict (slug) do nothing;


-- ============================================================
-- STEP 18: SEED DATA - Quiz & Soal
-- ============================================================
insert into public.quiz (id, materi_id, judul, deskripsi, xp_reward, points_reward) values
(
  '30000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  'Kuis Dasar HIV',
  'Uji pengetahuan dasarmu tentang pengertian, efek, dan penargetan virus HIV pada kekebalan tubuh.',
  100, 50
),
(
  '30000000-0000-0000-0000-000000000002',
  '20000000-0000-0000-0000-000000000002',
  'Kuis Penularan & Mitos',
  'Apakah kamu sudah bisa membedakan mana fakta penularan dan mana mitos keliru? Ayo buktikan!',
  120, 60
)
on conflict do nothing;

insert into public.quiz_soal (quiz_id, pertanyaan, opsi_a, opsi_b, opsi_c, opsi_d, jawaban_benar) values
('30000000-0000-0000-0000-000000000001', 'Apakah kepanjangan dari singkatan HIV?', 'Human Immunodeficiency Virus', 'Human Immune-deficiency Variant', 'Helper Immunoglobulin Virus', 'Healthy Immunity Virus', 'A'),
('30000000-0000-0000-0000-000000000001', 'Sel kekebalan tubuh mana yang diserang secara spesifik oleh virus HIV?', 'Sel Darah Merah (Eritrosit)', 'Keping Darah (Trombosit)', 'Sel CD4 (T Helper)', 'Sel Saraf (Neuron)', 'C'),
('30000000-0000-0000-0000-000000000001', 'Apakah seseorang yang terinfeksi HIV akan langsung terdiagnosa AIDS?', 'Ya, virus bekerja dalam 24 jam.', 'Tidak, AIDS merupakan fase lanjut yang membutuhkan waktu bertahun-tahun.', 'Tergantung jenis makanan yang dimakan.', 'Ya, jika penderita berumur di bawah 15 tahun.', 'B'),
('30000000-0000-0000-0000-000000000001', 'Obat apa yang diberikan untuk mengendalikan virus HIV pada tubuh penderita?', 'Antibiotik Penicillin', 'Antiretroviral (ART)', 'Paracetamol', 'Vaksin Influenza', 'B'),
('30000000-0000-0000-0000-000000000001', 'Langkah awal terbaik untuk mengetahui apakah seseorang terinfeksi HIV adalah...', 'Melihat perubahan fisik di wajah', 'Melakukan Tes HIV (seperti VCT)', 'Mengecek suhu tubuh setiap hari', 'Membaca ramalan kesehatan online', 'B'),
('30000000-0000-0000-0000-000000000002', 'Manakah cairan tubuh berikut yang TIDAK dapat menularkan HIV?', 'Darah', 'Air Susu Ibu (ASI)', 'Cairan Vagina / Air Mani', 'Keringat & Air Mata', 'D'),
('30000000-0000-0000-0000-000000000002', 'Bersalaman atau berpelukan dengan ODHIV dapat menularkan virus.', 'Benar, virus berpindah lewat udara.', 'Salah, aktivitas tersebut tidak melibatkan pertukaran cairan tubuh yang mengandung virus.', 'Benar, jika penderita sedang berkeringat deras.', 'Benar, jika dilakukan lebih dari 15 menit.', 'B'),
('30000000-0000-0000-0000-000000000002', 'Bagaimana penularan HIV melalui jarum suntik bisa terjadi?', 'Bila jarum suntik digunakan secara steril oleh dokter.', 'Bila jarum suntik dipakai bergantian oleh beberapa orang.', 'Bila jarum suntik terbuat dari bahan besi berkualitas rendah.', 'Bila jarum suntik disentuh di bagian plastiknya.', 'B'),
('30000000-0000-0000-0000-000000000002', 'Apakah gigitan nyamuk dapat menularkan virus HIV?', 'Ya, nyamuk menghisap darah penderita lalu menyuntikkannya kembali.', 'Tidak, virus HIV langsung mati di dalam tubuh nyamuk.', 'Ya, jika nyamuk berjenis Aedes aegypti.', 'Ya, jika digigit di malam hari.', 'B'),
('30000000-0000-0000-0000-000000000002', 'Mengapa pemakaian jarum tindik atau tato secara bergantian berisiko menularkan HIV?', 'Karena jarum tersebut menyentuh lapisan kulit luar.', 'Karena alat tersebut bisa terkontaminasi partikel darah dari orang yang terinfeksi.', 'Karena tinta tato mengandung zat asam tinggi yang disukai virus.', 'Karena rasa sakit saat proses melukai sel pertahanan kulit.', 'B');


-- ============================================================
-- STEP 19: SEED DATA - Games
-- ============================================================
insert into public.game (id, nama, tipe, deskripsi, xp_reward, points_reward) values
('40000000-0000-0000-0000-000000000001', 'Benar atau Salah', 'benar_salah', 'Geser atau tekan tombol untuk menilai kebenaran pernyataan seputar kesehatan seksual dan HIV.', 80, 40),
('40000000-0000-0000-0000-000000000002', 'Memory Card', 'memory', 'Buka kartu dan cari pasangan kata medis yang berkaitan (contoh: ART dengan Pengobatan).', 90, 45),
('40000000-0000-0000-0000-000000000003', 'Drag and Drop', 'drag_drop', 'Tarik kata kunci kesehatan ke kolom kategori yang tepat (Pencegahan, Penularan, atau Aman).', 100, 50),
('40000000-0000-0000-0000-000000000004', 'Tebak Gambar', 'tebak_gambar', 'Amati gambar medis/kesehatan yang ditampilkan, dan jawab nama benda tersebut dengan cepat.', 80, 40),
('40000000-0000-0000-0000-000000000005', 'Puzzle Edukasi', 'puzzle', 'Susun kepingan gambar maskot kesehatan PENDEKAR untuk menampilkan pesan kesehatan rahasia.', 120, 60)
on conflict do nothing;

-- ============================================================
-- STEP 20: SEED DATA - Game Soal
-- ============================================================
insert into public.game_soal (game_id, data, levels) values
(
  '40000000-0000-0000-0000-000000000001',
  '[{"id":"bs-1","statement":"HIV dapat menular melalui berbagi sendok makan dengan penderita.","answer":false,"explanation":"Salah! HIV tidak menular melalui air liur atau peralatan makan bersama."},{"id":"bs-2","statement":"Menggunakan kondom dapat mencegah penularan HIV saat berhubungan seksual.","answer":true,"explanation":"Benar! Kondom bertindak sebagai penghalang fisik masuknya cairan tubuh."}]'::jsonb,
  '[{"level":1,"data":[{"id":"bs-l1-1","statement":"HIV dapat menular melalui berbagi sendok makan.","answer":false,"explanation":"Salah! HIV tidak menular lewat alat makan bersama."},{"id":"bs-l1-2","statement":"Kondom membantu mengurangi risiko penularan HIV.","answer":true,"explanation":"Benar! Kondom memberi penghalang fisik yang efektif."},{"id":"bs-l1-3","statement":"ODHIV yang rutin minum ART bisa tetap sehat.","answer":true,"explanation":"Benar! Pengobatan antiretroviral membantu menjaga kekebalan tubuh."},{"id":"bs-l1-4","statement":"AIDS adalah nama virus HIV.","answer":false,"explanation":"Salah! HIV adalah virus, AIDS adalah kondisi lanjut akibat infeksi."}]},{"level":2,"data":[{"id":"bs-l2-1","statement":"Tes HIV sebaiknya dilakukan sejak dini bila ada risiko paparan.","answer":true,"explanation":"Benar! Deteksi dini membantu penanganan lebih cepat."},{"id":"bs-l2-2","statement":"Berbagi jarum suntik dapat menularkan HIV.","answer":true,"explanation":"Benar! Darah yang tercemar bisa membawa virus."},{"id":"bs-l2-3","statement":"HIV bisa menular lewat berjabat tangan.","answer":false,"explanation":"Salah! HIV tidak menular lewat sentuhan kulit biasa."},{"id":"bs-l2-4","statement":"Diskriminasi terhadap ODHIV memperburuk kesehatan mental mereka.","answer":true,"explanation":"Benar! Dukungan sosial penting untuk kesejahteraan ODHIV."}]},{"level":3,"data":[{"id":"bs-l3-1","statement":"Ibu hamil yang terinfeksi HIV bisa menularkan virus ke bayi tanpa pengobatan.","answer":true,"explanation":"Benar! Pencegahan sejak kehamilan sangat penting."},{"id":"bs-l3-2","statement":"HIV bisa dicegah dengan edukasi dan pengobatan yang tepat.","answer":true,"explanation":"Benar! Edukasi dan ART membantu menekan penularan."},{"id":"bs-l3-3","statement":"HIV bisa menular lewat udara.","answer":false,"explanation":"Salah! HIV tidak menyebar lewat udara."},{"id":"bs-l3-4","statement":"Mencuci tangan membantu mencegah berbagai penyakit.","answer":true,"explanation":"Benar! Kebersihan yang baik penting untuk kesehatan."}]}]'::jsonb
),
(
  '40000000-0000-0000-0000-000000000002',
  '{"pairs":[{"text":"HIV","match":"Virus"},{"text":"ART","match":"Pengobatan"},{"text":"Kondom","match":"Pencegahan"},{"text":"VCT","match":"Konsultasi & Tes"}]}'::jsonb,
  '[{"level":1,"data":{"pairs":[{"text":"HIV","match":"Virus"},{"text":"ART","match":"Pengobatan"},{"text":"Kondom","match":"Pencegahan"},{"text":"VCT","match":"Konsultasi & Tes"}]}},{"level":2,"data":{"pairs":[{"text":"CD4","match":"Sel kekebalan"},{"text":"PrEP","match":"Pencegahan sebelum paparan"},{"text":"Stigma","match":"Diskriminasi"},{"text":"Tes HIV","match":"Deteksi dini"}]}},{"level":3,"data":{"pairs":[{"text":"Viral Load","match":"Jumlah virus"},{"text":"TBC","match":"Penyakit oportunistik"},{"text":"ODHIV","match":"Orang dengan HIV"},{"text":"Konseling","match":"Pendampingan"}]}}]'::jsonb
),
(
  '40000000-0000-0000-0000-000000000003',
  '{"items":[{"text":"Jarum Steril","correctCategory":"Pencegahan"},{"text":"Berpelukan","correctCategory":"Aman"},{"text":"Berjabat tangan","correctCategory":"Aman"},{"text":"Jarum Suntik Bergantian","correctCategory":"Penularan"},{"text":"Transfusi Darah Tercemar","correctCategory":"Penularan"},{"text":"Setia Pada Pasangan","correctCategory":"Pencegahan"}],"categories":["Pencegahan","Penularan","Aman"]}'::jsonb,
  '[{"level":1,"data":{"items":[{"text":"Jarum Steril","correctCategory":"Pencegahan"},{"text":"Berpelukan","correctCategory":"Aman"},{"text":"Jarum Suntik Bergantian","correctCategory":"Penularan"},{"text":"Setia Pada Pasangan","correctCategory":"Pencegahan"}],"categories":["Pencegahan","Penularan","Aman"]}},{"level":2,"data":{"items":[{"text":"Pakai Kondom","correctCategory":"Pencegahan"},{"text":"Berbagi Alat Tato","correctCategory":"Penularan"},{"text":"Ciuman Pipi","correctCategory":"Aman"},{"text":"Tes HIV Rutin","correctCategory":"Pencegahan"}],"categories":["Pencegahan","Penularan","Aman"]}},{"level":3,"data":{"items":[{"text":"Minum ART Teratur","correctCategory":"Pencegahan"},{"text":"Air Susu Ibu","correctCategory":"Penularan"},{"text":"Mengunjungi Puskesmas","correctCategory":"Aman"},{"text":"Berbagi Jarum Tindik","correctCategory":"Penularan"}],"categories":["Pencegahan","Penularan","Aman"]}}]'::jsonb
),
(
  '40000000-0000-0000-0000-000000000004',
  '[{"id":"tg-1","imageUrl":"https://images.unsplash.com/photo-1579684389782-64d84b5e901a?auto=format&fit=crop&q=80&w=400","question":"Apa nama simbol pita merah yang sering melambangkan kepedulian HIV/AIDS?","options":["Pita Merah (Red Ribbon)","Pita Kuning","Pita Kesehatan","Pita Persaudaraan"],"answer":"Pita Merah (Red Ribbon)"},{"id":"tg-2","imageUrl":"https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&q=80&w=400","question":"Metode tes laboratorium terpercaya ini dilakukan untuk mendeteksi antibodi HIV. Apa namanya?","options":["Tes Golongan Darah","Tes VCT / Antibodi HIV","Tes Urin Lengkap","Rontgen Dada"],"answer":"Tes VCT / Antibodi HIV"}]'::jsonb,
  '[{"level":1,"data":[{"id":"tg-l1-1","imageUrl":"https://images.unsplash.com/photo-1579684389782-64d84b5e901a?auto=format&fit=crop&q=80&w=400","question":"Apa nama simbol pita merah untuk dukungan HIV/AIDS?","options":["Pita Merah (Red Ribbon)","Pita Kuning","Pita Kesehatan","Pita Persaudaraan"],"answer":"Pita Merah (Red Ribbon)"},{"id":"tg-l1-2","imageUrl":"https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&q=80&w=400","question":"Tes yang paling tepat untuk mendeteksi HIV adalah...","options":["Tes VCT / Antibodi HIV","Tes Urin","Tes Mata","Tes Gula Darah"],"answer":"Tes VCT / Antibodi HIV"}]},{"level":2,"data":[{"id":"tg-l2-1","imageUrl":"https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=400","question":"Apa yang dilakukan saat seseorang ingin mengetahui status HIV-nya?","options":["Konsultasi dan Tes HIV","Membuang obat","Minum vitamin","Tidur lebih lama"],"answer":"Konsultasi dan Tes HIV"},{"id":"tg-l2-2","imageUrl":"https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=400","question":"Apa peran ART pada pengobatan HIV?","options":["Menghambat perkembangan virus","Membuat virus lebih cepat","Menghilangkan semua gejala","Menulari orang lain"],"answer":"Menghambat perkembangan virus"}]},{"level":3,"data":[{"id":"tg-l3-1","imageUrl":"https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&q=80&w=400","question":"Apa yang dimaksud dengan ODHIV?","options":["Orang Dengan HIV","Organisasi Dokter HIV","Obat Diperlukan HIV","Orang Di Rumah Sakit"],"answer":"Orang Dengan HIV"},{"id":"tg-l3-2","imageUrl":"https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&q=80&w=400","question":"Apa manfaat tes HIV dini?","options":["Penanganan cepat","Membuat HIV lebih parah","Menghilangkan kebutuhan ART","Mengurangi kebersihan"],"answer":"Penanganan cepat"}]}]'::jsonb
),
(
  '40000000-0000-0000-0000-000000000005',
  '{"imageUrl":"https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=400","fact":"Ingat! HIV membutuhkan waktu 5-10 tahun untuk berkembang menjadi AIDS jika tanpa pengobatan. Pengobatan dini menggunakan ART membantu ODHIV hidup sehat dan normal."}'::jsonb,
  '[{"level":1,"data":{"imageUrl":"https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=400","fact":"Pencegahan dini dan edukasi membantu menahan penularan HIV."}},{"level":2,"data":{"imageUrl":"https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&q=80&w=400","fact":"ART membantu menjaga sistem imun tetap kuat dan mengurangi risiko komplikasi."}},{"level":3,"data":{"imageUrl":"https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=400","fact":"Dukungan sosial dan tes rutin membantu ODHIV menjalani hidup lebih sehat."}}]'::jsonb
)
on conflict do nothing;


-- ============================================================
-- STEP 21: SEED DATA - Misi Harian
-- ============================================================
insert into public.misi_harian (id, deskripsi, tipe, target_count, points_reward) values
('50000000-0000-0000-0000-000000000001', 'Baca 1 materi edukasi hari ini', 'baca_materi', 1, 10),
('50000000-0000-0000-0000-000000000002', 'Kerjakan 5 soal quiz pelajaran', 'kerjakan_quiz', 5, 15),
('50000000-0000-0000-0000-000000000003', 'Mainkan 1 game edukasi interaktif', 'main_game', 1, 15),
('50000000-0000-0000-0000-000000000004', 'Login ke dashboard PENDEKAR', 'login', 1, 5)
on conflict do nothing;

-- ============================================================
-- STEP 22: SEED DATA - Badge
-- ============================================================
insert into public.badge (id, nama, deskripsi, icon, syarat_tipe, syarat_value) values
('60000000-0000-0000-0000-000000000001', 'Pemula Cerdas', 'Selesaikan membaca minimal 2 materi pembelajaran.', 'stars', 'materi_count', 2),
('60000000-0000-0000-0000-000000000002', 'Penjelajah HIV', 'Selesaikan membaca semua materi edukasi di aplikasi.', 'verified_user', 'materi_count', 3),
('60000000-0000-0000-0000-000000000003', 'Quiz Master', 'Kerjakan kuis dengan skor 100% sempurna.', 'workspace_premium', 'quiz_perfect_score', 1),
('60000000-0000-0000-0000-000000000004', 'Ksatria Game', 'Mainkan minimal 3 jenis game edukasi yang seru.', 'sports_esports', 'game_count', 3)
on conflict do nothing;

-- ============================================================
-- STEP 23: SEED DATA - Informasi Layanan
-- ============================================================
insert into public.informasi_layanan (nama, tipe, alamat, telepon, jam_layanan, koordinat_lokasi) values
('Puskesmas Kecamatan Tebet', 'puskesmas', 'Jl. Tebet Timur Dalam No.2, Jakarta Selatan', '(021) 8295627', 'Senin - Jumat: 08:00 - 15:00 (Melayani Konseling VCT Gratis)', '-6.2295,106.8485'),
('Puskesmas Kecamatan Menteng', 'puskesmas', 'Jl. Pegangsaan Barat No.14, Menteng, Jakarta Pusat', '(021) 3192323', 'Setiap Hari: 24 Jam (Layanan VCT jam kerja)', '-6.2023,106.8329'),
('Layanan Hotline Kemenkes RI', 'hotline', 'Kementerian Kesehatan Republik Indonesia', '1500-567', 'Layanan Darurat Konseling 24 Jam Bebas Pulsa', ''),
('KPA (Komisi Penanggulangan AIDS) Nasional', 'hotline', 'Jakarta', '(021) 3906323', 'Jam kerja 09:00 - 17:00', '');

-- ============================================================
-- STEP 24: STORAGE BUCKET for materi-assets
-- ============================================================
-- Run this separately in Supabase Storage settings or via API:
-- insert into storage.buckets (id, name, public) values ('materi-assets', 'materi-assets', true) on conflict do nothing;

-- Storage RLS policy (run only if bucket already exists):
-- create policy "Public read materi-assets" on storage.objects for select using (bucket_id = 'materi-assets');
-- create policy "Admin upload materi-assets" on storage.objects for insert with check (bucket_id = 'materi-assets' and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- ============================================================
-- FINAL: To set a user as admin, run:
-- update public.profiles set role = 'admin' where id = '<AUTH_USER_UUID>';
-- ============================================================

commit;
