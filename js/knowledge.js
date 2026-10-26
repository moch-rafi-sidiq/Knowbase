/* Knowbase — pengelolaan pengetahuan, pencarian, filter, dan statistik */
(function () {
  'use strict';

  const MAX_TITLE = 160;
  const MAX_SUMMARY = 300;
  const MAX_CONTENT = 100000;
  const MAX_TAGS = 12;
  const collator = new Intl.Collator('id-ID', { sensitivity: 'base' });

  function normalizeKnowledge(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const id = typeof raw.id === 'string' ? raw.id.trim() : '';
    const title = typeof raw.title === 'string' ? raw.title.replace(/\s+/g, ' ').trim() : '';
    if (!id || !title) return null;
    const createdAt = Utils.isValidDate(raw.createdAt) ? new Date(raw.createdAt).toISOString() : new Date().toISOString();
    let updatedAt = Utils.isValidDate(raw.updatedAt) ? new Date(raw.updatedAt).toISOString() : createdAt;
    if (new Date(updatedAt).getTime() < new Date(createdAt).getTime()) updatedAt = createdAt;
    return {
      id: id,
      title: title.slice(0, MAX_TITLE),
      summary: typeof raw.summary === 'string' ? raw.summary.trim().slice(0, MAX_SUMMARY) : '',
      content: typeof raw.content === 'string' ? raw.content.slice(0, MAX_CONTENT) : '',
      categoryId: typeof raw.categoryId === 'string' && raw.categoryId.trim() ? raw.categoryId.trim() : null,
      tags: Utils.normalizeTags(raw.tags),
      favorite: raw.favorite === true,
      archived: raw.archived === true,
      createdAt: createdAt,
      updatedAt: updatedAt
    };
  }

  function all() {
    return Storage.getKnowledge().map(normalizeKnowledge).filter(Boolean);
  }

  function get(id) {
    return all().find(function (item) { return item.id === id; }) || null;
  }

  function validateInput(input) {
    const data = input || {};
    const title = typeof data.title === 'string' ? data.title.replace(/\s+/g, ' ').trim() : '';
    if (!title) throw new Error('Judul pengetahuan wajib diisi.');
    if (title.length > MAX_TITLE) throw new Error('Judul maksimal ' + MAX_TITLE + ' karakter.');
    const summary = typeof data.summary === 'string' ? data.summary.trim() : '';
    if (summary.length > MAX_SUMMARY) throw new Error('Ringkasan maksimal ' + MAX_SUMMARY + ' karakter.');
    const content = typeof data.content === 'string' ? data.content.trim() : '';
    if (content.length > MAX_CONTENT) throw new Error('Isi pengetahuan terlalu panjang.');
    let categoryId = typeof data.categoryId === 'string' && data.categoryId ? data.categoryId : null;
    if (categoryId && !Categories.get(categoryId)) categoryId = null;
    return {
      title: title,
      summary: summary,
      content: content,
      categoryId: categoryId,
      tags: Utils.normalizeTags(data.tags).slice(0, MAX_TAGS)
    };
  }

  function generateUniqueId(items) {
    let id = Utils.uid('knw');
    const ids = new Set(items.map(function (item) { return item.id; }));
    while (ids.has(id)) id = Utils.uid('knw');
    return id;
  }

  function create(input) {
    const data = validateInput(input);
    const items = all();
    const now = new Date().toISOString();
    const item = {
      id: generateUniqueId(items),
      title: data.title,
      summary: data.summary,
      content: data.content,
      categoryId: data.categoryId,
      tags: data.tags,
      favorite: false,
      archived: false,
      createdAt: now,
      updatedAt: now
    };
    items.push(item);
    Storage.writeKnowledge(items);
    return item;
  }

  function update(id, input) {
    const items = all();
    const index = items.findIndex(function (item) { return item.id === id; });
    if (index === -1) throw new Error('Pengetahuan tidak ditemukan.');
    const data = validateInput(input);
    const updated = Object.assign({}, items[index], data, { updatedAt: new Date().toISOString() });
    items[index] = updated;
    Storage.writeKnowledge(items);
    return updated;
  }

  function remove(id) {
    const items = all();
    const item = items.find(function (entry) { return entry.id === id; });
    if (!item) throw new Error('Pengetahuan tidak ditemukan.');
    Storage.writeKnowledge(items.filter(function (entry) { return entry.id !== id; }));
    return item;
  }

  function setFavorite(id, favorite) {
    const items = all();
    const index = items.findIndex(function (item) { return item.id === id; });
    if (index === -1) throw new Error('Pengetahuan tidak ditemukan.');
    items[index] = Object.assign({}, items[index], { favorite: Boolean(favorite) });
    Storage.writeKnowledge(items);
    return items[index];
  }

  function toggleFavorite(id) {
    const item = get(id);
    if (!item) throw new Error('Pengetahuan tidak ditemukan.');
    return setFavorite(id, !item.favorite);
  }

  function setArchived(id, archived) {
    const items = all();
    const index = items.findIndex(function (item) { return item.id === id; });
    if (index === -1) throw new Error('Pengetahuan tidak ditemukan.');
    items[index] = Object.assign({}, items[index], { archived: Boolean(archived) });
    Storage.writeKnowledge(items);
    return items[index];
  }

  function sorted(items, sort) {
    const result = items.slice();
    const mode = sort || 'updated-desc';
    result.sort(function (a, b) {
      switch (mode) {
        case 'created-desc':
          return new Date(b.createdAt) - new Date(a.createdAt) || collator.compare(a.title, b.title);
        case 'created-asc':
          return new Date(a.createdAt) - new Date(b.createdAt) || collator.compare(a.title, b.title);
        case 'title-asc':
          return collator.compare(a.title, b.title) || new Date(b.updatedAt) - new Date(a.updatedAt);
        case 'updated-desc':
        default:
          return new Date(b.updatedAt) - new Date(a.updatedAt) || collator.compare(a.title, b.title);
      }
    });
    return result;
  }

  function matchesTerm(haystack, term) {
    if (!term) return true;
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp('(^|[^\\p{L}\\p{N}])' + escaped, 'u').test(haystack);
  }

  function query(options) {
    const opts = options || {};
    const search = Utils.normalizeText(opts.search || '');
    const terms = search.split(' ').filter(Boolean);
    const status = opts.status || 'active';
    const categoryId = opts.categoryId || 'all';
    const favoriteOnly = opts.favoriteOnly === true;
    const categoryMap = Categories.getMap();

    let items = all().filter(function (item) {
      if (status === 'active' && item.archived) return false;
      if (status === 'archived' && !item.archived) return false;
      if (favoriteOnly && !item.favorite) return false;
      if (categoryId === 'none') {
        if (item.categoryId) return false;
      } else if (categoryId !== 'all' && item.categoryId !== categoryId) {
        return false;
      }
      if (terms.length) {
        const category = item.categoryId ? categoryMap.get(item.categoryId) : null;
        const haystack = Utils.normalizeText([
          item.title,
          item.summary,
          item.content,
          item.tags.join(' '),
          category ? category.name : 'Tanpa Kategori'
        ].join(' '));
        if (!terms.every(function (term) { return matchesTerm(haystack, term); })) return false;
      }
      return true;
    });

    items = sorted(items, opts.sort);
    if (Number.isInteger(opts.limit) && opts.limit > 0) items = items.slice(0, opts.limit);
    return items;
  }

  function stats() {
    const items = all();
    const active = items.filter(function (item) { return !item.archived; });
    const archived = items.length - active.length;
    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    return {
      total: active.length,
      totalAll: items.length,
      archived: archived,
      favorites: active.filter(function (item) { return item.favorite; }).length,
      updatedWeek: active.filter(function (item) { return new Date(item.updatedAt).getTime() >= weekAgo; }).length,
      categories: Categories.all().length,
      uncategorized: active.filter(function (item) { return !item.categoryId; }).length
    };
  }

  function categoryUsage() {
    const counts = Categories.counts();
    const categories = Categories.all().map(function (category) {
      return {
        id: category.id,
        name: category.name,
        color: category.color,
        count: counts[category.id] || 0
      };
    });
    if (counts.none) {
      categories.push({
        id: 'none',
        name: 'Tanpa Kategori',
        color: Categories.FALLBACK_COLOR,
        count: counts.none
      });
    }
    return categories.sort(function (a, b) {
      return b.count - a.count || collator.compare(a.name, b.name);
    });
  }

  window.Knowledge = {
    MAX_TITLE: MAX_TITLE,
    MAX_SUMMARY: MAX_SUMMARY,
    MAX_CONTENT: MAX_CONTENT,
    MAX_TAGS: MAX_TAGS,
    all: all,
    get: get,
    create: create,
    update: update,
    remove: remove,
    setFavorite: setFavorite,
    toggleFavorite: toggleFavorite,
    setArchived: setArchived,
    query: query,
    stats: stats,
    categoryUsage: categoryUsage,
    normalizeKnowledge: normalizeKnowledge
  };
})();
