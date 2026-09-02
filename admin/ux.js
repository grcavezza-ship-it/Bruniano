(() => {
  const $ = (id) => document.getElementById(id);

  async function logout() {
    const btn = $('admin-logout');
    if (btn) { btn.disabled = true; btn.textContent = 'Uscita…'; }
    try {
      await fetch('../api/auth?action=logout', { method: 'POST', credentials: 'same-origin' });
    } finally {
      location.replace('login.html');
    }
  }

  function updateHeader(panel) {
    const titles = {
      dashboard: ['Dashboard', 'Panoramica'], team: ['Team', 'Professionisti'],
      gallery: ['Studio', 'Foto e video'], promos: ['Promozioni', 'Offerte'],
      blog: ['Blog', 'Articoli e SEO'], reviews: ['Recensioni', 'Google Reviews'],
      users: ['Utenti', 'Accessi al gestionale']
    };
    const v = titles[panel] || titles.dashboard;
    if ($('breadcrumb')) $('breadcrumb').textContent = v[0];
    if ($('page-title')) $('page-title').textContent = v[1];
  }

  function navigation() {
    document.querySelectorAll('.dash-card[data-panel]').forEach((btn) => {
      btn.addEventListener('click', () => {
        updateHeader(btn.dataset.panel);
        $('sidebar')?.classList.remove('open');
        $('mobile-menu')?.setAttribute('aria-expanded', 'false');
      });
    });
    document.querySelectorAll('[data-view-link]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelector('.dash-card[data-panel="' + btn.dataset.viewLink + '"]')?.click();
      });
    });
    $('mobile-menu')?.addEventListener('click', () => {
      const side = $('sidebar');
      if (!side) return;
      const open = !side.classList.contains('open');
      side.classList.toggle('open', open);
      $('mobile-menu').setAttribute('aria-expanded', String(open));
    });
    $('admin-logout')?.addEventListener('click', logout);
  }

  function setupPromotions() {
    const list = $('promo-list');
    const add = $('add-promo');
    if (!list || !add) return;

    const esc = (v) => String(v ?? '').replace(/[&<>\"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;' }[c]));
    const state = { items: [] };

    async function request(url, options = {}) {
      const res = await fetch(url, { credentials: 'same-origin', ...options });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) { location.replace('login.html'); throw new Error('Sessione scaduta'); }
      if (!res.ok) throw new Error(data.error || ('HTTP ' + res.status));
      return data;
    }

    function render() {
      list.innerHTML = state.items.length ? state.items.map((p) =>
        '<div class="managed-item"><div><strong>' + esc(p.title) + '</strong><small>' +
        (p.is_published ? 'ATTIVA' : 'BOZZA') + ' · Pagina ' + (p.page_published ? 'ON' : 'OFF') +
        ' · Home alta ' + (p.show_home_top ? 'ON' : 'OFF') + ' · Home centrale ' +
        (p.show_home_center ? 'ON' : 'OFF') +
        '</small></div><div class="managed-actions"><button class="mini" data-promo-edit="' +
        p.id + '">Modifica</button><button class="mini" data-promo-delete="' + p.id + '">Elimina</button></div></div>'
      ).join('') : '<div class="form-card note">Nessuna promozione presente.</div>';
    }

    async function load() {
      try {
        const data = await request('../api/promotions?admin=1');
        state.items = data.items || [];
        render();
      } catch (err) {
        list.innerHTML = '<div class="form-card note">' + esc(err.message) + '</div>';
      }
    }

    function editor(p = {}) {
      list.innerHTML = '<div class="form-card"><div class="panel-head"><div><span class="eyebrow">SCHEDA PROMOZIONE</span><h2>' +
        (p.id ? 'Modifica promozione' : 'Nuova promozione') +
        '</h2></div><button class="mini" type="button" id="promo-cancel">Annulla</button></div>' +
        '<form id="promo-editor"><input type="hidden" id="promo-id" value="' + esc(p.id || '') + '">' +
        '<div class="form-row"><label>Titolo<input id="promo-title" required value="' + esc(p.title || '') + '"></label>' +
        '<label>Sottotitolo<input id="promo-subtitle" value="' + esc(p.subtitle || '') + '"></label></div>' +
        '<label>Descrizione<textarea id="promo-description" rows="5">' + esc(p.description || '') + '</textarea></label>' +
        '<label>Immagine<div class="media-input-row"><input id="promo-image" value="' + esc(p.image_url || '') + '"><button class="mini" type="button" id="promo-image-upload">Carica</button></div><small id="promo-image-status">URL Cloudinary oppure carica un’immagine.</small></label>' +
        '<div class="form-row"><label>Inizio<input id="promo-start" type="datetime-local" value="' + (p.starts_at ? new Date(p.starts_at).toISOString().slice(0,16) : '') + '"></label>' +
        '<label>Fine<input id="promo-end" type="datetime-local" value="' + (p.ends_at ? new Date(p.ends_at).toISOString().slice(0,16) : '') + '"></label></div>' +
        '<div class="form-row"><label>Testo pulsante<input id="promo-cta" value="' + esc(p.cta_label || 'Scopri l’offerta') + '"></label>' +
        '<label>Messaggio WhatsApp<input id="promo-wa" value="' + esc(p.whatsapp_message || '') + '"></label></div>' +
        '<div class="form-card note"><strong>Dove vuoi pubblicarla?</strong><div class="check-stack">' +
        '<label class="check-inline"><input id="promo-page" type="checkbox" ' + (p.page_published !== false ? 'checked' : '') + '> Pagina Promozioni</label>' +
        '<label class="check-inline"><input id="promo-top" type="checkbox" ' + (p.show_home_top ? 'checked' : '') + '> Fascia alta della Home</label>' +
        '<label class="check-inline"><input id="promo-center" type="checkbox" ' + (p.show_home_center ? 'checked' : '') + '> Sezione centrale della Home</label></div>' +
        '<div class="form-row"><label>Ordine fascia alta<input id="promo-top-order" type="number" value="' + Number(p.home_top_order || 0) + '"></label>' +
        '<label>Ordine sezione centrale<input id="promo-center-order" type="number" value="' + Number(p.home_center_order || 0) + '"></label></div></div>' +
        '<label class="check-inline"><input id="promo-published" type="checkbox" ' + (p.is_published ? 'checked' : '') + '> Promozione attiva</label>' +
        '<div class="form-actions"><button class="primary" type="submit">Salva promozione</button><span id="promo-form-status"></span></div></form></div>';

      $('promo-cancel')?.addEventListener('click', load);
      $('promo-editor')?.addEventListener('submit', save);
    }

    async function save(event) {
      event.preventDefault();
      const status = $('promo-form-status');
      status.textContent = 'Salvataggio…';
      const id = $('promo-id').value || '';
      const body = {
        id: id || undefined,
        title: $('promo-title').value,
        subtitle: $('promo-subtitle').value,
        description: $('promo-description').value,
        image_url: $('promo-image').value,
        starts_at: $('promo-start').value || null,
        ends_at: $('promo-end').value || null,
        cta_label: $('promo-cta').value,
        whatsapp_message: $('promo-wa').value,
        page_published: $('promo-page').checked,
        show_home_top: $('promo-top').checked,
        show_home_center: $('promo-center').checked,
        home_top_order: Number($('promo-top-order').value || 0),
        home_center_order: Number($('promo-center-order').value || 0),
        is_published: $('promo-published').checked
      };
      try {
        await request('../api/promotions', { method: id ? 'PUT' : 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
        await load();
      } catch (err) {
        status.textContent = err.message;
      }
    }

    async function remove(id) {
      if (!window.confirm('Eliminare definitivamente questa promozione?')) return;
      try {
        await request('../api/promotions', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id }) });
        await load();
      } catch (err) { window.alert(err.message); }
    }

    const cleanAdd = add.cloneNode(true);
    add.replaceWith(cleanAdd);
    cleanAdd.addEventListener('click', () => editor());
    list.addEventListener('click', (event) => {
      const edit = event.target.closest('[data-promo-edit]');
      const del = event.target.closest('[data-promo-delete]');
      if (edit) { const item = state.items.find((x) => x.id === edit.dataset.promoEdit); if (item) editor(item); }
      if (del) remove(del.dataset.promoDelete);
    });
    load();
  }

  navigation();
  updateHeader('dashboard');
  setupPromotions();
})();
