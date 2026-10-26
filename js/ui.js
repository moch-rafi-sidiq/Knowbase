/* Knowbase — komponen tampilan halaman */
(function () {
  'use strict';

  const E = Utils.escapeHtml;

  const SORT_LABELS = {
    'updated-desc': 'Terakhir diperbarui',
    'created-desc': 'Terbaru dibuat',
    'created-asc': 'Paling lama',
    'title-asc': 'Judul A–Z'
  };

  function formatBytes(bytes) {
    if (!bytes || bytes < 1024) return (bytes || 0) + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1).replace('.', ',') + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1).replace('.', ',') + ' MB';
  }

  function categoryPill(categoryId) {
    const category = categoryId ? Categories.get(categoryId) : null;
    const name = category ? category.name : 'Tanpa Kategori';
    const color = category ? category.color : Categories.FALLBACK_COLOR;
    return '<span class="category-pill"><span class="category-dot" style="background-color:' + color + '"></span>' + E(name) + '</span>';
  }

  function tagList(tags, limit) {
    const list = Array.isArray(tags) ? tags : [];
    if (!list.length) return '';
    const visible = typeof limit === 'number' ? list.slice(0, limit) : list;
    const rest = list.length - visible.length;
    return '<div class="tag-list">' + visible.map(function (tag) {
      return '<span class="tag-chip">#' + E(tag) + '</span>';
    }).join('') + (rest > 0 ? '<span class="tag-chip tag-chip-more">+' + rest + '</span>' : '') + '</div>';
  }

  function favoriteButton(item, extraClass) {
    const active = Boolean(item.favorite);
    return '<button type="button" class="icon-btn fav-btn' + (active ? ' is-active' : '') + (extraClass ? ' ' + extraClass : '') +
      '" data-action="toggle-favorite" data-id="' + E(item.id) + '" aria-pressed="' + active +
      '" aria-label="' + (active ? 'Hapus dari favorit' : 'Tandai sebagai favorit') + '" title="' +
      (active ? 'Hapus dari favorit' : 'Tandai favorit') + '">' + Utils.icon(active ? 'star-filled' : 'star', 18) + '</button>';
  }

  function viewSwitch(mode) {
    return '<div class="view-switch" role="group" aria-label="Tampilan daftar">' +
      '<button type="button" class="view-btn' + (mode === 'cards' ? ' is-active' : '') + '" data-action="set-view" data-view="cards" aria-pressed="' + (mode === 'cards') + '" aria-label="Tampilan kartu" title="Tampilan kartu">' + Utils.icon('grid', 17) + '</button>' +
      '<button type="button" class="view-btn' + (mode === 'list' ? ' is-active' : '') + '" data-action="set-view" data-view="list" aria-pressed="' + (mode === 'list') + '" aria-label="Tampilan daftar" title="Tampilan daftar">' + Utils.icon('list', 17) + '</button>' +
      '</div>';
  }

  function pageHead(config) {
    return '<div class="page-head">' +
      '<div class="page-head-copy">' +
      (config.eyebrow ? '<p class="eyebrow">' + E(config.eyebrow) + '</p>' : '') +
      '<h1>' + E(config.title) + '</h1>' +
      (config.subtitle ? '<p class="page-subtitle">' + E(config.subtitle) + '</p>' : '') +
      '</div>' +
      (config.actions ? '<div class="page-actions">' + config.actions + '</div>' : '') +
      '</div>';
  }

  function addKnowledgeButton(label) {
    return '<button type="button" class="btn btn-primary" data-action="new-knowledge">' + Utils.icon('plus', 18) + '<span>' + E(label || 'Tambah Pengetahuan') + '</span></button>';
  }

  function emptyState(config) {
    return '<div class="empty-state panel">' +
      '<span class="empty-icon">' + Utils.icon(config.icon || 'file-text', 26) + '</span>' +
      '<h2>' + E(config.title) + '</h2>' +
      '<p>' + E(config.text) + '</p>' +
      (config.actions ? '<div class="empty-actions">' + config.actions + '</div>' : '') +
      '</div>';
  }

  function miniEmpty(iconName, text) {
    return '<div class="mini-empty"><span>' + Utils.icon(iconName || 'file-text', 20) + '</span><p>' + E(text) + '</p></div>';
  }

  function categorySelectOptions(selected, counts) {
    const categories = Categories.all();
    let html = '<option value="all"' + (selected === 'all' ? ' selected' : '') + '>Semua kategori</option>';
    categories.forEach(function (category) {
      const count = counts ? ' (' + (counts[category.id] || 0) + ')' : '';
      html += '<option value="' + E(category.id) + '"' + (selected === category.id ? ' selected' : '') + '>' +
        E(category.name) + E(count) + '</option>';
    });
    if (counts && counts.none > 0) {
      html += '<option value="none"' + (selected === 'none' ? ' selected' : '') + '>Tanpa Kategori (' + counts.none + ')</option>';
    }
    return html;
  }

  function filtersActive(state) {
    return Boolean(state.search) ||
      state.filters.category !== 'all' ||
      state.filters.status !== 'active' ||
      state.filters.favoriteOnly === true;
  }

  function toolbar(state, counts) {
    const filters = state.filters;
    return '<div class="toolbar panel">' +
      '<div class="toolbar-filters">' +
      '<label class="inline-filter"><span class="inline-filter-label">Kategori</span><span class="select-wrap">' +
      '<select data-filter="category" aria-label="Filter kategori">' + categorySelectOptions(filters.category, counts) + '</select>' +
      '<span class="select-chevron">' + Utils.icon('chevron-down', 15) + '</span></span></label>' +
      '<label class="inline-filter"><span class="inline-filter-label">Status</span><span class="select-wrap">' +
      '<select data-filter="status" aria-label="Filter status">' +
      '<option value="active"' + (filters.status === 'active' ? ' selected' : '') + '>Aktif</option>' +
      '<option value="archived"' + (filters.status === 'archived' ? ' selected' : '') + '>Diarsipkan</option>' +
      '<option value="all"' + (filters.status === 'all' ? ' selected' : '') + '>Semua status</option>' +
      '</select><span class="select-chevron">' + Utils.icon('chevron-down', 15) + '</span></span></label>' +
      '<label class="inline-filter"><span class="inline-filter-label">Urutkan</span><span class="select-wrap">' +
      '<select data-filter="sort" aria-label="Urutkan pengetahuan">' +
      Object.keys(SORT_LABELS).map(function (value) {
        return '<option value="' + value + '"' + (filters.sort === value ? ' selected' : '') + '>' + SORT_LABELS[value] + '</option>';
      }).join('') +
      '</select><span class="select-chevron">' + Utils.icon('chevron-down', 15) + '</span></span></label>' +
      '<button type="button" class="filter-chip' + (filters.favoriteOnly ? ' is-active' : '') + '" data-action="toggle-favorite-filter" aria-pressed="' + filters.favoriteOnly + '">' +
      Utils.icon('star', 16) + 'Favorit</button>' +
      (filtersActive(state) ? '<button type="button" class="btn btn-ghost btn-sm" data-action="clear-filters">' + Utils.icon('x', 15) + 'Reset</button>' : '') +
      '</div>' +
      '<div class="toolbar-side">' + viewSwitch(state.prefs.viewMode) + '</div>' +
      '</div>';
  }

  function resultMeta(state, count) {
    let text = '<strong>' + Utils.formatNumber(count) + '</strong> pengetahuan';
    if (state.search) {
      text += '<span class="meta-separator">·</span>Hasil untuk “' + E(state.search) + '”';
    }
    return '<div class="list-meta">' + text + '</div>';
  }

  function knowledgeCard(item) {
    const archiveMode = item.archived;
    const tags = tagList(item.tags, 3);
    return '<article class="knowledge-card' + (archiveMode ? ' is-archived' : '') + '">' +
      '<div class="knowledge-card-top">' +
      categoryPill(item.categoryId) +
      (archiveMode ? '<span class="status-pill status-archived">Diarsipkan</span>' : favoriteButton(item)) +
      '</div>' +
      '<h3 class="knowledge-card-title"><a class="knowledge-card-link" href="#/knowledge/' + encodeURIComponent(item.id) + '">' + E(item.title) + '</a></h3>' +
      '<p class="knowledge-card-summary">' + (item.summary ? E(item.summary) : '<span class="muted">Belum ada ringkasan.</span>') + '</p>' +
      (tags || '<div class="tag-list"><span class="muted tag-empty">Tanpa tag</span></div>') +
      '<div class="knowledge-card-footer">' +
      '<span class="knowledge-date">' + Utils.icon('clock', 14) + Utils.timeAgo(item.updatedAt) + '</span>' +
      '<div class="card-actions">' +
      (archiveMode
        ? '<button type="button" class="icon-btn" data-action="restore-knowledge" data-id="' + E(item.id) + '" aria-label="Pulihkan dari arsip" title="Pulihkan">' + Utils.icon('rotate-ccw', 17) + '</button>' +
          '<button type="button" class="icon-btn icon-btn-danger" data-action="delete-permanent" data-id="' + E(item.id) + '" aria-label="Hapus permanen" title="Hapus permanen">' + Utils.icon('trash', 17) + '</button>'
        : '<button type="button" class="icon-btn" data-action="archive-knowledge" data-id="' + E(item.id) + '" aria-label="Arsipkan pengetahuan" title="Arsipkan">' + Utils.icon('archive', 17) + '</button>' +
          '<span class="card-open">Baca' + Utils.icon('chevron-right', 15) + '</span>') +
      '</div></div>' +
      '</article>';
  }

  function knowledgeRow(item) {
    const archiveMode = item.archived;
    return '<div class="knowledge-row' + (archiveMode ? ' is-archived' : '') + '">' +
      '<div class="knowledge-row-main">' +
      '<h3><a href="#/knowledge/' + encodeURIComponent(item.id) + '">' + E(item.title) + '</a></h3>' +
      '<p>' + (item.summary ? E(item.summary) : 'Belum ada ringkasan.') + '</p>' +
      (tagList(item.tags, 2) || '') +
      '</div>' +
      '<div class="knowledge-row-category">' + categoryPill(item.categoryId) + '</div>' +
      '<div class="knowledge-row-date">' + Utils.icon('clock', 14) + Utils.timeAgo(item.updatedAt) + '</div>' +
      '<div class="knowledge-row-actions">' +
      (archiveMode
        ? '<button type="button" class="icon-btn" data-action="restore-knowledge" data-id="' + E(item.id) + '" aria-label="Pulihkan" title="Pulihkan">' + Utils.icon('rotate-ccw', 17) + '</button>' +
          '<button type="button" class="icon-btn icon-btn-danger" data-action="delete-permanent" data-id="' + E(item.id) + '" aria-label="Hapus permanen" title="Hapus permanen">' + Utils.icon('trash', 17) + '</button>'
        : favoriteButton(item) +
          '<button type="button" class="icon-btn" data-action="edit-knowledge" data-id="' + E(item.id) + '" aria-label="Edit pengetahuan" title="Edit">' + Utils.icon('edit', 17) + '</button>' +
          '<button type="button" class="icon-btn" data-action="archive-knowledge" data-id="' + E(item.id) + '" aria-label="Arsipkan" title="Arsipkan">' + Utils.icon('archive', 17) + '</button>') +
      '</div></div>';
  }

  function knowledgeCollection(state, items) {
    if (!items.length) return renderListEmpty(state);
    if (state.prefs.viewMode === 'list') {
      return '<div class="knowledge-list panel">' +
        '<div class="knowledge-list-head"><span>Pengetahuan</span><span>Kategori</span><span>Diperbarui</span><span class="sr-only">Aksi</span></div>' +
        items.map(knowledgeRow).join('') + '</div>';
    }
    return '<div class="knowledge-grid">' + items.map(knowledgeCard).join('') + '</div>';
  }

  function renderListEmpty(state) {
    const stats = Knowledge.stats();
    const hasAny = stats.totalAll > 0;
    if (state.search || (state.filters && (state.filters.category !== 'all' || state.filters.status !== 'active' || state.filters.favoriteOnly))) {
      return emptyState({
        icon: 'search',
        title: 'Tidak ada hasil',
        text: 'Coba kata kunci lain, ubah filter, atau tampilkan semua pengetahuan.',
        actions: '<button type="button" class="btn btn-secondary" data-action="clear-filters">' + Utils.icon('x', 16) + 'Hapus semua filter</button>'
      });
    }
    if (!hasAny) {
      return emptyState({
        icon: 'file-plus',
        title: 'Ruang pengetahuanmu masih kosong',
        text: 'Simpan catatan, materi, atau ide pertamamu. Semua data akan tersimpan di browser ini.',
        actions: addKnowledgeButton('Tambah Pengetahuan Pertama')
      });
    }
    if (stats.total === 0) {
      return emptyState({
        icon: 'archive',
        title: 'Tidak ada pengetahuan aktif',
        text: 'Semua pengetahuanmu sedang berada di arsip. Pulihkan salah satunya untuk melihatnya kembali di sini.',
        actions: '<a class="btn btn-secondary" href="#/archive">' + Utils.icon('archive', 16) + 'Buka Arsip</a>'
      });
    }
    return emptyState({
      icon: 'search',
      title: 'Tidak ada hasil',
      text: 'Tidak ada pengetahuan yang cocok dengan tampilan saat ini.',
      actions: '<button type="button" class="btn btn-secondary" data-action="clear-filters">Tampilkan Semua</button>'
    });
  }

  function dashboard(state) {
    const stats = Knowledge.stats();
    const latest = Knowledge.query({ status: 'active', sort: 'created-desc', limit: 5 });
    const recent = Knowledge.query({ status: 'active', sort: 'updated-desc', limit: 5 });
    const usage = Knowledge.categoryUsage().filter(function (category) { return category.count > 0; }).slice(0, 5);
    const meta = Storage.getMeta();
    const showDemo = meta && meta.demoSeeded && !state.prefs.demoNoticeDismissed;

    const statsHtml = [
      { label: 'Total Pengetahuan', value: stats.total, icon: 'book-open', tone: 'blue', foot: stats.archived ? stats.archived + ' diarsipkan' : 'Seluruh catatan aktif' },
      { label: 'Kategori', value: stats.categories, icon: 'folder', tone: 'violet', foot: stats.uncategorized ? stats.uncategorized + ' tanpa kategori' : 'Ruang terorganisasi' },
      { label: 'Favorit', value: stats.favorites, icon: 'star', tone: 'amber', foot: 'Ditandai penting' },
      { label: 'Diperbarui 7 Hari', value: stats.updatedWeek, icon: 'clock', tone: 'green', foot: 'Aktivitas seminggu terakhir' }
    ].map(function (stat) {
      return '<div class="stat-card">' +
        '<div class="stat-card-top"><span class="stat-label">' + E(stat.label) + '</span><span class="stat-icon stat-icon-' + stat.tone + '">' + Utils.icon(stat.icon, 20) + '</span></div>' +
        '<div class="stat-value">' + Utils.formatNumber(stat.value) + '</div>' +
        '<p class="stat-foot">' + E(stat.foot) + '</p></div>';
    }).join('');

    function recentRows(items, dateKey, emptyText, emptyIcon) {
      if (!items.length) return miniEmpty(emptyIcon, emptyText);
      return '<div class="recent-list">' + items.map(function (item) {
        const category = item.categoryId ? Categories.get(item.categoryId) : null;
        const color = category ? category.color : Categories.FALLBACK_COLOR;
        const name = category ? category.name : 'Tanpa Kategori';
        const date = dateKey === 'createdAt' ? item.createdAt : item.updatedAt;
        return '<a class="recent-row" href="#/knowledge/' + encodeURIComponent(item.id) + '">' +
          '<span class="recent-dot" style="background-color:' + color + '"></span>' +
          '<span class="recent-copy"><span class="recent-title">' + E(item.title) + '</span>' +
          '<span class="recent-meta">' + E(name) + ' · ' + (dateKey === 'createdAt' ? 'Dibuat ' : 'Diperbarui ') + E(Utils.timeAgo(date)) + '</span></span>' +
          '<span class="recent-chevron">' + Utils.icon('chevron-right', 16) + '</span></a>';
      }).join('') + '</div>';
    }

    let usageHtml;
    if (!usage.length) {
      usageHtml = miniEmpty('folder', 'Belum ada pengetahuan berkategori untuk ditampilkan.');
    } else {
      const max = Math.max.apply(null, usage.map(function (category) { return category.count; }));
      usageHtml = '<div class="usage-grid">' + usage.map(function (category) {
        return '<div class="usage-item"><div class="usage-head"><span class="usage-name"><span class="category-dot" style="background-color:' + category.color + '"></span>' + E(category.name) + '</span><span class="usage-count">' + Utils.formatNumber(category.count) + '</span></div>' +
          '<div class="usage-bar"><span style="width:' + Utils.clampPercent(category.count, max) + '%;background-color:' + category.color + '"></span></div></div>';
      }).join('') + '</div>';
    }

    let emptyPanel = '';
    if (stats.totalAll === 0) {
      emptyPanel = emptyState({
        icon: 'file-plus',
        title: 'Mulai basis pengetahuanmu',
        text: 'Belum ada pengetahuan yang tersimpan. Tambahkan catatan pertama, atau muat data contoh untuk mencoba semua fitur.',
        actions: addKnowledgeButton('Tambah Pengetahuan') +
          (stats.categories === 0 ? '<button type="button" class="btn btn-secondary" data-action="load-demo-data">' + Utils.icon('database', 16) + 'Muat Data Contoh</button>' : '')
      });
    } else if (stats.total === 0) {
      emptyPanel = emptyState({
        icon: 'archive',
        title: 'Pengetahuan aktif kosong',
        text: 'Semua catatan sedang diarsipkan. Kamu bisa memulihkannya kapan saja dari halaman Arsip.',
        actions: '<a class="btn btn-secondary" href="#/archive">' + Utils.icon('archive', 16) + 'Buka Arsip</a>'
      });
    }

    const notices = [];
    if (!Storage.isPersistent()) {
      notices.push('<div class="notice-banner notice-warning" role="status"><span class="notice-icon">' + Utils.icon('alert-triangle', 20) + '</span><div class="notice-copy"><strong>Penyimpanan browser tidak tersedia</strong><p>Data hanya bertahan selama tab ini terbuka. Izinkan penyimpanan situs agar data tidak hilang.</p></div></div>');
    }
    if (showDemo) {
      notices.push('<div class="notice-banner" role="status"><span class="notice-icon">' + Utils.icon('info', 20) + '</span><div class="notice-copy"><strong>Data contoh telah dimuat</strong><p>Semua pengetahuan di bawah adalah contoh. Kamu bebas mengedit, memfavoritkan, mengarsipkan, atau menghapusnya.</p></div><button type="button" class="icon-btn notice-close" data-action="dismiss-demo" aria-label="Tutup pemberitahuan">' + Utils.icon('x', 16) + '</button></div>');
    }

    return '<div class="page page-dashboard">' +
      pageHead({
        eyebrow: 'Ringkasan',
        title: 'Dashboard',
        subtitle: 'Pantau pengetahuan dan aktivitas terbaru di ruang kerja lokalmu.',
        actions: addKnowledgeButton()
      }) +
      notices.join('') +
      '<div class="stats-grid">' + statsHtml + '</div>' +
      '<form class="quick-search panel" id="quick-search-form" role="search">' +
      '<span class="quick-search-icon">' + Utils.icon('search', 20) + '</span>' +
      '<input type="text" id="quick-search-input" name="query" placeholder="Cari cepat berdasarkan judul, isi, tag, atau kategori…" aria-label="Pencarian cepat" autocomplete="off" maxlength="120">' +
      '<button type="submit" class="btn btn-secondary">' + Utils.icon('arrow-right', 17) + 'Cari</button>' +
      '</form>' +
      emptyPanel +
      (emptyPanel ? '' :
        '<div class="dashboard-columns">' +
        '<section class="panel dashboard-panel"><div class="panel-head"><div><h2>Pengetahuan terbaru</h2><p>Ditambahkan paling akhir</p></div><a class="text-link" href="#/recent">Lihat semua' + Utils.icon('chevron-right', 15) + '</a></div>' +
        recentRows(latest, 'createdAt', 'Belum ada pengetahuan baru.', 'file-text') + '</section>' +
        '<section class="panel dashboard-panel"><div class="panel-head"><div><h2>Terakhir diperbarui</h2><p>Aktivitas penyuntingan terakhir</p></div><a class="text-link" href="#/knowledge">Lihat semua' + Utils.icon('chevron-right', 15) + '</a></div>' +
        recentRows(recent, 'updatedAt', 'Belum ada pembaruan.', 'clock') + '</section>' +
        '</div>' +
        '<section class="panel dashboard-panel category-panel"><div class="panel-head"><div><h2>Kategori paling banyak digunakan</h2><p>Berdasarkan jumlah pengetahuan di setiap kategori</p></div><a class="text-link" href="#/categories">Kelola kategori' + Utils.icon('chevron-right', 15) + '</a></div>' +
        usageHtml + '</section>') +
      '</div>';
  }

  function listPageHead(config) {
    return pageHead({
      eyebrow: config.eyebrow,
      title: config.title,
      subtitle: config.subtitle,
      actions: config.actions || ''
    });
  }

  function searchEmptyText() {
    return 'Coba kata kunci lain atau hapus filter yang sedang aktif.';
  }

  function knowledgePage(state) {
    const counts = Categories.counts();
    const items = Knowledge.query({
      search: state.search,
      categoryId: state.filters.category,
      status: state.filters.status,
      favoriteOnly: state.filters.favoriteOnly,
      sort: state.filters.sort
    });
    return '<div class="page page-knowledge">' +
      listPageHead({
        eyebrow: 'Perpustakaan',
        title: 'Semua Pengetahuan',
        subtitle: 'Simpan, cari, dan kelola seluruh catatan pengetahuanmu.',
        actions: addKnowledgeButton()
      }) +
      toolbar(state, counts) +
      resultMeta(state, items.length) +
      knowledgeCollection(state, items) +
      '</div>';
  }

  function favoritesPage(state) {
    const items = Knowledge.query({ search: state.search, status: 'active', favoriteOnly: true, sort: 'updated-desc' });
    return '<div class="page">' +
      listPageHead({
        eyebrow: 'Koleksi',
        title: 'Favorit',
        subtitle: 'Pengetahuan penting yang kamu tandai untuk dibuka kembali dengan cepat.'
      }) +
      '<div class="toolbar panel"><div class="list-summary"><span class="summary-icon">' + Utils.icon('star-filled', 17) + '</span><span><strong>' + items.length + '</strong> pengetahuan favorit</span></div><div class="toolbar-side">' + viewSwitch(state.prefs.viewMode) + '</div></div>' +
      (items.length ? knowledgeCollection(state, items) : emptyState({
        icon: 'star',
        title: state.search ? 'Favorit tidak ditemukan' : 'Belum ada favorit',
        text: state.search ? 'Tidak ada favorit yang cocok dengan “' + state.search + '”.' : 'Tandai pengetahuan dengan ikon bintang agar mudah ditemukan kembali di sini.',
        actions: state.search
          ? '<button type="button" class="btn btn-secondary" data-action="clear-search">Hapus pencarian</button>'
          : '<a class="btn btn-secondary" href="#/knowledge">' + Utils.icon('book-open', 16) + 'Jelajahi Pengetahuan</a>'
      })) +
      '</div>';
  }

  function recentPage(state) {
    const items = Knowledge.query({ search: state.search, status: 'active', sort: 'updated-desc' });
    return '<div class="page">' +
      listPageHead({
        eyebrow: 'Aktivitas',
        title: 'Terbaru',
        subtitle: 'Pengetahuan yang paling baru dibuat atau diperbarui, diurutkan dari yang terakhir.'
      }) +
      '<div class="toolbar panel"><div class="list-summary"><span class="summary-icon">' + Utils.icon('clock', 17) + '</span><span><strong>' + items.length + '</strong> pengetahuan aktif</span></div><div class="toolbar-side">' + viewSwitch(state.prefs.viewMode) + '</div></div>' +
      (items.length ? knowledgeCollection(state, items) : emptyState({
        icon: 'clock',
        title: state.search ? 'Tidak ada pengetahuan yang cocok' : 'Belum ada pengetahuan aktif',
        text: state.search ? searchEmptyText() : 'Tambahkan pengetahuan baru atau pulihkan catatan dari arsip untuk melihatnya di sini.',
        actions: state.search
          ? '<button type="button" class="btn btn-secondary" data-action="clear-search">Hapus pencarian</button>'
          : addKnowledgeButton()
      })) +
      '</div>';
  }

  function archivePage(state) {
    const items = Knowledge.query({ search: state.search, status: 'archived', sort: 'updated-desc' });
    return '<div class="page">' +
      listPageHead({
        eyebrow: 'Penyimpanan',
        title: 'Arsip',
        subtitle: 'Pengetahuan yang disimpan sementara tanpa ditampilkan di daftar utama.'
      }) +
      '<div class="toolbar panel"><div class="list-summary"><span class="summary-icon">' + Utils.icon('archive', 17) + '</span><span><strong>' + items.length + '</strong> pengetahuan diarsipkan</span></div><div class="toolbar-side">' + viewSwitch(state.prefs.viewMode) + '</div></div>' +
      (items.length ? knowledgeCollection(state, items) : emptyState({
        icon: 'archive',
        title: 'Arsip masih kosong',
        text: 'Saat kamu mengarsipkan sebuah pengetahuan, catatan itu akan muncul di sini dan bisa dipulihkan kapan saja.',
        actions: '<a class="btn btn-secondary" href="#/knowledge">' + Utils.icon('book-open', 16) + 'Lihat Semua Pengetahuan</a>'
      })) +
      '</div>';
  }

  function categoriesPage() {
    const categories = Categories.all();
    const counts = Categories.counts();
    const cards = categories.map(function (category) {
      const count = counts[category.id] || 0;
      return '<article class="category-card panel">' +
        '<div class="category-card-head"><span class="category-swatch" style="background-color:' + category.color + '"></span>' +
        '<div class="category-card-copy"><h2>' + E(category.name) + '</h2><p>' + count + ' pengetahuan</p></div>' +
        '<span class="category-count">' + count + '</span></div>' +
        '<div class="category-card-actions">' +
        '<button type="button" class="text-btn" data-action="view-category" data-id="' + E(category.id) + '">Lihat' + Utils.icon('arrow-right', 14) + '</button>' +
        '<div class="category-card-buttons">' +
        '<button type="button" class="icon-btn" data-action="edit-category" data-id="' + E(category.id) + '" aria-label="Edit kategori ' + E(category.name) + '" title="Edit kategori">' + Utils.icon('edit', 16) + '</button>' +
        '<button type="button" class="icon-btn icon-btn-danger" data-action="delete-category" data-id="' + E(category.id) + '" aria-label="Hapus kategori ' + E(category.name) + '" title="Hapus kategori">' + Utils.icon('trash', 16) + '</button>' +
        '</div></div></article>';
    }).join('');

    let uncategorized = '';
    if (counts.none > 0) {
      uncategorized = '<article class="category-card panel category-card-none">' +
        '<div class="category-card-head"><span class="category-swatch category-swatch-none">' + Utils.icon('folder', 16) + '</span>' +
        '<div class="category-card-copy"><h2>Tanpa Kategori</h2><p>' + counts.none + ' pengetahuan</p></div>' +
        '<span class="category-count">' + counts.none + '</span></div>' +
        '<div class="category-card-actions"><button type="button" class="text-btn" data-action="view-uncategorized">Lihat' + Utils.icon('arrow-right', 14) + '</button><span class="category-note">Label bawaan</span></div></article>';
    }

    return '<div class="page page-categories">' +
      listPageHead({
        eyebrow: 'Organisasi',
        title: 'Kategori',
        subtitle: 'Kelompokkan pengetahuan dengan warna penanda agar lebih mudah ditemukan.',
        actions: '<button type="button" class="btn btn-primary" data-action="new-category">' + Utils.icon('folder-plus', 18) + '<span>Tambah Kategori</span></button>'
      }) +
      '<div class="info-note">' + Utils.icon('info', 17) + '<p>Menghapus kategori tidak menghapus pengetahuan di dalamnya. Pengetahuan akan dipindahkan ke <strong>Tanpa Kategori</strong>.</p></div>' +
      (categories.length || uncategorized
        ? '<div class="categories-grid">' + cards + uncategorized + '</div>'
        : emptyState({
          icon: 'folder',
          title: 'Belum ada kategori',
          text: 'Buat kategori pertama untuk mulai mengelompokkan pengetahuanmu. Kamu juga bisa memakai label Tanpa Kategori.',
          actions: '<button type="button" class="btn btn-primary" data-action="new-category">' + Utils.icon('folder-plus', 16) + 'Tambah Kategori</button>'
        })) +
      '</div>';
  }

  function settingsPage() {
    const prefs = Storage.getPreferences();
    const stats = Knowledge.stats();
    const usage = Storage.getUsage();
    const categoryCount = Categories.all().length;
    const storageRows = [
      ['Pengetahuan', stats.totalAll],
      ['Diarsipkan', stats.archived],
      ['Kategori', categoryCount],
      ['Favorit aktif', stats.favorites]
    ].map(function (row) {
      return '<li><span>' + E(row[0]) + '</span><strong>' + Utils.formatNumber(row[1]) + '</strong></li>';
    }).join('');

    const demoPanel = stats.totalAll === 0 && categoryCount === 0
      ? '<div class="sample-data-card"><div><strong>Ingin mencoba dengan data contoh?</strong><p>Muat delapan pengetahuan contoh beserta kategorinya. Data ini dapat diedit atau dihapus seperti biasa.</p></div><button type="button" class="btn btn-secondary btn-sm" data-action="load-demo-data">' + Utils.icon('database', 16) + 'Muat Data Contoh</button></div>'
      : '';

    return '<div class="page page-settings">' +
      listPageHead({
        eyebrow: 'Preferensi',
        title: 'Pengaturan',
        subtitle: 'Kelola profil, cadangan data, dan penyimpanan lokal Knowbase.'
      }) +
      '<div class="settings-grid">' +
      '<section class="panel settings-panel"><div class="panel-head"><div><h2>Profil pengguna</h2><p>Nama ini hanya tampil di antarmuka perangkatmu.</p></div></div>' +
      '<form id="settings-profile-form" class="form-stack" novalidate>' +
      '<label class="field"><span class="field-label">Nama tampilan</span><input type="text" id="settings-display-name" name="displayName" maxlength="40" value="' + E(prefs.displayName) + '" autocomplete="name" required><span class="field-hint">Maksimal 40 karakter.</span></label>' +
      '<div class="form-actions"><button type="submit" class="btn btn-primary">' + Utils.icon('save', 16) + 'Simpan Profil</button></div>' +
      '</form></section>' +
      '<section class="panel settings-panel"><div class="panel-head"><div><h2>Penyimpanan</h2><p>Ringkasan data yang tersimpan di browser ini.</p></div></div>' +
      '<div class="storage-overview"><span class="storage-overview-icon">' + Utils.icon('database', 22) + '</span><div><strong>± ' + formatBytes(usage.bytes) + '</strong><span>' + (usage.persistent ? 'Tersimpan di perangkat ini' : 'Hanya di memori sesi') + '</span></div></div>' +
      '<ul class="storage-list">' + storageRows + '</ul>' +
      '<p class="panel-note">Skema data v' + Storage.SCHEMA_VERSION + '. Data tidak otomatis tersinkronisasi dengan perangkat lain.</p></section>' +
      '<section class="panel settings-panel settings-wide"><div class="panel-head"><div><h2>Data &amp; cadangan</h2><p>Ekspor seluruh pengetahuan dan kategori ke satu berkas JSON, atau pulihkan dari cadangan.</p></div></div>' +
      '<div class="data-grid">' +
      '<div class="data-card"><span class="data-card-icon">' + Utils.icon('download', 21) + '</span><h3>Ekspor data</h3><p>Unduh semua pengetahuan dan kategori dalam format JSON yang dapat diimpor kembali.</p><button type="button" class="btn btn-secondary" data-action="export-data">' + Utils.icon('download', 16) + 'Ekspor JSON</button></div>' +
      '<div class="data-card"><span class="data-card-icon">' + Utils.icon('upload', 21) + '</span><h3>Impor data</h3><p>Pilih berkas cadangan Knowbase. Kamu dapat menggabungkan atau mengganti data saat ini.</p><button type="button" class="btn btn-secondary" data-action="import-data">' + Utils.icon('upload', 16) + 'Pilih File JSON</button>' +
      '<input type="file" id="import-file-input" accept=".json,application/json" hidden></div>' +
      '</div>' + demoPanel + '</section>' +
      '<section class="panel danger-panel settings-wide"><div class="danger-copy"><span class="danger-icon">' + Utils.icon('alert-triangle', 21) + '</span><div><h2>Reset seluruh data</h2><p>Menghapus semua pengetahuan, kategori, dan preferensi dari browser ini. Tindakan ini memerlukan konfirmasi dan tidak dapat dibatalkan.</p></div></div>' +
      '<button type="button" class="btn btn-danger-outline" data-action="reset-data">' + Utils.icon('trash', 16) + 'Reset Data</button></section>' +
      '</div>' +
      '<div class="notice-banner notice-neutral settings-notice"><span class="notice-icon">' + Utils.icon('info', 20) + '</span><div class="notice-copy"><strong>Data tersimpan di browser yang sedang digunakan</strong><p>Knowbase memakai LocalStorage. Data tidak otomatis tersinkronisasi ke perangkat lain, dan dapat hilang jika data situs dibersihkan atau mode privat ditutup.</p></div></div>' +
      '</div>';
  }

  function detailPage(item, state) {
    const stats = Knowledge.stats();
    const category = item.categoryId ? Categories.get(item.categoryId) : null;
    const statusPill = item.archived
      ? '<span class="status-pill status-archived">Diarsipkan</span>'
      : '<span class="status-pill status-active">Aktif</span>';
    const wordCount = Utils.countWords(item.content);
    const tagsHtml = item.tags.length ? tagList(item.tags) : '<p class="muted detail-empty-tags">Belum ada tag.</p>';

    return '<div class="page page-detail">' +
      '<button type="button" class="back-link" data-action="back-detail">' + Utils.icon('arrow-left', 17) + 'Kembali</button>' +
      '<div class="detail-layout">' +
      '<article class="panel knowledge-detail">' +
      '<div class="detail-top">' + categoryPill(item.categoryId) + statusPill + '</div>' +
      '<h1>' + E(item.title) + '</h1>' +
      '<p class="detail-summary">' + (item.summary ? E(item.summary) : 'Belum ada ringkasan untuk pengetahuan ini.') + '</p>' +
      '<div class="detail-meta">' +
      '<span>' + Utils.icon('calendar', 15) + 'Dibuat ' + E(Utils.formatDate(item.createdAt)) + '</span>' +
      '<span>' + Utils.icon('clock', 15) + 'Diperbarui ' + E(Utils.formatDateTime(item.updatedAt)) + '</span>' +
      '<span>' + Utils.icon('file-text', 15) + Utils.formatNumber(wordCount) + ' kata</span>' +
      '</div>' +
      (item.archived ? '<div class="archive-banner">' + Utils.icon('archive', 18) + '<p>Pengetahuan ini sedang berada di arsip dan tidak muncul di daftar utama.</p><button type="button" class="btn btn-secondary btn-sm" data-action="restore-knowledge" data-id="' + E(item.id) + '">' + Utils.icon('rotate-ccw', 15) + 'Pulihkan</button></div>' : '') +
      '<div class="detail-divider"></div>' +
      '<div class="detail-content" id="detail-content"></div>' +
      '<div class="detail-tags"><span class="detail-tags-label">' + Utils.icon('tag', 15) + 'Tag</span>' + tagsHtml + '</div>' +
      '</article>' +
      '<aside class="detail-side">' +
      '<section class="panel detail-actions"><h2>Aksi</h2>' +
      '<button type="button" class="btn btn-primary btn-block" data-action="edit-knowledge" data-id="' + E(item.id) + '">' + Utils.icon('edit', 17) + 'Edit Pengetahuan</button>' +
      '<button type="button" class="btn btn-secondary btn-block" data-action="toggle-favorite" data-id="' + E(item.id) + '" aria-pressed="' + item.favorite + '">' + Utils.icon(item.favorite ? 'star-filled' : 'star', 17) + (item.favorite ? 'Hapus dari Favorit' : 'Tandai Favorit') + '</button>' +
      '<button type="button" class="btn btn-secondary btn-block" data-action="' + (item.archived ? 'restore-knowledge' : 'archive-knowledge') + '" data-id="' + E(item.id) + '">' + Utils.icon(item.archived ? 'rotate-ccw' : 'archive', 17) + (item.archived ? 'Pulihkan dari Arsip' : 'Arsipkan') + '</button>' +
      '<button type="button" class="btn btn-danger-ghost btn-block" data-action="delete-knowledge" data-id="' + E(item.id) + '">' + Utils.icon('trash', 17) + 'Hapus Pengetahuan</button>' +
      '</section>' +
      '<section class="panel detail-info"><h2>Informasi</h2><dl>' +
      '<div><dt>Kategori</dt><dd>' + E(category ? category.name : 'Tanpa Kategori') + '</dd></div>' +
      '<div><dt>Status</dt><dd>' + (item.archived ? 'Diarsipkan' : 'Aktif') + '</dd></div>' +
      '<div><dt>Favorit</dt><dd>' + (item.favorite ? 'Ya' : 'Tidak') + '</dd></div>' +
      '<div><dt>Dibuat</dt><dd>' + E(Utils.formatDate(item.createdAt)) + '</dd></div>' +
      '<div><dt>Diperbarui</dt><dd>' + E(Utils.formatDateTime(item.updatedAt)) + '</dd></div>' +
      '</dl></section>' +
      '</aside></div></div>';
  }

  function notFound() {
    return '<div class="page"><div class="empty-state panel not-found">' +
      '<span class="empty-icon">' + Utils.icon('file-text', 26) + '</span>' +
      '<h1>Halaman tidak ditemukan</h1><p>Tautan yang kamu buka tidak tersedia atau sudah dipindahkan.</p>' +
      '<div class="empty-actions"><a class="btn btn-primary" href="#/dashboard">Kembali ke Dashboard</a></div></div></div>';
  }

  window.UI = {
    SORT_LABELS: SORT_LABELS,
    categoryPill: categoryPill,
    tagList: tagList,
    favoriteButton: favoriteButton,
    viewSwitch: viewSwitch,
    emptyState: emptyState,
    dashboard: dashboard,
    knowledgePage: knowledgePage,
    favoritesPage: favoritesPage,
    recentPage: recentPage,
    archivePage: archivePage,
    categoriesPage: categoriesPage,
    settingsPage: settingsPage,
    detailPage: detailPage,
    notFound: notFound,
    formatBytes: formatBytes
  };
})();
