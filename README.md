# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## Deployment & Supabase setup

1. Copy environment variables:
   - buat file `.env` di root dengan nilai:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
     - `VITE_SUPABASE_STORAGE_BUCKET` (opsional, default: `materi-assets`)

2. Siapkan database Supabase:
   - buat project Supabase.
   - import `database_schema.sql` ke database Postgres.
   - pastikan `auth.users` dan `public.profiles` sudah ada untuk user / admin.

3. Siapkan bucket storage:
   - buat bucket dengan nama yang sama seperti `VITE_SUPABASE_STORAGE_BUCKET` atau gunakan default `materi-assets`.
   - atur bucket menjadi public jika ingin gambar infografis dan thumbnail dapat diakses langsung.

4. Jalankan aplikasi secara lokal:
   - `npm install`
   - `npm run dev` untuk development.
   - `npm run build` untuk memeriksa hasil produksi.
   - `npm run preview` untuk preview build statis.

5. Deploy ke hosting statis:
   - gunakan Vercel, Netlify, Cloudflare Pages atau hosting serupa.
   - pastikan environment variable `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` diatur di dashboard deploy.
   - jangan commit `.env` ke Git karena sudah diabaikan oleh `.gitignore`.

6. Hal penting:
   - semua upload gambar materi menggunakan Supabase Storage.
   - video link menggunakan link eksternal YouTube/Vimeo dan otomatis dinormalisasi.

Jika ingin, saya bisa lanjut membuat skrip inisialisasi Supabase SQL/CLI untuk bucket dan role secara lebih otomatis.
