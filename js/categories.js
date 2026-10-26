/* Knowbase — pengelolaan kategori */
(function () {
  'use strict';

  const PALETTE = [
    { name: 'Biru', value: '#2563eb' },
    { name: 'Indigo', value: '#4f46e5' },
    { name: 'Sian', value: '#0891b2' },
    { name: 'Tosca', value: '#0d9488' },
    { name: 'Hijau', value: '#16a34a' },
    { name: 'Amber', value: '#d97706' },
    { name: 'Oranye', value: '#ea580c' },
    { name: 'Rose', value: '#e11d48' },
    { name: 'Ungu', value: '#7c3aed' },
    { name: 'Abu', value: '#64748b' },
    { name: 'Navy', value: '#1e3a8a' }
  ];

  const FALLBACK_COLOR = '#64748b';
  const collator = new Intl.Collator('id-ID', { sensitivity: 'base' });

  function isValidColor(color) {
    return typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color);
  }

  function normalizeColor(color) {
    if (!isValidColor(color)) return PALETTE[0].value;
    if (PALETTE.some(function (entry) { return entry.value.toLowerCase() === color.toLowerCase(); })) {
      return color.toLowerCase();
    }
    return PALETTE[0].value;
  }

  function normalizeCategory(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const id = typeof raw.id === 'string' ? raw.id.trim() : '';
    const name = typeof raw.name === 'string' ? raw.name.replace(/\s+/g, ' ').trim() : '';
    if (!id || !name) return null;
    return {
      id: id,
      name: name.slice(0, 40),
      color: normalizeColor(raw.color),
      createdAt: Utils.isValidDate(raw.createdAt) ? new Date(raw.createdAt).toISOString() : new Date().toISOString()
    };
  }

  function validateName(name, excludeId) {
    const clean = String(name || '').replace(/\s+/g, ' ').trim();
    if (!clean) throw new Error('Nama kategori wajib diisi.');
    if (clean.length > 40) throw new Error('Nama kategori maksimal 40 karakter.');
    if (clean.toLocaleLowerCase('id-ID') === 'tanpa kategori') {
      throw new Error('“Tanpa Kategori” adalah label bawaan untuk pengetahuan tanpa kategori.');
    }
    const duplicate = all().some(function (category) {
      return category.id !== excludeId &&
        category.name.toLocaleLowerCase('id-ID') === clean.toLocaleLowerCase('id-ID');
    });
    if (duplicate) throw new Error('Kategori dengan nama tersebut sudah ada.');
    return clean;
  }

  function all() {
    const categories = Storage.getCategories()
      .map(normalizeCategory)
      .filter(Boolean);
    return categories.sort(function (a, b) { return collator.compare(a.name, b.name); });
  }

  function get(id) {
    return all().find(function (category) { return category.id === id; }) || null;
  }

  function getMap() {
    const map = new Map();
    all().forEach(function (category) { map.set(category.id, category); });
    return map;
  }

  function labelFor(id) {
    const category = get(id);
    return category ? category.name : 'Tanpa Kategori';
  }

  function colorFor(id) {
    const category = get(id);
    return category ? category.color : FALLBACK_COLOR;
  }

  function counts() {
    const result = { all: 0, none: 0 };
    all().forEach(function (category) { result[category.id] = 0; });
    Storage.getKnowledge().forEach(function (item) {
      if (!item || typeof item !== 'object') return;
      result.all += 1;
      if (item.categoryId && Object.prototype.hasOwnProperty.call(result, item.categoryId)) {
        result[item.categoryId] += 1;
      } else {
        result.none += 1;
      }
    });
    return result;
  }

  function deleteImpact(id) {
    return Storage.getKnowledge().filter(function (item) {
      return item && item.categoryId === id;
    }).length;
  }

  function create(input) {
    const data = input || {};
    const name = validateName(data.name, null);
    const color = normalizeColor(data.color);
    const category = {
      id: Utils.uid('cat'),
      name: name,
      color: color,
      createdAt: new Date().toISOString()
    };
    const categories = all();
    categories.push(category);
    Storage.writeCategories(categories);
    return category;
  }

  function update(id, input) {
    const categories = all();
    const index = categories.findIndex(function (category) { return category.id === id; });
    if (index === -1) throw new Error('Kategori tidak ditemukan.');
    const data = input || {};
    const name = validateName(data.name, id);
    categories[index] = Object.assign({}, categories[index], {
      name: name,
      color: normalizeColor(data.color)
    });
    Storage.writeCategories(categories);
    return categories[index];
  }

  function remove(id) {
    const categories = all();
    const category = categories.find(function (entry) { return entry.id === id; });
    if (!category) throw new Error('Kategori tidak ditemukan.');

    const knowledge = Storage.getKnowledge();
    let reassigned = 0;
    const nextKnowledge = knowledge.map(function (item) {
      if (item && item.categoryId === id) {
        reassigned += 1;
        return Object.assign({}, item, { categoryId: null });
      }
      return item;
    });

    if (reassigned > 0) Storage.writeKnowledge(nextKnowledge);
    Storage.writeCategories(categories.filter(function (entry) { return entry.id !== id; }));
    return { category: category, reassigned: reassigned };
  }

  window.Categories = {
    PALETTE: PALETTE,
    FALLBACK_COLOR: FALLBACK_COLOR,
    all: all,
    get: get,
    getMap: getMap,
    labelFor: labelFor,
    colorFor: colorFor,
    counts: counts,
    deleteImpact: deleteImpact,
    create: create,
    update: update,
    remove: remove,
    normalizeCategory: normalizeCategory,
    normalizeColor: normalizeColor,
    validateName: validateName
  };
})();
