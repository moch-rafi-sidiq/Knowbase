/* Knowbase — utilitas umum dan kumpulan ikon SVG */
(function () {
  'use strict';

  const ICONS = {
    dashboard: '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
    'book-open': '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3Z"/>',
    star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    'star-filled': '<polygon fill="currentColor" stroke="none" points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    clock: '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/>',
    folder: '<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.7-.9l-.8-1.2A2 2 0 0 0 7.9 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>',
    archive: '<rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>',
    settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    menu: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    'chevron-down': '<path d="m6 9 6 6 6-6"/>',
    'chevron-right': '<path d="m9 18 6-6-6-6"/>',
    'arrow-left': '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    'arrow-right': '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
    'rotate-ccw': '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>',
    'alert-triangle': '<path d="m10.29 3.86-8.1 14A2 2 0 0 0 3.92 21h16.16a2 2 0 0 0 1.73-3.14l-8.1-14a2 2 0 0 0-3.42 0Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    'check-circle': '<path d="M21.8 10A10 10 0 1 1 17 3.34"/><path d="m9 11 3 3L22 4"/>',
    'file-text': '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v5h5"/><path d="M8 13h8"/><path d="M8 17h5"/>',
    'file-plus': '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v5h5"/><path d="M12 18v-6"/><path d="M9 15h6"/>',
    grid: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
    list: '<line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/>',
    filter: '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
    tag: '<path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.2 8.2a2 2 0 0 0 2.8 0l7.2-7.2a2 2 0 0 0 0-2.8Z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
    calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
    database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
    save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>',
    'folder-plus': '<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.7-.9l-.8-1.2A2 2 0 0 0 7.9 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/><path d="M12 10v6"/><path d="M9 13h6"/>',
    'corner-down-left': '<polyline points="9 10 4 15 9 20"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/>'
  };

  const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
      return HTML_ESCAPES[character];
    });
  }

  function icon(name, size, className) {
    const content = ICONS[name];
    if (!content) return '';
    const dimension = size || 18;
    return '<svg class="icon' + (className ? ' ' + className : '') + '" width="' + dimension + '" height="' + dimension +
      '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      content + '</svg>';
  }

  function hydrateIcons(root) {
    const scope = root || document;
    scope.querySelectorAll('[data-icon]').forEach(function (element) {
      const name = element.getAttribute('data-icon');
      element.innerHTML = icon(name, Number(element.getAttribute('data-icon-size')) || 18);
    });
  }

  function uid(prefix) {
    const base = prefix || 'id';
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      try {
        return base + '-' + window.crypto.randomUUID();
      } catch (error) {
        /* jatuh ke ID berbasis waktu */
      }
    }
    return base + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }

  const dateFormatter = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  const longDateFormatter = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const timeFormatter = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' });
  const numberFormatter = new Intl.NumberFormat('id-ID');

  function toDate(value) {
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function formatDate(value) {
    const date = toDate(value);
    return date ? dateFormatter.format(date) : '—';
  }

  function formatDateTime(value) {
    const date = toDate(value);
    if (!date) return '—';
    return longDateFormatter.format(date) + ', ' + timeFormatter.format(date).replace(':', '.');
  }

  function timeAgo(value) {
    const date = toDate(value);
    if (!date) return '—';
    const seconds = Math.round((Date.now() - date.getTime()) / 1000);
    if (seconds < 45) return 'Baru saja';
    if (seconds < 3600) return Math.max(1, Math.floor(seconds / 60)) + ' menit lalu';
    if (seconds < 86400) return Math.floor(seconds / 3600) + ' jam lalu';
    if (seconds < 604800) return Math.floor(seconds / 86400) + ' hari lalu';
    return formatDate(date);
  }

  function formatNumber(value) {
    return numberFormatter.format(Number(value) || 0);
  }

  function countWords(text) {
    const clean = String(text || '').trim();
    return clean ? clean.split(/\s+/).filter(Boolean).length : 0;
  }

  function normalizeText(value) {
    return String(value || '').toLocaleLowerCase('id-ID').replace(/\s+/g, ' ').trim();
  }

  function debounce(fn, delay) {
    let timeoutId = null;
    return function () {
      const args = arguments;
      const context = this;
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(function () {
        fn.apply(context, args);
      }, delay);
    };
  }

  function clampPercent(value, max) {
    if (!max || max <= 0) return 0;
    return Math.max(4, Math.min(100, Math.round((value / max) * 100)));
  }

  function initials(name) {
    const parts = String(name || 'Pengguna').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return 'P';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function normalizeTags(tags) {
    const result = [];
    const seen = new Set();
    (Array.isArray(tags) ? tags : []).forEach(function (tag) {
      if (typeof tag !== 'string') return;
      const clean = tag.replace(/,/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 30);
      if (!clean) return;
      const key = clean.toLocaleLowerCase('id-ID');
      if (seen.has(key)) return;
      seen.add(key);
      if (result.length < 12) result.push(clean);
    });
    return result;
  }

  window.Utils = {
    escapeHtml: escapeHtml,
    icon: icon,
    hydrateIcons: hydrateIcons,
    uid: uid,
    formatDate: formatDate,
    formatDateTime: formatDateTime,
    timeAgo: timeAgo,
    formatNumber: formatNumber,
    countWords: countWords,
    normalizeText: normalizeText,
    debounce: debounce,
    clampPercent: clampPercent,
    initials: initials,
    normalizeTags: normalizeTags,
    isValidDate: function (value) { return Boolean(toDate(value)); }
  };
})();
