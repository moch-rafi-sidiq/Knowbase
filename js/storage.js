/* Knowbase — lapisan penyimpanan LocalStorage, data awal, dan validasi dasar */
(function () {
  'use strict';

  const SCHEMA_VERSION = 1;
  const KEYS = {
    knowledge: 'knowbase:knowledge:v1',
    categories: 'knowbase:categories:v1',
    preferences: 'knowbase:preferences:v1',
    meta: 'knowbase:meta:v1'
  };

  const DEFAULT_PREFERENCES = {
    displayName: 'Pengguna Lokal',
    viewMode: 'cards',
    sort: 'updated-desc',
    demoNoticeDismissed: false
  };

  const SORT_OPTIONS = ['updated-desc', 'created-desc', 'created-asc', 'title-asc'];

  const memoryStore = new Map();
  let persistent = detectPersistence();
  let issues = [];
  let persistenceWarningShown = false;

  function detectPersistence() {
    try {
      const testKey = 'knowbase:test';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  function noteIssue(message) {
    if (!issues.includes(message)) issues.push(message);
  }

  if (!persistent) {
    noteIssue('Penyimpanan browser tidak dapat diakses. Data hanya tersimpan selama tab ini terbuka.');
  }

  function disablePersistence(reason) {
    if (persistent) {
      persistent = false;
      noteIssue(reason || 'Penyimpanan browser tidak dapat diakses. Data hanya tersimpan selama sesi ini.');
    }
  }

  function rawGet(key) {
    if (persistent) {
      try {
        return window.localStorage.getItem(key);
      } catch (error) {
        disablePersistence('Penyimpanan browser tidak dapat dibaca. Data dialihkan ke memori sementara.');
      }
    }
    return memoryStore.has(key) ? memoryStore.get(key) : null;
  }

  function rawSet(key, value) {
    memoryStore.set(key, value);
    if (!persistent) return;
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      const isQuota = error && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED');
      throw new Error(isQuota
        ? 'Penyimpanan browser penuh. Hapus beberapa data atau ekspor cadangan terlebih dahulu.'
        : 'Data gagal disimpan ke browser. Periksa izin penyimpanan lalu coba lagi.');
    }
  }

  function rawRemove(key) {
    memoryStore.delete(key);
    if (!persistent) return;
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      /* abaikan, data tetap tersedia di memori sesi ini */
    }
  }

  function quarantine(key, rawValue) {
    try {
      const backupKey = key + ':rusak:' + Date.now();
      if (persistent) window.localStorage.setItem(backupKey, rawValue);
    } catch (error) {
      /* salinan cadangan tidak wajib berhasil */
    }
    rawRemove(key);
  }

  function readValue(key, fallback) {
    const raw = rawGet(key);
    if (raw === null || raw === '') return fallback;
    try {
      return JSON.parse(raw);
    } catch (error) {
      quarantine(key, raw);
      noteIssue('Sebagian data lokal rusak dan tidak dapat dibaca. Data yang rusak telah dicadangkan lalu diabaikan.');
      return fallback;
    }
  }

  function writeValue(key, value) {
    rawSet(key, JSON.stringify(value));
  }

  function readArray(key, label) {
    const value = readValue(key, []);
    if (!Array.isArray(value)) {
      noteIssue('Struktur data ' + label + ' tidak valid dan diabaikan.');
      return [];
    }
    return value;
  }

  function sanitizePreferences(value) {
    const source = value && typeof value === 'object' ? value : {};
    const displayName = typeof source.displayName === 'string' && source.displayName.trim()
      ? source.displayName.trim().slice(0, 40)
      : DEFAULT_PREFERENCES.displayName;
    return {
      displayName: displayName,
      viewMode: source.viewMode === 'list' ? 'list' : 'cards',
      sort: SORT_OPTIONS.includes(source.sort) ? source.sort : DEFAULT_PREFERENCES.sort,
      demoNoticeDismissed: source.demoNoticeDismissed === true
    };
  }

  function getKnowledge() {
    return readArray(KEYS.knowledge, 'pengetahuan');
  }

  function writeKnowledge(items) {
    if (!Array.isArray(items)) throw new Error('Data pengetahuan tidak valid.');
    writeValue(KEYS.knowledge, items);
  }

  function getCategories() {
    return readArray(KEYS.categories, 'kategori');
  }

  function writeCategories(items) {
    if (!Array.isArray(items)) throw new Error('Data kategori tidak valid.');
    writeValue(KEYS.categories, items);
  }

  function getPreferences() {
    return sanitizePreferences(readValue(KEYS.preferences, DEFAULT_PREFERENCES));
  }

  function savePreferences(partial) {
    const current = getPreferences();
    const next = sanitizePreferences(Object.assign({}, current, partial || {}));
    writeValue(KEYS.preferences, next);
    return next;
  }

  function getMeta() {
    const value = readValue(KEYS.meta, null);
    return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
  }

  function setMeta(meta) {
    writeValue(KEYS.meta, meta);
  }

  function daysAgo(days, hour, minute) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    if (typeof hour === 'number') date.setHours(hour, minute || 0, 0, 0);
    return date.toISOString();
  }

  function hoursAgo(hours, minutes) {
    const date = new Date();
    date.setMinutes(date.getMinutes() - (hours * 60) - (minutes || 0));
    return date.toISOString();
  }

  function demoCategories() {
    return [
      { id: 'cat-pemrograman', name: 'Pemrograman', color: '#2563eb', createdAt: daysAgo(60) },
      { id: 'cat-teknologi', name: 'Teknologi', color: '#0891b2', createdAt: daysAgo(60) },
      { id: 'cat-pembelajaran', name: 'Pembelajaran', color: '#16a34a', createdAt: daysAgo(60) },
      { id: 'cat-ide-proyek', name: 'Ide Proyek', color: '#d97706', createdAt: daysAgo(60) },
      { id: 'cat-referensi', name: 'Referensi', color: '#7c3aed', createdAt: daysAgo(60) }
    ];
  }

  function demoKnowledge() {
    return [
      {
        id: 'knw-html-semantik',
        title: 'Dasar HTML Semantik',
        summary: 'Memahami elemen HTML semantik agar struktur halaman lebih jelas, mudah diakses, dan ramah SEO.',
        content: 'HTML semantik adalah penggunaan elemen yang maknanya sesuai dengan fungsi konten, bukan sekadar tampilan.\n\nElemen utama yang perlu diingat:\n\n- <header> untuk bagian pembuka halaman atau artikel.\n- <nav> untuk kumpulan tautan navigasi.\n- <main> untuk konten utama yang hanya muncul sekali per halaman.\n- <section> untuk kelompok konten yang memiliki tema tertentu.\n- <article> untuk konten mandiri seperti berita atau tulisan blog.\n- <aside> untuk informasi pendukung atau sidebar.\n- <footer> untuk penutup halaman.\n\nManfaatnya: struktur lebih mudah dipahami mesin pencari, navigasi pembaca layar menjadi lebih baik, dan kode lebih mudah dirawat.\n\nKesalahan umum adalah menggunakan <div> untuk semua elemen. Gunakan div hanya ketika tidak ada elemen semantik yang cocok.',
        categoryId: 'cat-pemrograman',
        tags: ['html', 'web', 'semantik'],
        favorite: true,
        archived: false,
        createdAt: daysAgo(34, 9, 15),
        updatedAt: daysAgo(2, 14, 30)
      },
      {
        id: 'knw-css-flexbox',
        title: 'Konsep CSS Flexbox',
        summary: 'Catatan ringkas tentang flex container, flex item, dan properti penting untuk layout satu dimensi.',
        content: 'Flexbox digunakan untuk mengatur layout dalam satu dimensi, yaitu baris atau kolom.\n\nAktifkan dengan display: flex pada container. Setelah itu, atur arah dengan flex-direction (row, column, row-reverse, column-reverse).\n\nProperti penting pada container:\n- justify-content: perataan pada sumbu utama.\n- align-items: perataan pada sumbu silang.\n- flex-wrap: mengizinkan item turun ke baris baru.\n- gap: memberi jarak antaritern tanpa margin tambahan.\n\nProperti penting pada item:\n- flex-grow: seberapa besar item mengambil ruang tambahan.\n- flex-shrink: seberapa besar item menyusut saat ruang terbatas.\n- flex-basis: ukuran awal item sebelum ruang dibagi.\n\nContoh cepat: display: flex; justify-content: space-between; align-items: center; gap: 16px; sering dipakai untuk membuat navigasi yang rapi.',
        categoryId: 'cat-pemrograman',
        tags: ['css', 'layout', 'flexbox'],
        favorite: false,
        archived: false,
        createdAt: daysAgo(29, 10, 0),
        updatedAt: daysAgo(5, 16, 10)
      },
      {
        id: 'knw-dasar-javascript',
        title: 'Dasar JavaScript',
        summary: 'Pondasi JavaScript modern: variabel, fungsi, objek, DOM, dan cara berpikir saat menangani data.',
        content: 'JavaScript membuat halaman web menjadi interaktif. Mulailah dari konsep inti berikut.\n\n1. Variabel\nGunakan const untuk nilai yang tidak diubah referensinya dan let untuk nilai yang perlu diperbarui. Hindari var pada kode baru.\n\n2. Tipe data\nString, number, boolean, null, undefined, object, dan array. Gunakan typeof untuk pemeriksaan sederhana.\n\n3. Fungsi\nFungsi menyimpan logika yang dapat dipakai ulang. Arrow function cocok untuk callback singkat.\n\n4. DOM\nGunakan document.querySelector untuk memilih elemen dan addEventListener untuk menangani interaksi pengguna.\n\n5. Data\nArray dan objek adalah struktur utama. Biasakan menggunakan map, filter, dan find agar kode lebih mudah dibaca.\n\nTips: biasakan membaca pesan error di console, pecah masalah menjadi langkah kecil, dan tulis kode yang bisa dipahami orang lain.',
        categoryId: 'cat-pemrograman',
        tags: ['javascript', 'programming', 'dasar'],
        favorite: true,
        archived: false,
        createdAt: daysAgo(26, 8, 45),
        updatedAt: hoursAgo(5, 20)
      },
      {
        id: 'knw-git-dasar',
        title: 'Cara Menggunakan Git',
        summary: 'Alur kerja Git harian mulai dari inisialisasi repositori sampai commit, branch, dan push.',
        content: 'Git adalah sistem kontrol versi yang mencatat setiap perubahan kode.\n\nAlur dasar:\n1. git init untuk membuat repositori baru.\n2. git status untuk melihat kondisi berkas.\n3. git add . untuk memasukkan perubahan ke staging area.\n4. git commit -m "pesan jelas" untuk menyimpan snapshot.\n5. git log --oneline untuk melihat riwayat.\n\nBekerja dengan branch:\ngit branch -M main\ngit checkout -b fitur-login\nSetelah selesai, gabungkan dengan git merge atau buka pull request.\n\nTips commit yang baik:\n- Satu commit untuk satu perubahan yang bermakna.\n- Gunakan kalimat perintah singkat, misalnya "Perbaiki validasi form login".\n- Commit sebelum bereksperimen besar agar mudah kembali.\n\nJangan lupa konfigurasi awal: git config --global user.name dan git config --global user.email.',
        categoryId: 'cat-teknologi',
        tags: ['git', 'version-control', 'kolaborasi'],
        favorite: false,
        archived: false,
        createdAt: daysAgo(21, 13, 5),
        updatedAt: daysAgo(4, 11, 25)
      },
      {
        id: 'knw-ide-aplikasi-sekolah',
        title: 'Ide Proyek Aplikasi Sekolah',
        summary: 'Beberapa ide proyek sederhana yang relevan untuk kebutuhan sekolah dan bisa dikerjakan bertahap.',
        content: 'Kumpulan ide yang bisa dimulai dengan fitur kecil:\n\n1. Papan pengumuman digital\nMenampilkan pengumuman terbaru, kategori, dan tanggal kedaluwarsa. Bisa memakai localStorage untuk versi prototipe.\n\n2. Pencatat tugas kelas\nSiswa menambahkan tugas, tenggat, dan status selesai. Tambahkan pengingat sederhana di dashboard.\n\n3. Katalog ekstrakurikuler\nDaftar kegiatan, jadwal, pembina, dan formulir minat siswa.\n\n4. Perpustakaan mini\nCatat buku, status pinjam, dan riwayat pengembalian. Cocok untuk melatih relasi data.\n\n5. Galeri karya siswa\nUnggah tautan karya, kategori, dan deskripsi singkat. Fokuskan pada kurasi dan tampilan yang rapi.\n\nLangkah berikutnya: pilih satu ide, tulis kebutuhan pengguna, tentukan tiga fitur utama, lalu buat prototipe selama satu minggu.',
        categoryId: 'cat-ide-proyek',
        tags: ['ide', 'sekolah', 'aplikasi'],
        favorite: false,
        archived: false,
        createdAt: daysAgo(14, 15, 40),
        updatedAt: daysAgo(8, 9, 10)
      },
      {
        id: 'knw-referensi-desain-ui',
        title: 'Referensi Desain UI',
        summary: 'Sumber inspirasi dan prinsip dasar untuk membuat antarmuka yang bersih, konsisten, dan mudah digunakan.',
        content: 'Saat mencari referensi desain, jangan hanya meniru tampilan. Perhatikan alasan di balik keputusan desainnya.\n\nPrinsip yang bisa dipegang:\n- Hierarki visual: pengguna harus tahu apa yang paling penting lebih dulu.\n- Konsistensi: gunakan skala jarak, radius, dan warna yang sama di seluruh aplikasi.\n- Kontras: pastikan teks mudah dibaca, terutama teks kecil.\n- Umpan balik: setiap aksi pengguna perlu respons yang jelas.\n- Kesederhanaan: kurangi elemen yang tidak membantu tugas utama.\n\nSumber referensi yang berguna: galeri karya desain, dokumentasi design system, dan aplikasi produktivitas yang sering digunakan sehari-hari.\n\nChecklist singkat sebelum menyelesaikan desain: apakah navigasi jelas, apakah form punya label, apakah keadaan kosong informatif, dan apakah tampilan tetap nyaman di layar kecil?',
        categoryId: 'cat-referensi',
        tags: ['desain', 'ui', 'referensi'],
        favorite: true,
        archived: false,
        createdAt: daysAgo(11, 10, 20),
        updatedAt: daysAgo(3, 17, 0)
      },
      {
        id: 'knw-belajar-database',
        title: 'Catatan Belajar Database',
        summary: 'Dasar basis data relasional, tabel, kunci, SQL, dan normalisasi yang perlu dipahami pemula.',
        content: 'Basis data relasional menyimpan data dalam tabel yang saling berhubungan.\n\nIstilah dasar:\n- Tabel: kumpulan data dengan kolom dan baris.\n- Primary key: kolom unik untuk mengidentifikasi satu baris.\n- Foreign key: kolom yang merujuk ke primary key di tabel lain.\n- Index: struktur bantu agar pencarian lebih cepat.\n\nPerintah SQL yang sering dipakai:\nSELECT * FROM catatan;\nINSERT INTO catatan (judul, isi) VALUES (\'Belajar SQL\', \'...\');\nUPDATE catatan SET judul = \'...\' WHERE id = 1;\nDELETE FROM catatan WHERE id = 1;\n\nNormalisasi bertujuan mengurangi duplikasi data. Mulailah dari bentuk normal pertama: setiap kolom berisi satu nilai, lalu lanjutkan memisahkan data yang berulang.\n\nLatihan yang disarankan: buat skema sederhana untuk aplikasi catatan, lalu tulis query untuk daftar catatan per kategori.',
        categoryId: 'cat-pembelajaran',
        tags: ['database', 'sql', 'belajar'],
        favorite: false,
        archived: false,
        createdAt: daysAgo(6, 19, 30),
        updatedAt: hoursAgo(20)
      },
      {
        id: 'knw-checklist-rilis',
        title: 'Checklist Rilis Proyek Web',
        summary: 'Daftar periksa sebelum proyek web dibagikan ke pengguna, dari konten sampai pengujian perangkat.',
        content: 'Gunakan checklist ini sebelum merilis versi baru.\n\nKonten dan tampilan:\n- Tidak ada teks contoh yang tertinggal.\n- Semua tautan mengarah ke halaman yang benar.\n- Empty state dan pesan error sudah diuji.\n\nFungsi:\n- Form utama berhasil menyimpan data.\n- Data tetap ada setelah halaman dimuat ulang.\n- Tombol hapus meminta konfirmasi.\n- Tidak ada error di console browser.\n\nTampilan responsif:\n- Uji lebar 375px, 768px, dan 1440px.\n- Pastikan navigasi tetap dapat digunakan di layar kecil.\n\nRilis:\n- Ekspor cadangan data.\n- Catat perubahan penting pada versi ini.\n- Siapkan cara melaporkan bug.',
        categoryId: 'cat-teknologi',
        tags: ['rilis', 'qa', 'proyek'],
        favorite: false,
        archived: true,
        createdAt: daysAgo(9, 8, 0),
        updatedAt: daysAgo(6, 12, 45)
      }
    ];
  }

  function seedDemoData(options) {
    const opts = options || {};
    if (opts.force !== true) {
      const existingKnowledge = getKnowledge();
      const existingCategories = getCategories();
      if (existingKnowledge.length || existingCategories.length) {
        throw new Error('Data contoh hanya dapat dimuat saat penyimpanan masih kosong.');
      }
    }
    const categories = demoCategories();
    const knowledge = demoKnowledge();
    writeCategories(categories);
    writeKnowledge(knowledge);
    if (opts.resetPreferences !== false) {
      writeValue(KEYS.preferences, sanitizePreferences(DEFAULT_PREFERENCES));
    }
    setMeta({
      schemaVersion: SCHEMA_VERSION,
      initializedAt: new Date().toISOString(),
      demoSeeded: true
    });
    return { knowledge: knowledge.length, categories: categories.length };
  }

  function initialize() {
    let meta = getMeta();
    const rawKnowledge = rawGet(KEYS.knowledge);
    const rawCategories = rawGet(KEYS.categories);

    if (!meta && rawKnowledge === null && rawCategories === null) {
      const seeded = seedDemoData({ force: true });
      return { seeded: true, persistent: persistent, counts: seeded };
    }

    if (!meta) {
      meta = {
        schemaVersion: SCHEMA_VERSION,
        initializedAt: new Date().toISOString(),
        demoSeeded: false
      };
      setMeta(meta);
    } else if (Number(meta.schemaVersion) > SCHEMA_VERSION) {
      noteIssue('Data dibuat oleh versi Knowbase yang lebih baru. Beberapa fitur mungkin tidak sepenuhnya kompatibel.');
    }

    return { seeded: false, persistent: persistent };
  }

  function resetAll() {
    writeKnowledge([]);
    writeCategories([]);
    writeValue(KEYS.preferences, sanitizePreferences(DEFAULT_PREFERENCES));
    setMeta({
      schemaVersion: SCHEMA_VERSION,
      initializedAt: new Date().toISOString(),
      demoSeeded: false,
      resetAt: new Date().toISOString()
    });
  }

  function exportData() {
    return {
      app: 'Knowbase',
      schemaVersion: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      knowledge: getKnowledge(),
      categories: getCategories()
    };
  }

  function getUsage() {
    let bytes = 0;
    Object.values(KEYS).forEach(function (key) {
      const raw = rawGet(key);
      if (raw) bytes += raw.length * 2;
    });
    return { bytes: bytes, persistent: persistent };
  }

  function consumeIssues() {
    const current = issues.slice();
    issues = [];
    return current;
  }

  window.Storage = {
    KEYS: KEYS,
    SCHEMA_VERSION: SCHEMA_VERSION,
    SORT_OPTIONS: SORT_OPTIONS,
    DEFAULT_PREFERENCES: DEFAULT_PREFERENCES,
    getKnowledge: getKnowledge,
    writeKnowledge: writeKnowledge,
    getCategories: getCategories,
    writeCategories: writeCategories,
    getPreferences: getPreferences,
    savePreferences: savePreferences,
    getMeta: getMeta,
    initialize: initialize,
    resetAll: resetAll,
    loadDemoData: seedDemoData,
    exportData: exportData,
    getUsage: getUsage,
    consumeIssues: consumeIssues,
    isPersistent: function () { return persistent; }
  };
})();
