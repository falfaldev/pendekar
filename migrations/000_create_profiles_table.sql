-- ============================================================
-- STEP 0: Jalankan file ini PERTAMA sebelum migration lainnya
-- Buat tabel profiles yang terhubung ke auth.users Supabase
-- ============================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'Pengguna',
  age integer not null default 16,
  gender text not null default 'Laki-laki',
  points integer not null default 0,
  xp integer not null default 0,
  level integer not null default 1,
  streak integer not null default 1,
  last_active_date date not null default current_date,
  role text not null default 'user',
  avatar_url text not null default '',
  created_at timestamptz not null default timezone('utc', now())
);

-- Aktifkan Row Level Security
alter table public.profiles enable row level security;

-- Policy: semua orang bisa baca profil
create policy "Allow public view for profiles" on public.profiles
  for select using (true);

-- Policy: user hanya bisa insert profil miliknya sendiri
create policy "Allow insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Policy: user hanya bisa update profil miliknya sendiri
create policy "Allow update for users on their own profile" on public.profiles
  for update using (auth.uid() = id);

-- Policy: admin bisa kelola semua profil
create policy "Allow admins to manage all profiles" on public.profiles
  for all using (
    exists (
      select 1 from public.profiles p2
      where p2.id = auth.uid() and p2.role = 'admin'
    )
  );

-- Trigger: otomatis buat profil saat user baru daftar
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
    'user',
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
