/* Knowbase — modal editor, kategori, impor, dan dialog konfirmasi */
(function () {
  'use strict';

  const E = Utils.escapeHtml;

  function tagChips(tags) {
    if (!tags.length) {
      return '<span class="tag-editor-empty">Belum ada tag. Tambahkan untuk memudahkan pencarian.</span>';
    }
    return tags.map(function (tag, index) {
      return '<span class="tag-chip tag-chip-removable">#' + E(tag) +
        '<button type="button" class="tag-remove" data-action="remove-editor-tag" data-index="' + index +
        '" aria-label="Hapus tag ' + E(tag) + '" title="Hapus tag">' + Utils.icon('x', 12) + '</button></span>';
    }).join('');
  }

  function categoryOptions(selectedId) {
    let html = '<option value=""' + (!selectedId ? ' selected' : '') + '>Tanpa Kategori</option>';
    Categories.all().forEach(function (category) {
      html += '<option value="' + E(category.id) + '"' + (selectedId === category.id ? ' selected' : '') + '>' +
        E(category.name) + '</option>';
    });
    return html;
  }

  function editor(editorState) {
    const data = editorState;
    const isEdit = Boolean(data.id);
    const summaryLength = String(data.summary || '').length;
    const content = String(data.content || '');
    const words = Utils.countWords(content);
    const chars = content.length;

    return '<div class="modal-backdrop" data-backdrop="editor">' +
      '<div class="modal modal-lg" role="dialog" aria-modal="true" aria-labelledby="editor-heading">' +
      '<form id="editor-form" novalidate>' +
      '<div class="modal-head">' +
      '<div><p class="eyebrow">' + (isEdit ? 'Perbarui catatan' : 'Pengetahuan baru') + '</p><h2 id="editor-heading">' + (isEdit ? 'Edit Pengetahuan' : 'Tambah Pengetahuan') + '</h2></div>' +
      '<button type="button" class="icon-btn" data-action="request-close-editor" aria-label="Tutup editor">' + Utils.icon('x', 18) + '</button>' +
      '</div>' +
      '<div class="modal-body">' +
      '<p class="form-error" id="editor-form-error" role="alert" hidden></p>' +
      '<div class="field"><label class="field-label" for="editor-title">Judul <span class="required-mark">*</span></label>' +
      '<input type="text" id="editor-title" name="title" maxlength="' + Knowledge.MAX_TITLE + '" value="' + E(data.title) + '" placeholder="Contoh: Dasar JavaScript" required autocomplete="off">' +
      '<span class="field-hint">Gunakan judul yang jelas dan spesifik.</span></div>' +
      '<div class="field"><label class="field-label" for="editor-summary">Ringkasan</label>' +
      '<textarea id="editor-summary" name="summary" rows="2" maxlength="' + Knowledge.MAX_SUMMARY + '" placeholder="Ringkasan singkat tentang isi catatan…">' + E(data.summary) + '</textarea>' +
      '<div class="field-meta"><span class="field-hint">Opsional, tampil pada kartu pengetahuan.</span><span class="char-count" id="editor-summary-count">' + summaryLength + '/' + Knowledge.MAX_SUMMARY + '</span></div></div>' +
      '<div class="field"><label class="field-label" for="editor-content">Isi pengetahuan</label>' +
      '<textarea id="editor-content" name="content" class="content-textarea" rows="10" maxlength="' + Knowledge.MAX_CONTENT + '" placeholder="Tulis isi pengetahuan di sini. Gunakan baris baru untuk memisahkan bagian…">' + E(content) + '</textarea>' +
      '<div class="field-meta"><span class="field-hint">Teks ditampilkan apa adanya tanpa HTML.</span><span class="char-count" id="editor-content-stats">' + words + ' kata · ' + chars + ' karakter</span></div></div>' +
      '<div class="editor-grid">' +
      '<div class="field"><label class="field-label" for="editor-category">Kategori</label>' +
      '<span class="select-wrap"><select id="editor-category" name="categoryId">' + categoryOptions(data.categoryId) + '</select><span class="select-chevron">' + Utils.icon('chevron-down', 15) + '</span></span></div>' +
      '<div class="field"><label class="field-label" for="editor-tag-input">Tag</label>' +
      '<div class="tag-editor"><div class="tag-editor-chips" id="editor-tag-chips">' + tagChips(data.tags) + '</div>' +
      '<div class="tag-input-row"><input type="text" id="editor-tag-input" maxlength="30" placeholder="Tambah tag…" aria-label="Tambah tag" autocomplete="off">' +
      '<button type="button" class="btn btn-secondary btn-sm" data-action="add-editor-tag">' + Utils.icon('plus', 15) + 'Tambah</button></div></div>' +
      '<span class="field-hint">Tekan Enter atau koma untuk menambah. Maksimal ' + Knowledge.MAX_TAGS + ' tag.</span></div>' +
      '</div>' +
      '</div>' +
      '<div class="modal-foot">' +
      '<span class="modal-foot-note" id="editor-dirty-indicator" hidden>Perubahan belum disimpan</span>' +
      '<div class="modal-foot-actions">' +
      '<button type="button" class="btn btn-secondary" data-action="request-close-editor">Batal</button>' +
      '<button type="submit" class="btn btn-primary" id="editor-save-btn">' + Utils.icon('save', 16) + (isEdit ? 'Simpan Perubahan' : 'Simpan Pengetahuan') + '</button>' +
      '</div></div>' +
      '</form></div></div>';
  }

  function categoryForm(data) {
    const isEdit = Boolean(data.id);
    const selectedColor = Categories.normalizeColor(data.color);
    const swatches = Categories.PALETTE.map(function (entry) {
      return '<label class="color-option" title="' + E(entry.name) + '">' +
        '<input type="radio" name="categoryColor" value="' + entry.value + '"' + (selectedColor === entry.value ? ' checked' : '') + '>' +
        '<span class="color-swatch" style="background-color:' + entry.value + '"><span class="swatch-check">' + Utils.icon('check', 13) + '</span></span>' +
        '<span class="sr-only">' + E(entry.name) + '</span></label>';
    }).join('');

    return '<div class="modal-backdrop" data-backdrop="category">' +
      '<div class="modal modal-sm" role="dialog" aria-modal="true" aria-labelledby="category-heading">' +
      '<form id="category-form" novalidate>' +
      '<div class="modal-head"><div><p class="eyebrow">' + (isEdit ? 'Perbarui kategori' : 'Kategori baru') + '</p><h2 id="category-heading">' + (isEdit ? 'Edit Kategori' : 'Tambah Kategori') + '</h2></div>' +
      '<button type="button" class="icon-btn" data-action="close-category-modal" aria-label="Tutup">' + Utils.icon('x', 18) + '</button></div>' +
      '<div class="modal-body">' +
      '<p class="form-error" id="category-form-error" role="alert" hidden></p>' +
      '<div class="field"><label class="field-label" for="category-name">Nama kategori <span class="required-mark">*</span></label>' +
      '<input type="text" id="category-name" name="name" maxlength="40" value="' + E(data.name) + '" placeholder="Contoh: Referensi" required autocomplete="off">' +
      '<span class="field-hint">Nama kategori harus unik, tidak membedakan huruf besar atau kecil.</span></div>' +
      '<fieldset class="color-field"><legend class="field-label">Warna penanda</legend><div class="color-options">' + swatches + '</div></fieldset>' +
      '</div>' +
      '<div class="modal-foot"><div class="modal-foot-actions">' +
      '<button type="button" class="btn btn-secondary" data-action="close-category-modal">Batal</button>' +
      '<button type="submit" class="btn btn-primary" id="category-save-btn">' + (isEdit ? 'Simpan Perubahan' : 'Tambah Kategori') + '</button>' +
      '</div></div>' +
      '</form></div></div>';
  }

  function importModal(importState) {
    const result = importState.result;
    const data = result.data;
    const meta = result.meta || {};
    const dateText = meta.exportedAt ? Utils.formatDateTime(meta.exportedAt) : 'Waktu tidak tercatat';
    return '<div class="modal-backdrop" data-backdrop="import">' +
      '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="import-heading">' +
      '<form id="import-form" novalidate>' +
      '<div class="modal-head"><div><p class="eyebrow">Pulihkan data</p><h2 id="import-heading">Impor Data</h2></div>' +
      '<button type="button" class="icon-btn" data-action="close-import-modal" aria-label="Tutup">' + Utils.icon('x', 18) + '</button></div>' +
      '<div class="modal-body">' +
      '<div class="import-file"><span class="import-file-icon">' + Utils.icon('file-text', 21) + '</span><div><strong>' + E(importState.fileName) + '</strong><span>Skema v' + E(String(meta.schemaVersion || Storage.SCHEMA_VERSION)) + ' · Diekspor ' + E(dateText) + '</span></div></div>' +
      '<div class="import-counts"><span><strong>' + Utils.formatNumber(data.knowledge.length) + '</strong> pengetahuan</span><span><strong>' + Utils.formatNumber(data.categories.length) + '</strong> kategori</span></div>' +
      '<p class="form-error" id="import-form-error" role="alert" hidden></p>' +
      '<fieldset class="import-options"><legend class="field-label">Cara mengimpor</legend>' +
      '<label class="radio-card"><input type="radio" name="importMode" value="merge" checked><span class="radio-card-body"><span class="radio-card-title">Gabungkan dengan data saat ini <span class="mini-badge">Disarankan</span></span><span class="radio-card-desc">Pengetahuan dengan ID yang sama akan diperbarui jika versi impor lebih baru. Kategori yang sudah ada tidak diduplikasi.</span></span></label>' +
      '<label class="radio-card radio-card-danger"><input type="radio" name="importMode" value="replace"><span class="radio-card-body"><span class="radio-card-title">Ganti seluruh data</span><span class="radio-card-desc">Semua pengetahuan dan kategori saat ini akan dihapus, lalu diganti dengan isi berkas. Kamu akan diminta konfirmasi.</span></span></label>' +
      '</fieldset>' +
      '<div class="info-note info-note-compact">' + Utils.icon('info', 16) + '<p>Data belum diubah sampai kamu menekan tombol Impor Data.</p></div>' +
      '</div>' +
      '<div class="modal-foot"><div class="modal-foot-actions">' +
      '<button type="button" class="btn btn-secondary" data-action="close-import-modal">Batal</button>' +
      '<button type="submit" class="btn btn-primary" id="import-submit-btn">' + Utils.icon('upload', 16) + 'Impor Data</button>' +
      '</div></div>' +
      '</form></div></div>';
  }

  function confirmDialog(config) {
    const tone = config.tone === 'danger' ? 'danger' : 'primary';
    const confirmClass = tone === 'danger' ? 'btn-danger' : 'btn-primary';
    return '<div class="dialog-backdrop">' +
      '<div class="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dialog-title" aria-describedby="dialog-message">' +
      '<span class="dialog-icon dialog-icon-' + tone + '">' + Utils.icon(tone === 'danger' ? 'alert-triangle' : 'info', 22) + '</span>' +
      '<h2 id="dialog-title">' + E(config.title) + '</h2>' +
      '<p id="dialog-message">' + E(config.message) + '</p>' +
      '<div class="dialog-actions">' +
      '<button type="button" class="btn btn-secondary" data-action="cancel-confirm">' + E(config.cancelLabel || 'Batal') + '</button>' +
      '<button type="button" class="btn ' + confirmClass + '" data-action="confirm-accept">' + E(config.confirmLabel || 'Lanjutkan') + '</button>' +
      '</div></div></div>';
  }

  window.Modals = {
    editor: editor,
    category: categoryForm,
    import: importModal,
    confirm: confirmDialog,
    tagChips: tagChips
  };
})();
