(() => {
  const escapeHtml = (value = '') => String(value).replace(/[&<>\"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '\"': '&quot;',
    "'": '&#39;'
  }[char]));

  const promoIsActive = (promo) => {
    const now = Date.now();
    const start = promo.starts_at ? new Date(promo.starts_at).getTime() : null;
    const end = promo.ends_at ? new Date(promo.ends_at).getTime() : null;
    return (!start || start <= now) && (!end || end >= now);
  };

  const waUrl = (promo) => {
    const message = promo.whatsapp_message || `Buongiorno, vorrei informazioni sulla promozione "${promo.title}" presso Bruniano.`;
    return `https://wa.me/393343755885?text=${encodeURIComponent(message)}`;
  };

  const formatDate = (value) => {
    if (!value) return '';
    return new Date(value).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const render = (items) => {
    const active = items.filter((promo) => promo.is_published !== false && promo.page_published !== false && promoIsActive(promo));
    const featured = document.getElementById('promo-featured');
    const grid = document.getElementById('promo-grid');
    const count = document.getElementById('promo-count');

    if (count) count.textContent = `${active.length} ${active.length === 1 ? 'offerta disponibile' : 'offerte disponibili'}`;

    if (!active.length) {
      if (featured) featured.innerHTML = '<div class="promo-empty"><span>Nessuna promozione attiva</span><h2>Stiamo preparando le prossime offerte.</h2><p>Per informazioni sui trattamenti e sulle disponibilità puoi contattarci direttamente.</p><a class="button button-primary" href="contatti.html">Contatti</a></div>';
      if (grid) grid.innerHTML = '';
      return;
    }

    const lead = active[0];
    if (featured) {
      featured.innerHTML = `
        <article class="featured-card" id="promo-${escapeHtml(lead.id)}">
          <div class="featured-accent"><span>${escapeHtml(lead.subtitle || 'PROMO IN EVIDENZA')}</span><b>OFFERTA</b></div>
          <div class="featured-main">
            <div class="featured-copy">
              <p class="eyebrow">CENTRO MEDICO SPECIALISTICO · PROMOZIONE</p>
              <h2>${escapeHtml(lead.title)}</h2>
              ${lead.description ? `<p class="featured-description">${escapeHtml(lead.description)}</p>` : ''}
              <div class="featured-actions">
                <a class="button button-primary button-large" href="${waUrl(lead)}" target="_blank" rel="noopener noreferrer">${escapeHtml(lead.cta_label || 'Scopri l’offerta')} ↗</a>
                <a class="button button-large" href="contatti.html">Contatti</a>
              </div>
              ${lead.ends_at ? `<small class="promo-validity">Valida fino al ${formatDate(lead.ends_at)}</small>` : ''}
            </div>
            <div class="featured-number" aria-hidden="true"><span>01</span><strong>%</strong></div>
          </div>
        </article>`;
    }

    if (grid) {
      const cards = active.slice(1).map((promo, index) => `
        <article class="promo-card" id="promo-${escapeHtml(promo.id)}">
          <div class="promo-card-top"><span>${escapeHtml(promo.subtitle || 'PROMOZIONE')}</span><strong>${String(index + 2).padStart(2, '0')}</strong></div>
          <div class="promo-card-body">
            <h3>${escapeHtml(promo.title)}</h3>
            ${promo.description ? `<p>${escapeHtml(promo.description)}</p>` : ''}
            <div class="promo-card-bottom">
              ${promo.ends_at ? `<small>Fino al ${formatDate(promo.ends_at)}</small>` : '<small>Offerta attiva</small>'}
              <a href="${waUrl(promo)}" target="_blank" rel="noopener noreferrer">${escapeHtml(promo.cta_label || 'Scopri')} <span>↗</span></a>
            </div>
          </div>
        </article>`).join('');
      grid.innerHTML = cards || '<p class="promo-single-note">La promozione in evidenza è l’offerta attualmente disponibile.</p>';
    }
  };

  const init = async () => {
    try {
      const response = await fetch('/api/promotions', { cache: 'no-store' });
      if (!response.ok) throw new Error('Impossibile caricare le promozioni');
      const data = await response.json();
      render(data.items || []);
    } catch (error) {
      const featured = document.getElementById('promo-featured');
      if (featured) featured.innerHTML = '<div class="promo-empty"><span>Servizio temporaneamente non disponibile</span><h2>Le promozioni non sono al momento consultabili.</h2><p>Puoi comunque contattarci direttamente per conoscere le offerte attive.</p><a class="button button-primary" href="contatti.html">Contatti</a></div>';
    }
  };

  document.querySelector('.menu-toggle')?.addEventListener('click', () => {
    const button = document.querySelector('.menu-toggle');
    const menu = document.querySelector('.mobile-nav');
    if (!button || !menu) return;
    const open = menu.classList.toggle('open');
    button.setAttribute('aria-expanded', String(open));
  });

  document.querySelectorAll('.mobile-nav a').forEach((link) => link.addEventListener('click', () => {
    document.querySelector('.mobile-nav')?.classList.remove('open');
    document.querySelector('.menu-toggle')?.setAttribute('aria-expanded', 'false');
  }));

  init();
})();
