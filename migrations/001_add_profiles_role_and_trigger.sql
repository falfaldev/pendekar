begin;

-- Tambahkan kolom role jika belum ada
alter table public.profiles
  add column if not exists role text default 'user';

-- Pastikan profil lama dapat menggunakan role default
update public.profiles
set role = 'user'
where role is null;

-- Pastikan kolom role selalu ada
alter table public.profiles
  alter column role set default 'user';
alter table public.profiles
  alter column role set not null;

-- Tambahkan policy yang dibutuhkan untuk auth-driven profile insert/update
DO $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'Allow public view for profiles'
  ) then
    execute 'create policy "Allow public view for profiles" on public.profiles for select using (true)';
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'Allow insert own profile'
  ) then
    execute 'create policy "Allow insert own profile" on public.profiles for insert with check (auth.uid() = new.id and new.role = ''user'')';
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'Allow update for users on their own profile'
  ) then
    execute 'create policy "Allow update for users on their own profile" on public.profiles for update using (auth.uid() = id)';
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'Allow admins to manage all profiles'
  ) then
    execute 'create policy "Allow admins to manage all profiles" on public.profiles for all using (exists (select 1 from public.profiles where id = auth.uid() and role = ''admin''))';
  end if;
end;
$$;

-- Buat trigger untuk setiap auth user baru agar profile dibuat otomatis
create or replace function public.create_profile_on_auth_user_created()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (
    id, name, age, gender, points, xp, level, streak, role, last_active_date, avatar_url, created_at
  ) values (
    new.id,
    coalesce(split_part(new.email, '@', 1), 'Pengguna'),
    16,
    'Laki-laki',
    0,
    0,
    1,
    1,
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
  for each row
  execute function public.create_profile_on_auth_user_created();

-- Ganti placeholder berikut dengan admin auth user id Anda jika ingin menetapkan role admin
-- update public.profiles set role = 'admin' where id = '<AUTH_USER_ID>';

commit;
