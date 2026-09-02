/* BRUNIANO — shared public shell
   One header/footer source of truth for every public page. */
(function () {
  const HEADER_ID = 'site-header';
  const HEADER_HTML = `
<header class="site-header" id="top">
  <div class="container nav-wrap">
    <a class="brand" href="index.html" aria-label="Bruniano home">
      <span class="brand-lockup">
        <img src="assets/logo-symbol.svg" alt="" class="brand-symbol">
        <span class="brand-name">bruniano</span>
        <span class="brand-divider" aria-hidden="true"></span>
        <span class="brand-tagline">CENTRO MEDICO<br>SPECIALISTICO</span>
      </span>
    </a>
    <nav class="desktop-nav" aria-label="Navigazione principale">
      <a href="trattamenti.html">Trattamenti</a>
      <a href="studio.html">Lo studio</a>
      <a href="team.html">Team</a>
      <a href="promozioni.html">Promozioni</a>
      <a href="blog.html">Blog</a>
      <a href="contatti.html">Contatti</a>
    </nav>
    <a class="button button-small button-primary header-book" data-whatsapp href="#">Prenota</a>
    <button class="menu-toggle" type="button" aria-label="Apri menu" aria-expanded="false"><span></span><span></span></button>
  </div>
  <nav class="mobile-nav" aria-label="Menu mobile">
    <a href="trattamenti.html">Trattamenti</a>
    <a href="studio.html">Lo studio</a>
    <a href="team.html">Team</a>
    <a href="promozioni.html">Promozioni</a>
    <a href="blog.html">Blog</a>
    <a href="contatti.html">Contatti</a>
    <a data-whatsapp href="#">Prenota su WhatsApp</a>
  </nav>
</header>`;

  const HEADER_CSS = `
.site-header{position:relative;z-index:50;background:#fff;border-bottom:1px solid #e5eaf1}
.site-header .container{max-width:1200px;margin:0 auto;padding:0 24px}
.site-header .nav-wrap{min-height:76px;display:flex;align-items:center;justify-content:space-between;gap:28px}
.site-header .brand{display:flex;align-items:center;flex:0 0 auto;text-decoration:none}
.site-header .brand-lockup{display:flex;align-items:center;gap:12px;min-height:54px}
.site-header .brand-symbol{width:48px;height:48px;display:block;flex:0 0 48px}
.site-header .brand-name{font-family:Manrope,system-ui,sans-serif;font-size:35px;line-height:1;font-weight:800;letter-spacing:-.065em;color:#111a2c}
.site-header .brand-divider{width:1px;height:38px;background:#d8dde6;margin:0 10px 0 6px}
.site-header .brand-tagline{font-family:Manrope,system-ui,sans-serif;font-size:12px;line-height:1.12;font-weight:800;letter-spacing:.10em;color:#687385;white-space:nowrap}
.site-header .desktop-nav{display:flex;align-items:center;gap:22px}
.site-header .desktop-nav a{color:#566377;font-size:13px;font-weight:700;text-decoration:none;transition:color .2s ease}
.site-header .desktop-nav a:hover,.site-header .desktop-nav a[aria-current="page"]{color:#125cff}
.site-header .header-book{white-space:nowrap}
.site-header .menu-toggle{display:none;border:0;background:transparent;padding:10px;cursor:pointer}
.site-header .menu-toggle span{display:block;width:25px;height:2px;background:#111a2c;border-radius:3px;margin:5px 0}
.site-header .mobile-nav{display:none}
@media(max-width:950px){
  .site-header .desktop-nav,.site-header .header-book{display:none}
  .site-header .menu-toggle{display:block}
  .site-header .mobile-nav{display:flex;flex-direction:column;overflow:hidden;max-height:0;opacity:0;visibility:hidden;transform:translateY(-10px);pointer-events:none;padding:0 24px;transition:max-height .38s ease,opacity .24s ease,transform .30s ease,visibility 0s linear .38s}
  .site-header .mobile-nav.open{max-height:520px;opacity:1;visibility:visible;transform:translateY(0);pointer-events:auto;padding-bottom:15px;transition:max-height .42s ease,opacity .24s ease,transform .30s ease,visibility 0s linear 0s}
  .site-header .mobile-nav a{padding:12px 0;border-bottom:1px solid #edf1f5;color:#344257;font-size:13px;font-weight:800;text-decoration:none}
}
@media(max-width:650px){
  .site-header .nav-wrap{gap:12px}
  .site-header .brand-lockup{gap:9px}
  .site-header .brand-symbol{width:42px;height:42px;flex-basis:42px}
  .site-header .brand-name{font-size:27px}
  .site-header .brand-divider{height:31px;margin:0 6px 0 1px}
  .site-header .brand-tagline{font-size:9px;letter-spacing:.075em}
}
`;

  function mountHeader() {
    let host = document.getElementById(HEADER_ID);
    let header = document.querySelector('header.site-header');

    if (host) {
      host.innerHTML = HEADER_HTML;
      header = host.querySelector('header.site-header');
    } else if (header) {
      header.outerHTML = `<div id="${HEADER_ID}">${HEADER_HTML}</div>`;
      host = document.getElementById(HEADER_ID);
      header = host && host.querySelector('header.site-header');
    }

    if (!host || !header) return null;

    if (!document.getElementById('bruniano-shared-header-style')) {
      const style = document.createElement('style');
      style.id = 'bruniano-shared-header-style';
      style.textContent = HEADER_CSS;
      document.head.appendChild(style);
    }

    const current = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    header.querySelectorAll('.desktop-nav a, .mobile-nav a').forEach((link) => {
      const href = (link.getAttribute('href') || '').split('#')[0].toLowerCase();
      if (href === current) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });

    const menuToggle = header.querySelector('.menu-toggle');
    const mobileNav = header.querySelector('.mobile-nav');
    if (menuToggle && mobileNav) {
      const setMenu = (open) => {
        mobileNav.classList.toggle('open', open);
        menuToggle.setAttribute('aria-expanded', String(open));
        menuToggle.setAttribute('aria-label', open ? 'Chiudi menu' : 'Apri menu');
      };
      menuToggle.addEventListener('click', () => setMenu(!mobileNav.classList.contains('open')));
      mobileNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
      document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setMenu(false); });
    }
    return header;
  }

  mountHeader();

  const footerMarkup = `<footer class="footer"><div class="container footer-grid"><img src="assets/logo-symbol.svg" alt="Bruniano" class="footer-logo"><div><strong>BRUNIANO</strong><p>Fisioterapia &amp; Riabilitazione</p></div><div class="footer-links"><a href="trattamenti.html">Trattamenti</a><a href="team.html">Team</a><a href="promozioni.html">Promozioni</a><a href="blog.html">Blog</a><a href="contatti.html">Contatti</a></div></div><div class="container footer-bottom"><span>© ${new Date().getFullYear()} Bruniano</span><span><a href="privacy.html">Privacy</a> · <a href="cookie.html">Cookie</a></span><span>Sito realizzato da <strong>Renderlab</strong></span><span><a href="admin/" class="operator-link">Operatori</a></span></div></footer>`;
  const footerPlaceholder = document.getElementById('site-footer');
  const legacyFooter = document.querySelector('footer.footer');
  const footerHost = footerPlaceholder || legacyFooter;
  if (footerHost) {
    if (footerHost.tagName === 'FOOTER') footerHost.outerHTML = footerMarkup;
    else footerHost.innerHTML = footerMarkup;
  } else {
    const host = document.createElement('div');
    host.id = 'site-footer';
    host.innerHTML = footerMarkup;
    document.body.appendChild(host);
  }

  function promoActive(p) {
    const now = Date.now();
    return (!p.starts_at || new Date(p.starts_at).getTime() <= now) && (!p.ends_at || new Date(p.ends_at).getTime() >= now);
  }
  function promoText(p) { return p.subtitle || p.description || ''; }
  function promoWa(p) { return encodeURIComponent(p.whatsapp_message || `Buongiorno, vorrei ricevere informazioni sulla promozione "${p.title}" presso Bruniano.`); }

  function setupStudioGallery() {
    if (!document.body.classList.contains('studio-page')) return;
    const grid = document.querySelector('.studio-grid');
    const hero = document.querySelector('.studio-hero-media img');
    if (!grid) return;
    fetch('/api/gallery?admin=0', { cache: 'no-store' }).then((r) => r.ok ? r.json() : Promise.reject(new Error('gallery'))).then((data) => {
      const items = (data.items || []).filter((x) => x.media_url).slice(0, 12);
      if (!items.length) return;
      const images = items.filter((x) => String(x.media_type).startsWith('image'));
      if (hero && images[0]) {
        hero.src = images[0].media_url;
        hero.alt = images[0].alt_text || images[0].title || 'Ambiente Bruniano';
      }
      grid.innerHTML = items.slice(0, 4).map((m, i) => {
        const media = String(m.media_type).startsWith('video') ? `<video src="${m.media_url}" autoplay muted loop playsinline preload="metadata" aria-label="${m.alt_text || m.title || 'Video Bruniano'}"></video>` : `<img src="${m.media_url}" alt="${m.alt_text || m.title || 'Ambiente Bruniano'}" loading="lazy">`;
        const classes = i === 0 ? 'studio-tile large' : i === 3 ? 'studio-tile wide' : 'studio-tile';
        return `<div class="${classes}">${media}<div class="tile-copy"><small>${String(m.title || 'BRUNIANO').toUpperCase()}</small><strong>${m.alt_text || 'Scopri gli ambienti del Centro Medico Specialistico Bruniano.'}</strong></div></div>`;
      }).join('');
      grid.querySelectorAll('img,video').forEach((el) => { el.style.width = '100%'; el.style.height = '100%'; el.style.objectFit = 'cover'; el.style.display = 'block'; });
    }).catch(() => {});
  }
  setupStudioGallery();

  function setupHomePromotions() {
    if (!document.body.classList.contains('home-impact')) return;
    const ribbon = document.querySelector('.offer-ribbon');
    const band = document.querySelector('.promo-home');
    if (!ribbon && !band) return;
    fetch('/api/promotions', { cache: 'no-store' }).then((r) => r.ok ? r.json() : Promise.reject()).then((data) => {
      const items = (data.items || []).filter((p) => p.is_published !== false && promoActive(p));
      const top = items.filter((p) => p.show_home_top).sort((a, b) => (a.home_top_order || 0) - (b.home_top_order || 0))[0];
      const center = items.filter((p) => p.show_home_center).sort((a, b) => (a.home_center_order || 0) - (b.home_center_order || 0))[0];
      const apply = (el, p, type) => {
        if (!el || !p) return;
        if (type === 'top') {
          const strong = el.querySelector('.offer-ribbon-inner strong');
          const small = el.querySelector('.offer-ribbon-inner small');
          const link = el.querySelector('.offer-link');
          if (strong) strong.textContent = p.title;
          if (small) small.textContent = promoText(p);
          if (link) { link.href = p.id ? `promozioni.html#promo-${p.id}` : 'promozioni.html'; link.textContent = `${p.cta_label || 'Scopri l’offerta'} →`; }
        } else {
          const h = el.querySelector('h2');
          const desc = el.querySelector('p');
          const link = el.querySelector('a.button');
          if (h) h.textContent = p.title;
          if (desc) desc.textContent = p.description || p.subtitle || '';
          if (link) { link.href = p.id ? `promozioni.html#promo-${p.id}` : 'promozioni.html'; link.textContent = p.cta_label || 'Scopri l’offerta'; }
        }
      };
      if (top) apply(ribbon, top, 'top'); else if (ribbon) ribbon.style.display = 'none';
      if (center) apply(band, center, 'center'); else if (band) band.style.display = 'none';
    }).catch(() => {});
  }
  setupHomePromotions();
})();
