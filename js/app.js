/* Knowbase — pengendali aplikasi, navigasi, dan interaksi */
(function () {
  'use strict';

  const LIST_ROUTES = ['knowledge', 'favorites', 'recent', 'archive'];
  const NAV_ROUTES = ['dashboard', 'knowledge', 'favorites', 'recent', 'categories', 'archive', 'settings'];
  const ROUTE_TITLES = {
    dashboard: 'Dashboard',
    knowledge: 'Semua Pengetahuan',
    favorites: 'Favorit',
    recent: 'Terbaru',
    categories: 'Kategori',
    archive: 'Arsip',
    settings: 'Pengaturan'
  };

  const state = {
    prefs: Storage.getPreferences(),
    search: '',
    filters: null,
    currentRoute: { name: 'dashboard' },
    detailOrigin: '#/knowledge',
    modal: null,
    modalFocus: null,
    editor: null,
    categoryForm: null,
    importData: null,
    confirm: null,
    confirmFocus: null,
    profileOpen: false,
    saving: false
  };

  function defaultFilters() {
    return {
      category: 'all',
      status: 'active',
      favoriteOnly: false,
      sort: (state.prefs && state.prefs.sort) || 'updated-desc'
    };
  }

  state.filters = defaultFilters();

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  /* ---------- Notifikasi ---------- */

  function dismissToast(toast) {
    if (!toast || !toast.isConnected || toast.classList.contains('is-leaving')) return;
    toast.classList.add('is-leaving');
    window.setTimeout(function () { toast.remove(); }, 200);
  }

  function notify(message, type) {
    const root = $('#toast-root');
    if (!root) return;
    const tone = type || 'success';
    const map = { success: 'check-circle', error: 'alert-triangle', info: 'info', warning: 'alert-triangle' };
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + tone;
    toast.setAttribute('role', tone === 'error' ? 'alert' : 'status');

    const iconWrap = document.createElement('span');
    iconWrap.className = 'toast-icon';
    iconWrap.innerHTML = Utils.icon(map[tone] || 'info', 19);

    const text = document.createElement('p');
    text.className = 'toast-message';
    text.textContent = message;

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'toast-close';
    close.setAttribute('aria-label', 'Tutup notifikasi');
    close.innerHTML = Utils.icon('x', 15);
    close.addEventListener('click', function () { dismissToast(toast); });

    toast.appendChild(iconWrap);
    toast.appendChild(text);
    toast.appendChild(close);
    root.appendChild(toast);

    while (root.children.length > 4) {
      const oldest = root.firstElementChild;
      if (oldest === toast) break;
      oldest.remove();
    }
    window.setTimeout(function () { dismissToast(toast); }, 4800);
  }

  /* ---------- Navigasi dan render ---------- */

  function parseRoute() {
    let raw = window.location.hash.replace(/^#\/?/, '');
    if (!raw) return { name: 'dashboard' };
    try {
      const parts = raw.split('/').filter(Boolean).map(function (part) { return decodeURIComponent(part); });
      if (!parts.length) return { name: 'dashboard' };
      if (parts[0] === 'knowledge' && parts[1]) return { name: 'detail', id: parts[1] };
      if (NAV_ROUTES.includes(parts[0])) return { name: parts[0] };
      return { name: 'notfound' };
    } catch (error) {
      return { name: 'notfound' };
    }
  }

  function navigate(hash) {
    if (!hash) return;
    if (window.location.hash === hash) {
      state.currentRoute = parseRoute();
      renderCurrent({ scroll: false });
      return;
    }
    window.location.hash = hash;
  }

  function closeSidebar() {
    document.body.classList.remove('sidebar-open');
    const scrim = $('.sidebar-scrim');
    if (scrim) scrim.hidden = true;
    const menuBtn = $('.menu-btn');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
  }

  function openSidebar() {
    document.body.classList.add('sidebar-open');
    const scrim = $('.sidebar-scrim');
    if (scrim) scrim.hidden = false;
    const menuBtn = $('.menu-btn');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'true');
    const firstLink = $('#sidebar .nav-item');
    if (firstLink) window.setTimeout(function () { firstLink.focus(); }, 30);
  }

  function closeProfile() {
    state.profileOpen = false;
    const menu = $('#profile-menu');
    const button = $('#profile-button');
    if (menu) menu.hidden = true;
    if (button) button.setAttribute('aria-expanded', 'false');
  }

  function toggleProfile() {
    state.profileOpen = !state.profileOpen;
    const menu = $('#profile-menu');
    const button = $('#profile-button');
    if (menu) menu.hidden = !state.profileOpen;
    if (button) button.setAttribute('aria-expanded', String(state.profileOpen));
    if (state.profileOpen) {
      const first = menu && $('.menu-item', menu);
      if (first) window.setTimeout(function () { first.focus(); }, 20);
    }
  }

  function syncSearchUI() {
    const input = $('#global-search-input');
    const clear = $('[data-action="clear-search"]');
    const kbd = $('.search-kbd');
    if (input && input.value !== state.search) input.value = state.search;
    if (clear) clear.hidden = !state.search;
    if (kbd) kbd.hidden = Boolean(state.search);
  }

  function updateProfileUI() {
    const name = state.prefs.displayName || 'Pengguna Lokal';
    const initial = Utils.initials(name);
    $all('[data-profile-name]').forEach(function (element) { element.textContent = name; });
    $all('[data-profile-initial]').forEach(function (element) { element.textContent = initial; });
  }

  function activeNavRoute(route) {
    if (route.name === 'detail') {
      const origin = state.detailOrigin || '';
      if (origin.indexOf('#/favorites') === 0) return 'favorites';
      if (origin.indexOf('#/recent') === 0) return 'recent';
      if (origin.indexOf('#/archive') === 0) return 'archive';
      return 'knowledge';
    }
    return route.name;
  }

  function updateChrome() {
    const route = state.currentRoute;
    const active = activeNavRoute(route);
    $all('.nav-item[data-nav]').forEach(function (item) {
      const isActive = item.getAttribute('data-nav') === active;
      item.classList.toggle('is-active', isActive);
      if (isActive) item.setAttribute('aria-current', 'page');
      else item.removeAttribute('aria-current');
    });

    const stats = Knowledge.stats();
    const favBadge = $('[data-nav-count="favorites"]');
    const archiveBadge = $('[data-nav-count="archive"]');
    if (favBadge) {
      favBadge.textContent = String(stats.favorites);
      favBadge.hidden = stats.favorites === 0;
    }
    if (archiveBadge) {
      archiveBadge.textContent = String(stats.archived);
      archiveBadge.hidden = stats.archived === 0;
    }

    const summary = $('[data-storage-summary]');
    if (summary) {
      summary.textContent = Utils.formatNumber(stats.totalAll) + ' pengetahuan · ' + Utils.formatNumber(stats.categories) + ' kategori';
    }

    updateProfileUI();
    syncSearchUI();

    let title = ROUTE_TITLES[route.name] || 'Halaman tidak ditemukan';
    if (route.name === 'detail') {
      const item = Knowledge.get(route.id);
      title = item ? item.title : 'Tidak ditemukan';
    }
    document.title = title + ' — Knowbase';
  }

  function renderCurrent(options) {
    const opts = options || {};
    const main = $('#main-content');
    if (!main) return;
    const route = state.currentRoute;
    let html = '';
    let detailItem = null;

    try {
      switch (route.name) {
        case 'dashboard':
          html = UI.dashboard(state);
          break;
        case 'knowledge':
          html = UI.knowledgePage(state);
          break;
        case 'favorites':
          html = UI.favoritesPage(state);
          break;
        case 'recent':
          html = UI.recentPage(state);
          break;
        case 'archive':
          html = UI.archivePage(state);
          break;
        case 'categories':
          html = UI.categoriesPage();
          break;
        case 'settings':
          html = UI.settingsPage();
          break;
        case 'detail':
          detailItem = Knowledge.get(route.id);
          html = detailItem ? UI.detailPage(detailItem, state) : UI.notFound();
          break;
        default:
          html = UI.notFound();
      }
    } catch (error) {
      html = '<div class="page"><div class="empty-state panel"><span class="empty-icon">' +
        Utils.icon('alert-triangle', 26) + '</span><h1>Terjadi kesalahan</h1><p>' +
        Utils.escapeHtml(error.message || 'Data tidak dapat dimuat.') +
        '</p><div class="empty-actions"><a class="btn btn-secondary" href="#/dashboard">Kembali ke Dashboard</a></div></div></div>';
      notify('Sebagian data gagal dimuat. Periksa penyimpanan browser.', 'error');
    }

    main.innerHTML = html;

    if (route.name === 'detail') {
      const content = $('#detail-content', main);
      if (content) {
        if (detailItem && detailItem.content) {
          content.textContent = detailItem.content;
        } else if (detailItem) {
          content.textContent = 'Belum ada isi pengetahuan. Gunakan tombol Edit untuk mulai menulis.';
          content.classList.add('is-empty');
        }
      }
    }

    updateChrome();
    if (opts.scroll) window.scrollTo(0, 0);
  }

  function handleRouteChange() {
    const previous = state.currentRoute;
    const route = parseRoute();
    if (route.name === 'detail' && previous.name !== 'detail') {
      if (LIST_ROUTES.includes(previous.name)) state.detailOrigin = '#/' + previous.name;
      else if (previous.name === 'dashboard') state.detailOrigin = '#/dashboard';
      else state.detailOrigin = '#/knowledge';
    }
    state.currentRoute = route;
    closeSidebar();
    closeProfile();
    renderCurrent({ scroll: true });
  }

  function resetListState() {
    state.search = '';
    state.filters = defaultFilters();
    syncSearchUI();
  }

  /* ---------- Toast/konfirmasi ---------- */

  function syncBodyLock() {
    document.body.classList.toggle('modal-open', Boolean(state.modal || state.confirm));
  }

  function openConfirm(config) {
    if (state.confirm) return;
    state.confirm = config;
    state.confirmFocus = document.activeElement;
    const root = $('#dialog-root');
    root.innerHTML = Modals.confirm(config);
    syncBodyLock();
    window.setTimeout(function () {
      const cancel = $('[data-action="cancel-confirm"]', root);
      if (cancel) cancel.focus();
    }, 20);
  }

  function closeConfirm() {
    const focusTarget = state.confirmFocus;
    state.confirm = null;
    state.confirmFocus = null;
    const root = $('#dialog-root');
    if (root) root.innerHTML = '';
    syncBodyLock();
    if (focusTarget && focusTarget.isConnected) {
      window.setTimeout(function () { focusTarget.focus(); }, 0);
    }
  }

  function acceptConfirm() {
    if (!state.confirm) return;
    const action = state.confirm.onConfirm;
    closeConfirm();
    if (typeof action === 'function') {
      try {
        action();
      } catch (error) {
        notify(error.message || 'Tindakan gagal dijalankan.', 'error');
      }
    }
  }

  function restoreModalFocus() {
    const target = state.modalFocus;
    state.modalFocus = null;
    if (target && target.isConnected) {
      window.setTimeout(function () { target.focus(); }, 0);
    }
  }

  function openModal(kind, html, focusSelector) {
    state.modalFocus = document.activeElement;
    state.modal = kind;
    const root = $('#modal-root');
    root.innerHTML = html;
    syncBodyLock();
    if (focusSelector) {
      window.setTimeout(function () {
        const target = $(focusSelector, root);
        if (target) {
          target.focus();
          if (typeof target.select === 'function' && target.tagName !== 'SELECT') target.select();
        }
      }, 30);
    }
  }

  function closeModal() {
    const root = $('#modal-root');
    if (root) root.innerHTML = '';
    state.modal = null;
    state.editor = null;
    state.categoryForm = null;
    state.importData = null;
    state.saving = false;
    syncBodyLock();
    restoreModalFocus();
  }

  /* ---------- Editor pengetahuan ---------- */

  function openEditor(id) {
    let item = null;
    if (id) {
      item = Knowledge.get(id);
      if (!item) {
        notify('Pengetahuan tidak ditemukan. Mungkin sudah dihapus.', 'error');
        renderCurrent({ scroll: false });
        return;
      }
    }
    closeProfile();
    state.editor = {
      id: item ? item.id : null,
      title: item ? item.title : '',
      summary: item ? item.summary : '',
      content: item ? item.content : '',
      categoryId: item ? item.categoryId : null,
      tags: item ? item.tags.slice() : [],
      dirty: false
    };
    openModal('editor', Modals.editor(state.editor), '#editor-title');
  }

  function updateEditorDirtyUI() {
    const indicator = $('#editor-dirty-indicator');
    if (indicator) indicator.hidden = !(state.editor && state.editor.dirty);
  }

  function markEditorDirty() {
    if (!state.editor) return;
    state.editor.dirty = true;
    updateEditorDirtyUI();
  }

  function hideEditorError() {
    const error = $('#editor-form-error');
    if (error) {
      error.hidden = true;
      error.textContent = '';
    }
    const title = $('#editor-title');
    if (title) title.removeAttribute('aria-invalid');
  }

  function showEditorError(message) {
    const error = $('#editor-form-error');
    if (error) {
      error.textContent = message;
      error.hidden = false;
    }
    const title = $('#editor-title');
    if (title) {
      title.setAttribute('aria-invalid', 'true');
      title.focus();
    }
  }

  function requestCloseEditor() {
    if (!state.editor || state.saving) return;
    if (state.editor.dirty) {
      openConfirm({
        title: 'Buang perubahan?',
        message: 'Perubahan pada editor belum disimpan dan akan hilang jika kamu menutupnya sekarang.',
        confirmLabel: 'Buang Perubahan',
        cancelLabel: 'Lanjut Mengedit',
        tone: 'danger',
        onConfirm: closeModal
      });
      return;
    }
    closeModal();
  }

  function addEditorTag() {
    if (!state.editor) return;
    const input = $('#editor-tag-input');
    if (!input) return;
    const raw = input.value;
    if (!raw.trim()) {
      input.focus();
      return;
    }
    const pieces = raw.split(',').map(function (piece) { return piece.trim(); }).filter(Boolean);
    let duplicate = 0;
    let overflow = 0;
    pieces.forEach(function (piece) {
      if (state.editor.tags.length >= Knowledge.MAX_TAGS) {
        overflow += 1;
        return;
      }
      const candidate = Utils.normalizeTags([piece])[0];
      if (!candidate) return;
      const exists = state.editor.tags.some(function (tag) {
        return tag.toLocaleLowerCase('id-ID') === candidate.toLocaleLowerCase('id-ID');
      });
      if (exists) {
        duplicate += 1;
        return;
      }
      state.editor.tags.push(candidate);
    });
    input.value = '';
    const chips = $('#editor-tag-chips');
    if (chips) chips.innerHTML = Modals.tagChips(state.editor.tags);
    markEditorDirty();
    if (overflow) notify('Maksimal ' + Knowledge.MAX_TAGS + ' tag per pengetahuan.', 'info');
    else if (duplicate && pieces.length === duplicate) notify('Tag tersebut sudah ada.', 'info');
    input.focus();
  }

  function removeEditorTag(index) {
    if (!state.editor || !Number.isInteger(index)) return;
    if (index < 0 || index >= state.editor.tags.length) return;
    state.editor.tags.splice(index, 1);
    const chips = $('#editor-tag-chips');
    if (chips) chips.innerHTML = Modals.tagChips(state.editor.tags);
    markEditorDirty();
    const input = $('#editor-tag-input');
    if (input) input.focus();
  }

  function submitEditor(form) {
    if (!state.editor || state.saving) return;
    const titleInput = $('#editor-title', form);
    const summaryInput = $('#editor-summary', form);
    const contentInput = $('#editor-content', form);
    const categoryInput = $('#editor-category', form);
    const tagInput = $('#editor-tag-input', form);
    if (!titleInput) return;

    const title = titleInput.value.replace(/\s+/g, ' ').trim();
    hideEditorError();
    if (!title) {
      showEditorError('Judul pengetahuan wajib diisi.');
      return;
    }
    if (title.length > Knowledge.MAX_TITLE) {
      showEditorError('Judul maksimal ' + Knowledge.MAX_TITLE + ' karakter.');
      return;
    }

    const pendingTags = tagInput && tagInput.value ? tagInput.value.split(',') : [];
    const tags = Utils.normalizeTags(state.editor.tags.concat(pendingTags));
    const payload = {
      title: title,
      summary: summaryInput ? summaryInput.value : '',
      content: contentInput ? contentInput.value : '',
      categoryId: categoryInput ? categoryInput.value : null,
      tags: tags
    };

    const submitButton = $('#editor-save-btn', form);
    const originalLabel = submitButton ? submitButton.innerHTML : '';
    state.saving = true;
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = state.editor.id ? 'Menyimpan…' : 'Menambahkan…';
    }

    try {
      let saved;
      const editingId = state.editor.id;
      if (editingId) {
        saved = Knowledge.update(editingId, payload);
      } else {
        saved = Knowledge.create(payload);
      }
      state.editor.dirty = false;
      closeModal();
      notify(editingId ? 'Perubahan pengetahuan berhasil disimpan.' : 'Pengetahuan baru berhasil ditambahkan.', 'success');
      if (!editingId) {
        navigate('#/knowledge/' + encodeURIComponent(saved.id));
      } else {
        renderCurrent({ scroll: false });
      }
    } catch (error) {
      state.saving = false;
      if (submitButton && submitButton.isConnected) {
        submitButton.disabled = false;
        submitButton.innerHTML = originalLabel;
      }
      showEditorError(error.message || 'Pengetahuan gagal disimpan.');
      notify(error.message || 'Pengetahuan gagal disimpan.', 'error');
    }
  }

  /* ---------- Kategori ---------- */

  function openCategoryModal(id) {
    let category = null;
    if (id) {
      category = Categories.get(id);
      if (!category) {
        notify('Kategori tidak ditemukan.', 'error');
        return;
      }
    }
    state.categoryForm = {
      id: category ? category.id : null,
      name: category ? category.name : '',
      color: category ? category.color : Categories.PALETTE[0].value
    };
    openModal('category', Modals.category(state.categoryForm), '#category-name');
  }

  function submitCategory(form) {
    if (!state.categoryForm) return;
    const nameInput = $('#category-name', form);
    const errorEl = $('#category-form-error', form);
    const colorInput = form.querySelector('input[name="categoryColor"]:checked');
    if (!nameInput) return;
    if (errorEl) {
      errorEl.hidden = true;
      errorEl.textContent = '';
    }
    const payload = {
      name: nameInput.value,
      color: colorInput ? colorInput.value : Categories.PALETTE[0].value
    };
    const submitButton = $('#category-save-btn', form);
    if (submitButton) submitButton.disabled = true;
    try {
      if (state.categoryForm.id) {
        Categories.update(state.categoryForm.id, payload);
        notify('Kategori berhasil diperbarui.', 'success');
      } else {
        Categories.create(payload);
        notify('Kategori baru berhasil dibuat.', 'success');
      }
      state.categoryForm = null;
      closeModal();
      renderCurrent({ scroll: false });
    } catch (error) {
      if (errorEl) {
        errorEl.textContent = error.message;
        errorEl.hidden = false;
      }
      if (submitButton) submitButton.disabled = false;
      nameInput.focus();
    }
  }

  function confirmDeleteCategory(id) {
    const category = Categories.get(id);
    if (!category) {
      notify('Kategori tidak ditemukan.', 'error');
      return;
    }
    const affected = Categories.deleteImpact(id);
    openConfirm({
      title: 'Hapus kategori?',
      message: affected > 0
        ? 'Kategori “' + category.name + '” digunakan oleh ' + affected + ' pengetahuan. Pengetahuan tersebut tidak akan dihapus, tetapi akan dipindahkan ke Tanpa Kategori.'
        : 'Kategori “' + category.name + '” tidak digunakan oleh pengetahuan mana pun dan akan dihapus.',
      confirmLabel: 'Hapus Kategori',
      tone: 'danger',
      onConfirm: function () {
        const result = Categories.remove(id);
        notify('Kategori “' + result.category.name + '” dihapus' + (result.reassigned ? '. ' + result.reassigned + ' pengetahuan dipindahkan ke Tanpa Kategori.' : '.'), 'success');
        renderCurrent({ scroll: false });
      }
    });
  }

  /* ---------- Aksi pengetahuan ---------- */

  function toggleFavorite(id) {
    const item = Knowledge.get(id);
    if (!item) {
      notify('Pengetahuan tidak ditemukan.', 'error');
      return;
    }
    try {
      const updated = Knowledge.toggleFavorite(id);
      notify(updated.favorite ? '“' + updated.title + '” ditambahkan ke favorit.' : '“' + updated.title + '” dihapus dari favorit.', 'success');
      renderCurrent({ scroll: false });
    } catch (error) {
      notify(error.message, 'error');
    }
  }

  function archiveKnowledge(id) {
    const item = Knowledge.get(id);
    if (!item) {
      notify('Pengetahuan tidak ditemukan.', 'error');
      return;
    }
    try {
      Knowledge.setArchived(id, true);
      notify('“' + item.title + '” dipindahkan ke arsip.', 'success');
      renderCurrent({ scroll: false });
    } catch (error) {
      notify(error.message, 'error');
    }
  }

  function restoreKnowledge(id) {
    const item = Knowledge.get(id);
    if (!item) {
      notify('Pengetahuan tidak ditemukan.', 'error');
      return;
    }
    try {
      Knowledge.setArchived(id, false);
      notify('“' + item.title + '” dipulihkan dari arsip.', 'success');
      renderCurrent({ scroll: false });
    } catch (error) {
      notify(error.message, 'error');
    }
  }

  function confirmDeleteKnowledge(id, permanent) {
    const item = Knowledge.get(id);
    if (!item) {
      notify('Pengetahuan tidak ditemukan.', 'error');
      return;
    }
    openConfirm({
      title: permanent ? 'Hapus permanen?' : 'Hapus pengetahuan?',
      message: '“' + item.title + '” akan dihapus secara permanen' + (item.archived ? ' dari arsip' : '') + '. Tindakan ini tidak dapat dibatalkan.',
      confirmLabel: 'Hapus Permanen',
      tone: 'danger',
      onConfirm: function () {
        const wasDetail = state.currentRoute.name === 'detail';
        Knowledge.remove(id);
        notify('Pengetahuan “' + item.title + '” telah dihapus.', 'success');
        if (wasDetail) {
          const target = state.detailOrigin && state.detailOrigin.indexOf('#/') === 0 ? state.detailOrigin : '#/knowledge';
          closeProfile();
          if (window.location.hash === target) renderCurrent({ scroll: false });
          else navigate(target);
        } else {
          renderCurrent({ scroll: false });
        }
      }
    });
  }

  /* ---------- Filter dan tampilan ---------- */

  function setView(view) {
    if (view !== 'cards' && view !== 'list') return;
    state.prefs.viewMode = view;
    try {
      state.prefs = Storage.savePreferences({ viewMode: view });
    } catch (error) {
      notify(error.message, 'error');
    }
    renderCurrent({ scroll: false });
  }

  function updateFilter(field, value) {
    if (!field) return;
    if (field === 'sort') {
      if (!Storage.SORT_OPTIONS.includes(value)) return;
      state.filters.sort = value;
      try {
        state.prefs = Storage.savePreferences({ sort: value });
      } catch (error) {
        notify(error.message, 'error');
      }
    } else if (field === 'category') {
      state.filters.category = value;
    } else if (field === 'status') {
      state.filters.status = value;
    }
    renderCurrent({ scroll: false });
  }

  function clearFilters() {
    state.search = '';
    state.filters = defaultFilters();
    syncSearchUI();
    renderCurrent({ scroll: false });
  }

  function runGlobalSearch(value) {
    state.search = value;
    syncSearchUI();
    if (state.currentRoute.name === 'knowledge') {
      renderCurrent({ scroll: false });
      return;
    }
    state.filters = defaultFilters();
    if (window.location.hash === '#/knowledge') {
      state.currentRoute = { name: 'knowledge' };
      renderCurrent({ scroll: false });
    } else {
      navigate('#/knowledge');
    }
  }

  function clearSearch() {
    state.search = '';
    syncSearchUI();
    if (LIST_ROUTES.includes(state.currentRoute.name)) renderCurrent({ scroll: false });
  }

  function viewCategory(categoryId) {
    state.search = '';
    state.filters = {
      category: categoryId,
      status: 'all',
      favoriteOnly: false,
      sort: state.prefs.sort || 'updated-desc'
    };
    syncSearchUI();
    navigate('#/knowledge');
  }

  function dismissDemoNotice() {
    try {
      state.prefs = Storage.savePreferences({ demoNoticeDismissed: true });
      renderCurrent({ scroll: false });
    } catch (error) {
      notify(error.message, 'error');
    }
  }

  /* ---------- Pengaturan, ekspor, impor, reset ---------- */

  function exportData() {
    try {
      const data = Storage.exportData();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      const stamp = new Date().toISOString().slice(0, 10);
      anchor.href = url;
      anchor.download = 'knowbase-backup-' + stamp + '.json';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
      notify('Cadangan data berhasil diekspor.', 'success');
    } catch (error) {
      notify('Ekspor gagal: ' + error.message, 'error');
    }
  }

  function triggerImportPicker() {
    const input = $('#import-file-input');
    if (!input) {
      notify('Pilih halaman Pengaturan terlebih dahulu untuk mengimpor data.', 'info');
      return;
    }
    input.click();
  }

  function validateImportPayload(payload) {
    const errors = [];
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return { ok: false, errors: ['Berkas tidak berisi objek data yang valid.'] };
    }
    if (payload.app !== 'Knowbase') {
      errors.push('Berkas bukan cadangan Knowbase yang dikenali.');
    }
    if (!Number.isInteger(payload.schemaVersion) || payload.schemaVersion < 1) {
      errors.push('Versi skema berkas tidak valid.');
    } else if (payload.schemaVersion > Storage.SCHEMA_VERSION) {
      errors.push('Berkas memakai skema v' + payload.schemaVersion + ', lebih baru dari versi aplikasi ini (v' + Storage.SCHEMA_VERSION + ').');
    }
    if (!Array.isArray(payload.knowledge)) errors.push('Daftar pengetahuan tidak ditemukan.');
    if (!Array.isArray(payload.categories)) errors.push('Daftar kategori tidak ditemukan.');
    if (errors.length) return { ok: false, errors: errors };

    const categories = [];
    const categoryIds = new Set();
    const categoryNames = new Set();
    payload.categories.forEach(function (raw, index) {
      const number = index + 1;
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        errors.push('Kategori #' + number + ' tidak valid.');
        return;
      }
      const id = typeof raw.id === 'string' ? raw.id.trim() : '';
      if (!id) {
        errors.push('Kategori #' + number + ' tidak memiliki ID.');
        return;
      }
      if (categoryIds.has(id)) {
        errors.push('Kategori #' + number + ' memakai ID ganda: ' + id + '.');
        return;
      }
      const name = typeof raw.name === 'string' ? raw.name.replace(/\s+/g, ' ').trim() : '';
      if (!name) {
        errors.push('Kategori #' + number + ' tidak memiliki nama.');
        return;
      }
      if (name.length > 40) {
        errors.push('Kategori #' + number + ' memiliki nama lebih dari 40 karakter.');
        return;
      }
      if (name.toLocaleLowerCase('id-ID') === 'tanpa kategori') {
        errors.push('Kategori #' + number + ' memakai nama cadangan “Tanpa Kategori”.');
        return;
      }
      const nameKey = name.toLocaleLowerCase('id-ID');
      if (categoryNames.has(nameKey)) {
        errors.push('Kategori #' + number + ' memiliki nama ganda: ' + name + '.');
        return;
      }
      if (typeof raw.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(raw.color)) {
        errors.push('Kategori #' + number + ' memiliki warna yang tidak valid.');
        return;
      }
      categoryIds.add(id);
      categoryNames.add(nameKey);
      categories.push({
        id: id,
        name: name,
        color: Categories.normalizeColor(raw.color),
        createdAt: Utils.isValidDate(raw.createdAt) ? new Date(raw.createdAt).toISOString() : new Date().toISOString()
      });
    });

    const knowledge = [];
    const knowledgeIds = new Set();
    payload.knowledge.forEach(function (raw, index) {
      const number = index + 1;
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        errors.push('Pengetahuan #' + number + ' tidak valid.');
        return;
      }
      const normalized = Knowledge.normalizeKnowledge(raw);
      if (!normalized) {
        errors.push('Pengetahuan #' + number + ' wajib memiliki ID dan judul.');
        return;
      }
      if (knowledgeIds.has(normalized.id)) {
        errors.push('Pengetahuan #' + number + ' memakai ID ganda: ' + normalized.id + '.');
        return;
      }
      knowledgeIds.add(normalized.id);
      knowledge.push(normalized);
    });

    if (errors.length) return { ok: false, errors: errors };
    return {
      ok: true,
      data: { knowledge: knowledge, categories: categories },
      meta: {
        app: payload.app,
        schemaVersion: payload.schemaVersion,
        exportedAt: payload.exportedAt || null
      }
    };
  }

  function handleImportFile(file) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      notify('Ukuran berkas terlalu besar. Maksimal 5 MB.', 'error');
      return;
    }
    const reader = file.text();
    reader.then(function (text) {
      let payload;
      try {
        payload = JSON.parse(String(text).replace(/^\uFEFF/, ''));
      } catch (error) {
        notify('Berkas bukan JSON yang valid.', 'error');
        return;
      }
      const validation = validateImportPayload(payload);
      if (!validation.ok) {
        const extra = validation.errors.length > 1 ? ' (+' + (validation.errors.length - 1) + ' masalah lain)' : '';
        notify('Impor gagal: ' + validation.errors[0] + extra, 'error');
        return;
      }
      state.importData = {
        fileName: file.name,
        result: validation
      };
      openModal('import', Modals.import(state.importData), 'input[name="importMode"]:checked');
    }).catch(function () {
      notify('Berkas tidak dapat dibaca.', 'error');
    });
  }

  function applyImport(nextCategories, nextKnowledge) {
    const previousCategories = Storage.getCategories();
    const previousKnowledge = Storage.getKnowledge();
    try {
      Storage.writeCategories(nextCategories);
      Storage.writeKnowledge(nextKnowledge);
    } catch (error) {
      try {
        Storage.writeCategories(previousCategories);
        Storage.writeKnowledge(previousKnowledge);
      } catch (rollbackError) {
        /* cadangan lama tidak dapat ditulis ulang; pesan utama tetap ditampilkan */
      }
      throw error;
    }
  }

  function performImport(mode) {
    if (!state.importData) return;
    const imported = state.importData.result.data;
    try {
      let message = '';
      if (mode === 'replace') {
        const categoryIds = new Set(imported.categories.map(function (category) { return category.id; }));
        const nextKnowledge = imported.knowledge.map(function (item) {
          return Object.assign({}, item, {
            categoryId: item.categoryId && categoryIds.has(item.categoryId) ? item.categoryId : null
          });
        });
        applyImport(imported.categories, nextKnowledge);
        message = 'Data berhasil diganti dengan ' + nextKnowledge.length + ' pengetahuan dan ' + imported.categories.length + ' kategori.';
      } else {
        const existingCategories = Categories.all();
        const existingKnowledge = Knowledge.all();
        const byCategoryId = new Map();
        const byCategoryName = new Map();
        existingCategories.forEach(function (category) {
          byCategoryId.set(category.id, category);
          byCategoryName.set(category.name.toLocaleLowerCase('id-ID'), category);
        });
        const mergedCategories = existingCategories.slice();
        const categoryMap = new Map();
        imported.categories.forEach(function (category) {
          let target = byCategoryId.get(category.id);
          if (!target) target = byCategoryName.get(category.name.toLocaleLowerCase('id-ID'));
          if (!target) {
            target = category;
            mergedCategories.push(category);
            byCategoryId.set(category.id, category);
            byCategoryName.set(category.name.toLocaleLowerCase('id-ID'), category);
          }
          categoryMap.set(category.id, target.id);
        });

        const mergedKnowledge = existingKnowledge.slice();
        const indexById = new Map();
        mergedKnowledge.forEach(function (item, index) { indexById.set(item.id, index); });
        let added = 0;
        let updated = 0;
        let skipped = 0;

        imported.knowledge.forEach(function (item) {
          const next = Object.assign({}, item, {
            categoryId: item.categoryId ? (categoryMap.get(item.categoryId) || null) : null
          });
          if (indexById.has(next.id)) {
            const index = indexById.get(next.id);
            const current = mergedKnowledge[index];
            if (new Date(next.updatedAt).getTime() > new Date(current.updatedAt).getTime()) {
              mergedKnowledge[index] = next;
              updated += 1;
            } else {
              skipped += 1;
            }
          } else {
            indexById.set(next.id, mergedKnowledge.length);
            mergedKnowledge.push(next);
            added += 1;
          }
        });

        applyImport(mergedCategories, mergedKnowledge);
        message = 'Impor selesai: ' + added + ' ditambahkan, ' + updated + ' diperbarui, ' + skipped + ' dilewati.';
      }

      closeModal();
      state.search = '';
      state.filters = defaultFilters();
      syncSearchUI();
      renderCurrent({ scroll: false });
      notify(message, 'success');
    } catch (error) {
      notify('Impor gagal: ' + error.message, 'error');
    }
  }

  function submitImport(form) {
    if (!state.importData) return;
    const selected = form.querySelector('input[name="importMode"]:checked');
    const mode = selected ? selected.value : 'merge';
    if (mode === 'replace') {
      const stats = Knowledge.stats();
      const categoryCount = Categories.all().length;
      const imported = state.importData.result.data;
      openConfirm({
        title: 'Ganti seluruh data?',
        message: 'Data saat ini (' + stats.totalAll + ' pengetahuan dan ' + categoryCount + ' kategori) akan dihapus, lalu diganti dengan ' + imported.knowledge.length + ' pengetahuan dan ' + imported.categories.length + ' kategori dari berkas. Tindakan ini tidak dapat dibatalkan.',
        confirmLabel: 'Ganti Data',
        tone: 'danger',
        onConfirm: function () { performImport('replace'); }
      });
      return;
    }
    performImport('merge');
  }

  function confirmReset() {
    const stats = Knowledge.stats();
    const categoryCount = Categories.all().length;
    openConfirm({
      title: 'Reset seluruh data?',
      message: 'Semua data di browser ini akan dihapus: ' + stats.totalAll + ' pengetahuan, ' + categoryCount + ' kategori, dan preferensi pengguna. Ekspor cadangan terlebih dahulu jika masih diperlukan. Tindakan ini tidak dapat dibatalkan.',
      confirmLabel: 'Hapus Semua Data',
      tone: 'danger',
      onConfirm: function () {
        Storage.resetAll();
        state.prefs = Storage.getPreferences();
        state.search = '';
        state.filters = defaultFilters();
        closeProfile();
        syncSearchUI();
        notify('Seluruh data berhasil direset.', 'success');
        if (window.location.hash === '#/dashboard') {
          state.currentRoute = { name: 'dashboard' };
          renderCurrent({ scroll: true });
        } else {
          navigate('#/dashboard');
        }
      }
    });
  }

  function confirmLoadDemo() {
    openConfirm({
      title: 'Muat data contoh?',
      message: 'Delapan pengetahuan contoh dan lima kategori akan ditambahkan ke ruang kerja kosong ini. Semua data contoh dapat diedit atau dihapus seperti data biasa.',
      confirmLabel: 'Muat Data Contoh',
      tone: 'primary',
      onConfirm: function () {
        try {
          const result = Storage.loadDemoData({ resetPreferences: false });
          state.prefs = Storage.getPreferences();
          state.search = '';
          state.filters = defaultFilters();
          syncSearchUI();
          notify(result.knowledge + ' pengetahuan contoh berhasil dimuat.', 'success');
          state.currentRoute = { name: 'dashboard' };
          if (window.location.hash !== '#/dashboard') navigate('#/dashboard');
          else renderCurrent({ scroll: true });
        } catch (error) {
          notify(error.message, 'error');
        }
      }
    });
  }

  function submitProfile(form) {
    const input = $('#settings-display-name', form);
    if (!input) return;
    const value = input.value.replace(/\s+/g, ' ').trim();
    if (!value) {
      notify('Nama tampilan wajib diisi.', 'error');
      input.focus();
      return;
    }
    if (value.length > 40) {
      notify('Nama tampilan maksimal 40 karakter.', 'error');
      input.focus();
      return;
    }
    try {
      state.prefs = Storage.savePreferences({ displayName: value });
      input.value = state.prefs.displayName;
      updateChrome();
      notify('Profil berhasil diperbarui.', 'success');
    } catch (error) {
      notify(error.message, 'error');
    }
  }

  /* ---------- Penanganan event ---------- */

  function handleAction(actionEl) {
    const action = actionEl.getAttribute('data-action');
    const id = actionEl.getAttribute('data-id');
    switch (action) {
      case 'open-sidebar': openSidebar(); break;
      case 'close-sidebar': closeSidebar(); break;
      case 'toggle-profile': toggleProfile(); break;
      case 'new-knowledge': openEditor(null); break;
      case 'edit-knowledge': openEditor(id); break;
      case 'request-close-editor': requestCloseEditor(); break;
      case 'add-editor-tag': addEditorTag(); break;
      case 'remove-editor-tag': removeEditorTag(Number(actionEl.getAttribute('data-index'))); break;
      case 'toggle-favorite': toggleFavorite(id); break;
      case 'archive-knowledge': archiveKnowledge(id); break;
      case 'restore-knowledge': restoreKnowledge(id); break;
      case 'delete-knowledge': confirmDeleteKnowledge(id, false); break;
      case 'delete-permanent': confirmDeleteKnowledge(id, true); break;
      case 'back-detail': navigate(state.detailOrigin || '#/knowledge'); break;
      case 'set-view': setView(actionEl.getAttribute('data-view')); break;
      case 'toggle-favorite-filter':
        state.filters.favoriteOnly = !state.filters.favoriteOnly;
        renderCurrent({ scroll: false });
        break;
      case 'clear-filters': clearFilters(); break;
      case 'clear-search': clearSearch(); break;
      case 'dismiss-demo': dismissDemoNotice(); break;
      case 'new-category': openCategoryModal(null); break;
      case 'edit-category': openCategoryModal(id); break;
      case 'close-category-modal': closeModal(); break;
      case 'delete-category': confirmDeleteCategory(id); break;
      case 'view-category': viewCategory(id); break;
      case 'view-uncategorized': viewCategory('none'); break;
      case 'export-data': closeProfile(); exportData(); break;
      case 'import-data': closeProfile(); triggerImportPicker(); break;
      case 'close-import-modal': closeModal(); break;
      case 'reset-data': closeProfile(); confirmReset(); break;
      case 'load-demo-data': closeProfile(); confirmLoadDemo(); break;
      case 'cancel-confirm': closeConfirm(); break;
      case 'confirm-accept': acceptConfirm(); break;
      default: break;
    }
  }

  function handleClick(event) {
    const navLink = event.target.closest('a[data-nav]');
    if (navLink) {
      resetListState();
      closeSidebar();
      closeProfile();
      if (window.location.hash === navLink.getAttribute('href')) {
        state.currentRoute = parseRoute();
        renderCurrent({ scroll: true });
      }
    } else if (event.target.closest('a.brand-link')) {
      resetListState();
      closeSidebar();
    }

    if (event.target.closest('#profile-menu a')) {
      resetListState();
      closeProfile();
    }

    const actionEl = event.target.closest('[data-action]');
    if (actionEl) {
      handleAction(actionEl);
    } else {
      const backdrop = event.target.closest('.modal-backdrop');
      if (backdrop && event.target === backdrop) {
        if (backdrop.getAttribute('data-backdrop') === 'editor') requestCloseEditor();
        else closeModal();
      }
    }

    if (!event.target.closest('.profile-wrap')) closeProfile();
  }

  function handleSubmit(event) {
    const form = event.target;
    if (form.id === 'global-search-form') {
      event.preventDefault();
      const input = $('#global-search-input');
      runGlobalSearch(input ? input.value : '');
      if (input) input.blur();
      return;
    }
    if (form.id === 'quick-search-form') {
      event.preventDefault();
      const input = $('#quick-search-input');
      state.search = input ? input.value : '';
      state.filters = defaultFilters();
      syncSearchUI();
      navigate('#/knowledge');
      return;
    }
    if (form.id === 'editor-form') {
      event.preventDefault();
      submitEditor(form);
      return;
    }
    if (form.id === 'category-form') {
      event.preventDefault();
      submitCategory(form);
      return;
    }
    if (form.id === 'settings-profile-form') {
      event.preventDefault();
      submitProfile(form);
      return;
    }
    if (form.id === 'import-form') {
      event.preventDefault();
      submitImport(form);
    }
  }

  function handleInput(event) {
    const target = event.target;
    if (target.id === 'global-search-input') {
      state.search = target.value;
      syncSearchUI();
      if (state.currentRoute.name === 'knowledge') {
        renderCurrent({ scroll: false });
      } else if (target.value.trim()) {
        runGlobalSearch(target.value);
      }
      return;
    }
    if (target.closest('#editor-form')) {
      markEditorDirty();
      hideEditorError();
      if (target.id === 'editor-summary') {
        const counter = $('#editor-summary-count');
        if (counter) counter.textContent = target.value.length + '/' + Knowledge.MAX_SUMMARY;
      } else if (target.id === 'editor-content') {
        const stats = $('#editor-content-stats');
        if (stats) stats.textContent = Utils.countWords(target.value) + ' kata · ' + target.value.length + ' karakter';
      }
    }
  }

  function handleChange(event) {
    const target = event.target;
    if (target.matches('select[data-filter]')) {
      updateFilter(target.getAttribute('data-filter'), target.value);
      return;
    }
    if (target.closest('#editor-form')) {
      markEditorDirty();
      return;
    }
    if (target.id === 'import-file-input') {
      const file = target.files && target.files[0];
      target.value = '';
      if (file) handleImportFile(file);
    }
  }

  function isTypingTarget(target) {
    if (!target) return false;
    const tag = target.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
  }

  function focusSearch() {
    const input = $('#global-search-input');
    if (input) {
      input.focus();
      input.select();
    }
  }

  function trapFocus(event) {
    const container = state.confirm ? $('#dialog-root') : (state.modal ? $('#modal-root') : null);
    if (!container) return;
    const focusables = $all('a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])', container)
      .filter(function (element) { return element.getClientRects().length > 0; });
    if (!focusables.length) {
      event.preventDefault();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey) {
      if (document.activeElement === first || !container.contains(document.activeElement)) {
        event.preventDefault();
        last.focus();
      }
    } else if (document.activeElement === last || !container.contains(document.activeElement)) {
      event.preventDefault();
      first.focus();
    }
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      if (state.confirm) {
        event.preventDefault();
        closeConfirm();
        return;
      }
      if (state.modal) {
        event.preventDefault();
        if (state.modal === 'editor') requestCloseEditor();
        else closeModal();
        return;
      }
      if (state.profileOpen) {
        closeProfile();
        return;
      }
      if (document.body.classList.contains('sidebar-open')) {
        closeSidebar();
        return;
      }
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase('id-ID') === 'k') {
      event.preventDefault();
      focusSearch();
      return;
    }

    if (event.key === '/' && !isTypingTarget(event.target) && !state.modal && !state.confirm) {
      event.preventDefault();
      focusSearch();
      return;
    }

    if (event.key === 'Tab' && (state.modal || state.confirm)) {
      trapFocus(event);
      return;
    }

    if (state.modal === 'editor') {
      const target = event.target;
      if (target.id === 'editor-tag-input') {
        if (event.key === 'Enter' || event.key === ',') {
          event.preventDefault();
          addEditorTag();
          return;
        }
        if (event.key === 'Backspace' && !target.value && state.editor && state.editor.tags.length) {
          event.preventDefault();
          removeEditorTag(state.editor.tags.length - 1);
          return;
        }
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        const form = $('#editor-form');
        if (form && typeof form.requestSubmit === 'function') form.requestSubmit();
      }
    }
  }

  function bindEvents() {
    document.addEventListener('click', handleClick);
    document.addEventListener('submit', handleSubmit);
    document.addEventListener('input', handleInput);
    document.addEventListener('change', handleChange);
    document.addEventListener('keydown', handleKeydown);
    window.addEventListener('hashchange', handleRouteChange);
    window.addEventListener('beforeunload', function (event) {
      if (state.editor && state.editor.dirty) {
        event.preventDefault();
        event.returnValue = '';
        return '';
      }
      return undefined;
    });
    window.addEventListener('resize', Utils.debounce(function () {
      if (window.innerWidth > 1024) closeSidebar();
    }, 150));
  }

  function boot() {
    Utils.hydrateIcons(document);
    let bootError = null;
    try {
      Storage.initialize();
    } catch (error) {
      bootError = error.message || 'Data awal tidak dapat disiapkan.';
    }
    state.prefs = Storage.getPreferences();
    state.filters = defaultFilters();
    if (!window.location.hash) {
      window.history.replaceState(null, '', '#/dashboard');
    }
    state.currentRoute = parseRoute();
    bindEvents();
    renderCurrent({ scroll: false });

    const issues = Storage.consumeIssues();
    if (bootError) notify(bootError, 'error');
    if (issues.length) {
      notify(issues[0] + (issues.length > 1 ? ' (+' + (issues.length - 1) + ' peringatan lain)' : ''), 'error');
    }
    if (!Storage.isPersistent()) {
      notify('Penyimpanan browser tidak tersedia. Data hanya bertahan selama tab ini terbuka.', 'error');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
