# Masuk dan Daftar Tanpa Database

Website mempertahankan **React.js + Vite, tampilan putih, katalog 144 produk, dan fitur sebelumnya**.
Arsip `tanstack_ekraf(1).zip` adalah referensi tugas dan `CHEATSHEET.md` dilampirkan dalam proyek.

## Menjalankan di Windows

1. Ekstrak ZIP, buka folder utama proyek di VS Code.
2. Buka `.env.local` dan lihat `ADMIN_EMAIL` serta `ADMIN_PASSWORD` yang dibuat untuk pengujian lokal. **Ubah kedua nilai itu sebelum website dipublikasikan**. Jangan menaruh kredensial dalam kode frontend, screenshot, atau repository publik.
3. Jalankan:

   ```powershell
   npm install
   npm run dev
   ```
4. Buka http://localhost:3000/masuk. Masukkan email/password dari `.env.local` untuk admin, tanpa tombol login admin khusus.
5. Untuk pengunjung, pilih tab **Daftar**, buat akun, kemudian masuk dengan akun tersebut dari browser yang sama.

## Penyimpanan tanpa database

- **Admin:** endpoint Node `/api/admin` memeriksa `ADMIN_EMAIL` dan `ADMIN_PASSWORD` di server. Password **tidak dikirim** ke HTML/JavaScript frontend. Setelah berhasil, server memberikan cookie `HttpOnly`, `SameSite=Strict`, dan `Secure` pada HTTPS.
- **Pengguna biasa:** pendaftaran disimpan **hanya pada `localStorage` browser yang digunakan**, dengan salt acak dan PBKDF2-SHA256 untuk password (bukan plaintext). Sesi pengguna memakai `sessionStorage`. Tidak ada sinkronisasi akun antarperangkat, email pemulihan, atau verifikasi email.
- **Data produk:** contoh 144 produk dan perubahan dashboard disimpan pada browser secara lokal. Perubahan oleh admin tidak terpublikasi ke browser pengunjung lain. Pada versi tanpa server-side storage memang tidak dapat menyediakan katalog global yang diperbarui oleh admin.
- **Batas keamanan:** akun browser lokal bukan autentikasi server untuk operasi sensitif. Administrator hanya diverifikasi oleh endpoint server, tetapi perubahan katalog di UI adalah demo lokal. Untuk akun multi-perangkat atau CRUD tersinkronisasi, diperlukan penyimpanan server yang persisten.

## Deploy Vercel

1. Push kode ke GitHub, **jangan commit `.env.local`** (sudah dikecualikan di `.gitignore`).
2. Buat project baru di Vercel dengan Framework Preset **Vite**, Build Command `npm run build`, Output `dist`.
3. Atur **Project Settings > Environment Variables** dengan **nilai yang sama** (atau nilai baru yang kuat):
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD` (minimal 12 karakter)
   - `ADMIN_SESSION_SECRET` (minimal 32 karakter acak)
4. Deploy ulang jika nilai environment berubah.
5. Buka `https://domainmu/masuk`, lalu tes login admin, logout, dan daftar akun pengguna lokal.

**Perhatian:** `.env.local` hanya dibaca oleh server development di laptop. Vercel tidak mengambil `.env.local` dari komputer secara otomatis. Environment harus ditambahkan dalam dashboard Vercel.

## Rekomendasi penggunaan

Versi ini sesuai untuk prototipe, demonstrasi atau lomba dengan user storage lokal. Jangan gunakan sebagai layanan akun lintas-perangkat atau marketplace aktif sampai ada penyimpanan dan otorisasi server untuk data bisnis.
