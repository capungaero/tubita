# 🚀 Cara Deploy ke GitHub Pages

## Status Deployment

✅ **Branch `gh-pages` sudah dibuat dan di-push!**

## 🔧 Langkah Aktivasi GitHub Pages

Sekarang Anda perlu mengaktifkan GitHub Pages di repository settings:

### 1. Buka Repository Settings
- Buka: https://github.com/capungaero/tubita
- Klik tab **"Settings"** (di kanan atas)

### 2. Aktifkan GitHub Pages
- Scroll ke bawah sampai bagian **"Pages"** (di sidebar kiri)
- Atau langsung buka: https://github.com/capungaero/tubita/settings/pages

### 3. Configure Source
Di bagian **"Build and deployment"**:
- **Source**: Deploy from a branch
- **Branch**: `gh-pages`
- **Folder**: `/ (root)`
- Klik **"Save"**

### 4. Tunggu Deployment
- GitHub akan mulai build (sekitar 1-2 menit)
- Refresh halaman sampai muncul notifikasi hijau
- Link akan muncul: **`https://capungaero.github.io/tubita/`**

## 📱 URL Aplikasi

Setelah aktif, aplikasi bisa diakses di:

### 🏠 Player (Homepage)
```
https://capungaero.github.io/tubita/
```

### ⚙️ Admin Panel
```
https://capungaero.github.io/tubita/admin.html
```

## 🔄 Update Aplikasi

Jika ada perubahan dan ingin update GitHub Pages:

```bash
# 1. Pastikan di branch gh-pages
git checkout gh-pages

# 2. Merge perubahan dari main (jika ada)
git merge main

# 3. Atau copy file baru dari youtube-player-app/public/
cp -r youtube-player-app/public/* .

# 4. Commit dan push
git add -A
git commit -m "Update aplikasi"
git push origin gh-pages
```

GitHub Pages akan otomatis re-deploy dalam beberapa menit!

## ✅ Verifikasi

Cek status deployment:
1. Buka: https://github.com/capungaero/tubita/deployments
2. Lihat status "github-pages"
3. Klik "View deployment" untuk buka aplikasi

## 🎉 Done!

Aplikasi Anda sekarang **LIVE** dan bisa diakses siapa saja!

### Share Link:
- 🔗 **Player**: https://capungaero.github.io/tubita/
- 🔗 **Admin**: https://capungaero.github.io/tubita/admin.html

## 📝 Catatan

- GitHub Pages gratis untuk public repository
- Domain custom bisa di-setup di Settings > Pages
- SSL/HTTPS otomatis enabled
- Perubahan di branch `gh-pages` auto-deploy
- Build time: ~1-2 menit setiap push

## 🐛 Troubleshooting

Jika aplikasi tidak muncul:
1. Pastikan repository adalah **public**
2. Cek Pages settings sudah menggunakan branch `gh-pages`
3. Tunggu 2-3 menit setelah push
4. Hard refresh browser (Ctrl + Shift + R)
5. Cek console browser untuk error

## 📞 Support

Jika ada masalah, cek:
- https://github.com/capungaero/tubita/actions (GitHub Actions logs)
- https://github.com/capungaero/tubita/deployments (Deployment history)
