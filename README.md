# Knowbase

Knowbase adalah knowledge management system (KMS) sederhana untuk menyimpan, merapikan, dan menemukan pengetahuan penting. Aplikasi ini dibuat dengan HTML, CSS, dan JavaScript murni, tanpa framework maupun backend. Seluruh data disimpan di **LocalStorage** perangkat pengguna.

**Demo langsung:** https://moch-rafi-sidiq.github.io/Knowbase/

## Fitur

- **Dashboard** dengan statistik aktif, pengetahuan terbaru, terakhir diperbarui, kategori populer, dan akses cepat.
- **CRUD pengetahuan** lengkap: tambah, lihat detail, edit, hapus, favorit, arsipkan, dan pulihkan.
- **Editor modal** dengan judul wajib, ringkasan, isi, kategori, tag, penghitung kata/karakter, validasi, serta peringatan perubahan yang belum disimpan.
- **Pencarian** di judul, ringkasan, isi, tag, dan nama kategori. Mendukung filter kategori, tag, status favorit, pengurutan, serta reset filter.
- **Tampilan kartu atau daftar** dengan preferensi yang tersimpan.
- **Kategori** dapat dibuat, diubah, dan dihapus. Nama kategori unik tanpa membedakan huruf besar/kecil. Penghapusan kategori tidak menghapus pengetahuan; item terkait menjadi **Tanpa Kategori**.
- **Favorit, Terbaru, dan Arsip** memiliki tampilan dan perilaku tersendiri. Pengetahuan yang diarsipkan tidak muncul di daftar utama.
- **Pengaturan** untuk nama tampilan, ekspor/impor JSON, pemulihan data demo, dan reset data dengan konfirmasi.
- **Impor** memvalidasi struktur berkas, mendukung mode gabung (*merge*) atau ganti (*replace*), serta meminta konfirmasi sebelum mengganti seluruh data.
- **Antarmuka responsif** dengan sidebar seluler, pencarian global, menu profil, toast, dialog konfirmasi, dan fokus yang dapat diakses.
- **Data awal** berisi delapan pengetahuan contoh dalam bahasa Indonesia. Data hanya dibuat saat penyimpanan masih kosong dan tidak dibuat ulang setiap halaman dimuat.

## Menjalankan secara lokal

Tidak ada proses build atau dependensi yang perlu dipasang.

### Opsi 1 — server lokal

Jalankan dari folder proyek:

```bash
python -m http.server 8000
```

Lalu buka `http://localhost:8000`.

Alternatif dengan Node.js:

```bash
npx serve .
```

### Opsi 2 — Laragon

Letakkan folder proyek di `www` Laragon, lalu buka:

```text
http://localhost/Tugas-Web-Harian-JBIZ/Knowbase/
```

Membuka `index.html` langsung melalui `file://` juga dapat berjalan, tetapi server lokal lebih disarankan agar perilaku penyimpanan konsisten dengan situs yang di-deploy.

## Struktur proyek

```text
Knowbase/
├── index.html          # Kerangka aplikasi, sidebar, header, dan pemuatan skrip
├── favicon.svg
├── css/
│   ├── style.css       # Token desain, layout, sidebar, header, komponen, modal, toast
│   └── pages.css       # Gaya per halaman dan aturan responsif
└── js/
    ├── utils.js        # Ikon SVG, escaping, format tanggal, dan pembantu umum
    ├── storage.js      # Lapisan LocalStorage, data demo, skema, ekspor, reset
    ├── categories.js   # CRUD kategori, palet warna, hitungan, dan relasi
    ├── knowledge.js    # CRUD pengetahuan, validasi, filter, pencarian, statistik
    ├── ui.js           # Render dashboard, daftar, detail, kategori, pengaturan
    ├── modals.js       # Template editor, kategori, impor, dan konfirmasi
    └── app.js          # State pusat, hash router, event, aksi, impor/ekspor
```

Aplikasi memakai **hash routing** (`#/dashboard`, `#/knowledge`, dan seterusnya), sehingga dapat dihosting sebagai situs statis tanpa konfigurasi rewrite server.

## Penyimpanan data

Data disimpan pada empat kunci LocalStorage dengan versi skema:

| Kunci | Isi |
| --- | --- |
| `knowbase:knowledge:v1` | Daftar pengetahuan |
| `knowbase:categories:v1` | Daftar kategori |
| `knowbase:preferences:v1` | Nama tampilan, mode tampilan, pengurutan, preferensi pemberitahuan |
| `knowbase:meta:v1` | Versi skema, waktu inisialisasi, status data demo, waktu reset |

Contoh struktur pengetahuan:

```json
{
  "id": "knw-...",
  "title": "Judul pengetahuan",
  "summary": "Ringkasan singkat",
  "content": "Isi lengkap pengetahuan",
  "categoryId": "cat-...",
  "tags": ["javascript", "dasar"],
  "favorite": false,
  "archived": false,
  "createdAt": "2026-10-26T00:00:00.000Z",
  "updatedAt": "2026-10-26T00:00:00.000Z"
}
```

Contoh struktur kategori:

```json
{
  "id": "cat-...",
  "name": "Teknologi",
  "color": "#2563eb",
  "createdAt": "2026-10-26T00:00:00.000Z"
}
```

Jika data JSON rusak, Knowbase mencadangkan nilai mentahnya ke kunci `<kunci-asli>:rusak:<timestamp>`, lalu mengabaikan data yang tidak dapat dibaca. Jika LocalStorage tidak tersedia atau penuh, aplikasi memberi notifikasi dan dapat beralih ke penyimpanan sementara selama tab terbuka.

### Ekspor, impor, dan reset

- **Ekspor** menghasilkan berkas JSON dengan `app`, `schemaVersion`, `exportedAt`, `knowledge`, dan `categories`.
- **Impor** menerima berkas ekspor tersebut dengan ukuran maksimal 5 MB. Mode **Gabung** mempertahankan data lokal, mencocokkan kategori berdasarkan ID/nama, dan memakai data dengan `updatedAt` lebih baru untuk pengetahuan yang sama. Mode **Ganti** mengganti seluruh data setelah konfirmasi.
- **Reset** mengosongkan pengetahuan dan kategori serta mengatur ulang preferensi. Data demo tidak akan muncul lagi setelah reset.
- Ekspor berkas cadangan secara berkala, terutama sebelum membersihkan data situs atau berpindah perangkat.

## Batasan LocalStorage

- Data terikat pada **satu browser dan satu perangkat**; data tidak tersinkronisasi antarbrowser atau antarperangkat.
- Data terikat pada **asal situs** (origin). Data di `localhost:8000`, `file://`, dan domain GitHub Pages adalah kumpulan data yang terpisah.
- Kuota LocalStorage umumnya sekitar 5–10 MB per origin, bergantung pada browser. Isi pengetahuan yang sangat panjang dapat mencapai batas tersebut.
- Data LocalStorage **tidak terenkripsi**. Jangan menyimpan rahasia, kredensial, atau informasi sensitif.
- Menghapus data situs, membersihkan cache browser, memakai mode privat, atau mengganti domain dapat menghilangkan data.
- Mode privat atau pengaturan privasi tertentu dapat menonaktifkan LocalStorage. Aplikasi akan memakai penyimpanan sementara dan menampilkan peringatan.
- Tidak ada akun, server, kolaborasi, atau sinkronisasi. Gunakan fitur ekspor/impor untuk memindahkan data secara manual.

## Keamanan

Konten pengguna dirender sebagai teks yang di-escape, bukan HTML mentah. Berkas impor divalidasi sebelum diterapkan, warna kategori dibatasi pada format heksadesimal, dan operasi tulis memiliki penanganan kesalahan serta upaya pemulihan. Aplikasi tidak mengirim data ke server mana pun.

## Deployment

Situs ini adalah berkas statis dan di-deploy melalui **GitHub Pages** dari branch `main` (folder root):

- Repository: https://github.com/moch-rafi-sidiq/Knowbase
- Situs: https://moch-rafi-sidiq.github.io/Knowbase/

Untuk memperbarui situs, unggah perubahan ke branch `main`. GitHub Pages akan menyajikan ulang berkas secara otomatis.
