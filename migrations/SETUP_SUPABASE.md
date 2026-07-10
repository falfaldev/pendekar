# Panduan Setup Supabase untuk PENDEKAR

## Langkah 1: Buat Proyek Supabase

1. Buka [supabase.com](https://supabase.com) dan buat proyek baru
2. Catat **Project URL** dan **anon/public API key**

## Langkah 2: Isi file `.env`

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Langkah 3: Jalankan Migration SQL

Buka **Supabase Dashboard → SQL Editor**, lalu:

1. Jalankan isi file `migrations/001_add_profiles_role_and_trigger.sql`
2. Jalankan isi file `migrations/002_full_schema.sql`

> Kedua file bisa dijalankan sekaligus atau satu per satu. File `002` sudah mencakup semua tabel, RLS policy, trigger, dan data seed.

## Langkah 4: Buat Storage Bucket

Di **Supabase Dashboard → Storage**:
1. Klik "New bucket"
2. Nama: `materi-assets`
3. Centang "Public bucket"
4. Klik "Save"

Kemudian di **Storage → materi-assets → Policies**, tambahkan:
- **SELECT** (read): `true` (semua bisa baca)
- **INSERT**: `exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')`

## Langkah 5: Set Admin Pertama

Setelah mendaftar akun admin, dapatkan User ID dari **Authentication → Users**, lalu jalankan di SQL Editor:

```sql
update public.profiles set role = 'admin' where id = 'PASTE-AUTH-USER-UUID-HERE';
```

## Langkah 6: Jalankan Aplikasi

```bash
npm install
npm run dev
```

## Struktur Database

| Tabel | Keterangan |
|-------|-----------|
| `profiles` | Data pengguna (extend dari auth.users) |
| `kategori_materi` | Kategori pembelajaran |
| `materi` | Konten materi edukasi |
| `progress_materi` | Progres membaca per user |
| `quiz` | Daftar kuis |
| `quiz_soal` | Soal-soal per kuis |
| `hasil_quiz` | Nilai kuis per user |
| `game` | Daftar game edukasi |
| `game_soal` | Data soal per game (JSONB + levels) |
| `hasil_game` | Hasil bermain per user |
| `game_progress` | Level progress game per user |
| `misi_harian` | Definisi misi harian |
| `progress_misi` | Progres misi per user per tanggal |
| `badge` | Daftar achievement badge |
| `user_badge` | Badge yang sudah dibuka per user |
| `konsultasi` | Tanya-jawab konsultasi |
| `informasi_layanan` | Data puskesmas dan hotline |
| `aktivitas` | Log aktivitas belajar |

## Mode Offline (Tanpa Supabase)

Jika `.env` tidak dikonfigurasi atau URL masih placeholder, aplikasi otomatis menggunakan **localStorage** sebagai database lokal. Data seed sudah tersedia untuk demo.
