# Kids YouTube Player - Aplikasi YouTube Aman untuk Anak 🎥👶

Aplikasi YouTube Player dengan kontrol waktu menonton dan YouTube Data API.

## ✨ Fitur Utama

### 🎬 Video Player
- Memutar video YouTube dari playlist yang dikurasi
- Kontrol Previous/Next untuk navigasi
- Progress bar waktu menonton dengan warna indikator
- Auto-play video berikutnya

### 👨‍💼 Admin Panel (Tampilan YouTube)
- **Grid Layout** dengan thumbnail dari YouTube Data API
- **Informasi Lengkap**: Judul, Channel, Durasi, Views
- **Drag & Drop**: Ubah urutan video (▲▼)
- **CRUD Operations**: Tambah/Hapus video mudah

### ⏰ Pembatasan Waktu
- Set batas waktu menonton (menit)
- Peringatan otomatis sebelum waktu habis
- Password protection untuk unlock
- Visual progress bar (Hijau → Orange → Merah)

### 🔐 YouTube Data API Integration
- **API Key**: `AIzaSyC7Ou0iVZZyf3hu1UmQYBdOwqCjVPbl4n8`
- Auto-fetch video details (title, thumbnail, duration, views, channel)
- High-quality thumbnails (maxres)
- Safe search enabled

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Jalankan aplikasi
npm start
```

Aplikasi berjalan di `http://localhost:8080`

## 📖 Cara Pakai

### Admin (Orang Tua)
1. Buka `http://localhost:8080/admin.html`
2. **Tambah Video**: Paste URL YouTube → Auto fetch info dari API
3. **Atur Waktu**: Set batas waktu & password
4. **Kelola Playlist**: Ubah urutan, hapus video

### Player (Anak)
1. Buka `http://localhost:8080/index.html`
2. Video otomatis play
3. Gunakan Previous/Next untuk navigasi
4. Minta password dari orang tua jika waktu habis

## 🎯 Video Dummy (8 Video Anak)

1. Baby Shark Dance - Pinkfong
2. Peppa Pig Full Episodes
3. CoComelon Nursery Rhymes
4. Frozen - Let It Go
5. PAW Patrol Rescues
6. Wheels on the Bus
7. Masha and the Bear
8. Thomas & Friends

## 🔧 Teknologi

- **Frontend**: Vanilla JavaScript (ES6 Modules)
- **Player**: YouTube IFrame API
- **Data**: YouTube Data API v3
- **Storage**: LocalStorage
- **Dev Server**: live-server
- **Icons**: Font Awesome 6

## 📁 Struktur File

```
public/
├── index.html          # Player page
├── admin.html          # Admin panel
├── styles.css          # All styles
└── src/
    ├── main.js         # Player logic
    ├── admin.js        # Admin logic
    └── utils/
        └── youtubeApi.js  # YouTube API wrapper
```

## ⚙️ Default Settings

```javascript
{
  timeLimit: 30,        // 30 menit
  password: 'admin123', // Password default
  warningTime: 5        // Peringatan 5 menit sebelumnya
}
```

## 🌟 Fitur YouTube API

- ✅ Get video details (title, thumbnail, duration, stats)
- ✅ Extract video ID from URL
- ✅ Format duration (PT1H2M10S → 1:02:10)
- ✅ Format view count (1234567 → 1.2M)
- ✅ High-quality thumbnails
- ✅ Channel information

## 📝 API Functions

```javascript
// Get video details
const video = await getVideoDetails('XqZsoesa55w');

// Search videos
const results = await searchVideos('baby shark', 10);

// Extract video ID
const id = extractVideoId('https://youtu.be/XqZsoesa55w');

// Format duration
const formatted = formatDuration('PT2M17S'); // "2:17"
```

## 🚀 Deploy ke Git

```bash
# Add all files
git add .

# Commit changes
git commit -m "Add YouTube Data API integration"

# Push to GitHub
git push origin main
```

## 👨‍💻 Author

**Capungaero**
- GitHub: [@capungaero](https://github.com/capungaero)
- Repository: [tubita](https://github.com/capungaero/tubita)

---

**Selamat Menonton dengan Aman! 🎉**
