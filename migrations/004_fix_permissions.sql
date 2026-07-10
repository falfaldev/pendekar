-- ============================================================
-- Fix: permission denied for table profiles
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. Grant akses ke role yang dipakai Supabase
grant usage on schema public to postgres, anon, authenticated, service_role;

grant all on all tables in schema public to postgres, service_role;
grant all on all sequences in schema public to postgres, service_role;
grant all on all routines in schema public to postgres, service_role;

-- Untuk user yang sudah login (authenticated)
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;

-- 2. Recreate trigger function dengan izin yang benar
create or replace function public.create_profile_on_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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

-- 3. Pastikan trigger terpasang dengan benar
drop trigger if exists create_profile_on_auth_user_created on auth.users;
create trigger create_profile_on_auth_user_created
  after insert on auth.users
  for each row execute function public.create_profile_on_auth_user_created();

-- 4. Buat profile untuk user yang sudah ada di auth tapi belum ada profilenya
insert into public.profiles (
  id, name, age, gender, points, xp, level, streak,
  role, last_active_date, avatar_url, created_at
)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1), 'Pengguna'),
  coalesce((u.raw_user_meta_data->>'age')::integer, 16),
  coalesce(u.raw_user_meta_data->>'gender', 'Laki-laki'),
  0, 0, 1, 1,
  'user',
  current_date,
  '',
  timezone('utc', now())
from auth.users u
where not exists (
  select 1 from public.profiles p where p.id = u.id
);
