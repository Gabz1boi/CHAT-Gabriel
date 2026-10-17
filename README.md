# Horas Ekraf Samosir

Website katalog ekonomi kreatif Samosir berbasis React.js + Vite. Desain berlatar putih, 8 subsektor, 144 produk contoh dengan gambar SVG lokal, dan animasi. Kredit: **Gabriel Ignasius Sinaga**.

## Jalankan

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`. Untuk autentikasi admin, gunakan nilai `ADMIN_EMAIL`/`ADMIN_PASSWORD` di **`.env.local`**. Pengguna biasa dapat memilih **Daftar** di halaman `/masuk`. Tidak perlu Supabase atau database. Login admin berlangsung melalui endpoint server `/api/admin`.

## Deploy

Build `npm run build`, output `dist`, preset Vercel `Vite`. Isi ketiga variabel admin pada Environment Variables Vercel. **Jangan commit `.env.local`.**

Baca [AUTH_SETUP.md](AUTH_SETUP.md) untuk petunjuk lengkap, batasan akun browser lokal, dan pengaturan Vercel. Baca [ASSETS.md](ASSETS.md) untuk atribusi foto dan [EVALUATION.md](EVALUATION.md) untuk hasil pengujian.
