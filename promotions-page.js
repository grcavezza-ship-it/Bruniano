(() => {
  const $ = (selector) => document.querySelector(selector);
  const escapeHtml = (value = '') => String(value).replace(/[&<>\"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' }[char]));
  const activeNow = (p) => {
    const now = Date.now();
    return (!p.starts_at || new Date(p.starts_at).getTime() <= now) && (!p.ends_at || new Date(p.ends_at).getTime() >= now);
  };
  const wa = (p) => {
    const text = p.whatsapp_message || `Buongiorno, vorrei ricevere informazioni sulla promozione "${p.title}" presso Bruniano.`;
    return `https://wa.me/393343755885?text=${encodeURIComponent(text)}`;
  };
  const date = (v) => v ? new Date(v).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' }) : '';

  const ensureSharedHeader = () => new Promise((resolve) => {
    if (window.__brunianoSharedLoaded) return resolve();
    window.__brunianoSharedLoaded = true;
    const script = document.createElement('script');
    script.src = '/shared.js?v=20260902-1';
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });

  const render = (items) => {
    const promos = (items || []).filter((p) => p.is_published !== false && p.page_published !== false && activeNow(p));
    const featured = $('#promo-featured');
    const grid = $('#promo-grid');
    const count = $('#promo-count');
    if (count) count.textContent = `${promos.length} ${promos.length === 1 ? 'offerta attiva' : 'offerte attive'}`;

    if (!promos.length) {
      if (featured) featured.innerHTML = '<div class="promo-empty"><span>Nessuna promozione attiva</span><h2>Stiamo preparando le prossime offerte.</h2><p>Contattaci direttamente per conoscere trattamenti e disponibilità.</p><a class="button button-primary" href="contatti.html">Contatti</a></div>';
      if (grid) grid.innerHTML = '';
      return;
    }

    const lead = promos[0];
    if (featured) {
      featured.innerHTML = `<article class="featured-card" id="promo-${escapeHtml(lead.id)}">
        <div class="featured-visual">
          ${lead.image_url ? `<img src="${escapeHtml(lead.image_url)}" alt="${escapeHtml(lead.title)}">` : '<div class="visual-fallback" aria-hidden="true"><span>%</span></div>'}
          <div class="featured-badge">${escapeHtml(lead.subtitle || 'PROMO IN EVIDENZA')}</div>
        </div>
        <div class="featured-copy">
          <p class="eyebrow">CENTRO MEDICO SPECIALISTICO · PROMOZIONE</p>
          <h2>${escapeHtml(lead.title)}</h2>
          ${lead.description ? `<p>${escapeHtml(lead.description)}</p>` : ''}
          <div class="promo-actions">
            <a class="button button-primary button-large" href="${wa(lead)}" target="_blank" rel="noopener noreferrer">${escapeHtml(lead.cta_label || 'Scopri l’offerta')} ↗</a>
            <a class="button button-large" href="contatti.html">Contatti</a>
          </div>
          ${lead.ends_at ? `<small class="promo-validity">Offerta valida fino al ${date(lead.ends_at)}</small>` : '<small class="promo-validity">Offerta attualmente attiva</small>'}
        </div>
      </article>`;
    }

    if (grid) {
      const cards = promos.slice(1).map((promo, index) => `<article class="promo-card" id="promo-${escapeHtml(promo.id)}">
        <div class="promo-card-head"><span>${escapeHtml(promo.subtitle || 'PROMOZIONE')}</span><strong>${String(index + 2).padStart(2, '0')}</strong></div>
        <div class="promo-card-body">
          <h3>${escapeHtml(promo.title)}</h3>
          ${promo.description ? `<p>${escapeHtml(promo.description)}</p>` : ''}
          <div class="promo-card-foot"><small>${promo.ends_at ? `Fino al ${date(promo.ends_at)}` : 'Offerta attiva'}</small><a href="${wa(promo)}" target="_blank" rel="noopener noreferrer">${escapeHtml(promo.cta_label || 'Scopri')} ↗</a></div>
        </div>
      </article>`).join('');
      grid.innerHTML = cards || '<p class="promo-single-note">La promozione in evidenza è l’offerta attualmente disponibile.</p>';
    }
  };

  const load = async () => {
    try {
      const response = await fetch('/api/promotions', { cache: 'no-store' });
      if (!response.ok) throw new Error('Promozioni non disponibili');
      const data = await response.json();
      render(data.items);
    } catch (error) {
      const target = $('#promo-featured');
      if (target) target.innerHTML = '<div class="promo-empty"><span>Servizio temporaneamente non disponibile</span><h2>Impossibile caricare le promozioni.</h2><p>Puoi contattarci direttamente per ricevere le offerte attive.</p><a class="button button-primary" href="contatti.html">Contatti</a></div>';
    }
  };

  const start = async () => {
    await ensureSharedHeader();
    load();
  };

  start();
})();
