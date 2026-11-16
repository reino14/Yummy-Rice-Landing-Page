# Yum Ricebites — Prototype Website (Frontend)

Website statis (HTML + CSS + JavaScript murni), tanpa build step, siap di-deploy ke Vercel.

## Halaman (sesuai dokumen 3.2.x)

| File | Isi |
|---|---|
| `index.html` | 3.2.1 Beranda: hero, "Rice on the go", menu unggulan, teaser promo & lokasi |
| `menu.html` | 3.2.2 Informasi & daftar menu, tombol tambah ke keranjang |
| `kontak.html` | 3.2.3 Lokasi (peta), jam buka (status buka/tutup otomatis, WIB), WhatsApp, Instagram, TikTok |
| `pesan.html` | 3.2.4 Pemesanan online: nama, no. telp, alamat, keranjang produk |
| `promo.html` | 3.2.5 Fitur pendukung: halaman diskon bundling + "Racik paketmu" |

## Edit konten

Semua data toko ada di **`js/data.js`**: alamat, jam buka, kontak, daftar menu, harga, dan paket bundling.
Warna & font ada di bagian `:root` pada `css/style.css`.
Ganti foto di folder `assets/` (menu tanpa foto memakai logo sebagai placeholder).

> Menu selain "Ayam Suwir Pedas/Original", deskripsi, dan harga bundling adalah **contoh**. Sesuaikan dengan produk asli.

## Cara kerja bundling

Semua varian berharga `basePrice` (Rp8.000). Sistem menghitung kombinasi paket termurah dari total pcs di keranjang
(mis. 8 pcs = Paket 5 + Paket 3 = Rp35.000). Tambah/ubah paket di `bundles` pada `data.js`.

## Pemesanan (prototype)

Tidak ada server. Setelah form valid, muncul ringkasan + tombol **Kirim pesanan via WhatsApp** (`wa.me`) yang membawa detail pesanan.
Keranjang tersimpan di `localStorage`. Untuk menyimpan pesanan sungguhan, sambungkan `submit` handler di `js/app.js` (fungsi `initOrder`)
ke Vercel Serverless Function, Google Sheets (Apps Script), atau Formspree.

## Deploy ke Vercel

**Lewat dashboard:** push folder ini ke GitHub → vercel.com → *Add New Project* → import repo → Framework Preset: **Other** → Deploy.

**Lewat CLI:**
```bash
npm i -g vercel
cd ricebites-website
vercel        # preview
vercel --prod # produksi
```

`vercel.json` sudah mengaktifkan clean URL (`/menu` bukan `/menu.html`).

## Uji lokal

```bash
python3 -m http.server 8000   # lalu buka http://localhost:8000
```
