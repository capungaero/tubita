# Tubita - Safe YouTube Player for Kids

Aplikasi pemutar YouTube yang aman untuk anak-anak dengan kontrol orang tua.

## Fitur

1. **Pemutar Video YouTube** - Memutar video YouTube berdasarkan daftar yang dimasukkan admin
2. **Kontrol Terbatas** - Video yang diputar tidak memiliki tombol pencarian atau akses ke video lain
3. **Panel Admin** - Halaman admin untuk:
   - Menambah/menghapus video dari daftar putar
   - Mengatur batas waktu menonton
   - Mengubah password admin
4. **Pembatasan Waktu** - Jika waktu habis, tampilkan peringatan dan memerlukan password admin untuk melanjutkan

## Cara Menggunakan

### Membuka Aplikasi

1. Buka file `index.html` di web browser
2. Default password admin: `admin123`

### Menambahkan Video (Admin)

1. Klik tombol "⚙️ Admin" di pojok kanan atas
2. Masukkan password admin
3. Di bagian "Kelola Video":
   - Masukkan YouTube Video ID (bagian dari URL setelah `v=`)
   - Masukkan judul video
   - Klik "Tambah Video"

### Mengatur Batas Waktu

1. Buka panel admin
2. Di bagian "Pengaturan Waktu", masukkan batas waktu dalam menit
3. Klik "Simpan Batas Waktu"

### Mengubah Password Admin

1. Buka panel admin
2. Di bagian "Password Admin":
   - Masukkan password saat ini
   - Masukkan password baru (minimal 4 karakter)
   - Klik "Ubah Password"

## Teknologi

- HTML5
- CSS3
- JavaScript (Vanilla JS)
- YouTube IFrame API
- Local Storage untuk penyimpanan data

## Keamanan

- Tidak ada akses ke fitur pencarian YouTube
- Tidak ada tombol untuk membuka video lain
- Kontrol keyboard YouTube dinonaktifkan
- Video terkait tidak ditampilkan
- Password diperlukan untuk:
  - Mengakses panel admin
  - Melanjutkan menonton setelah waktu habis

## Catatan

- Data disimpan di Local Storage browser
- Password default: `admin123` (segera ubah setelah instalasi pertama)
- Aplikasi harus dibuka melalui web server atau protokol HTTP/HTTPS untuk YouTube API berfungsi dengan baik
