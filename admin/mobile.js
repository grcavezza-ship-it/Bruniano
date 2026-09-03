(() => {
  if (window.__brunianoAdminMobile) return;
  window.__brunianoAdminMobile = true;

  const root = document.documentElement;
  const head = document.head;
  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = 'mobile.css?v=20260903';
  head.appendChild(css);

  const manifest = document.createElement('link');
  manifest.rel = 'manifest';
  manifest.href = 'manifest.webmanifest?v=20260903';
  head.appendChild(manifest);

  const theme = document.createElement('meta');
  theme.name = 'theme-color';
  theme.content = '#ffffff';
  head.appendChild(theme);

  const apple = document.createElement('meta');
  apple.name = 'apple-mobile-web-app-capable';
  apple.content = 'yes';
  head.appendChild(apple);

  const appleStatus = document.createElement('meta');
  appleStatus.name = 'apple-mobile-web-app-status-bar-style';
  appleStatus.content = 'default';
  head.appendChild(appleStatus);

  const appleTitle = document.createElement('meta');
  appleTitle.name = 'apple-mobile-web-app-title';
  appleTitle.content = 'Bruniano';
  head.appendChild(appleTitle);

  function ensureBrand() {
    const topbar = document.querySelector('.topbar');
    if (!topbar || document.getElementById('mobile-admin-brand')) return;
    const brand = document.createElement('a');
    brand.id = 'mobile-admin-brand';
    brand.className = 'mobile-admin-brand';
    brand.href = '../index.html';
    brand.setAttribute('aria-label', 'Bruniano');
    brand.innerHTML = '<img src="../assets/logo-symbol.svg" alt=""><span><strong>bruniano</strong><small>CENTRO MEDICO SPECIALISTICO</small></span>';
    topbar.insertBefore(brand, topbar.querySelector('.topbar-actions'));
  }

  function closeMenu() {
    root.classList.remove('menu-open');
    const button = document.getElementById('mobile-menu');
    if (button) {
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-label', 'Apri menu');
    }
  }

  function toggleMenu() {
    const open = !root.classList.contains('menu-open');
    root.classList.toggle('menu-open', open);
    const button = document.getElementById('mobile-menu');
    if (button) {
      button.setAttribute('aria-expanded', String(open));
      button.setAttribute('aria-label', open ? 'Chiudi menu' : 'Apri menu');
    }
  }

  function setupNavigation() {
    const button = document.getElementById('mobile-menu');
    if (button && !button.dataset.mobileReady) {
      button.dataset.mobileReady = '1';
      button.addEventListener('click', toggleMenu);
    }
    document.querySelectorAll('.nav-item, [data-view-link]').forEach((item) => {
      if (item.dataset.mobileClose) return;
      item.dataset.mobileClose = '1';
      item.addEventListener('click', () => setTimeout(closeMenu, 20));
    });
    document.addEventListener('click', (event) => {
      if (!root.classList.contains('menu-open')) return;
      const sidebar = document.getElementById('sidebar');
      const button = document.getElementById('mobile-menu');
      if (sidebar && !sidebar.contains(event.target) && button && !button.contains(event.target)) closeMenu();
    }, { passive: true });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
    });
  }

  function setViewportHeight() {
    root.style.setProperty('--app-vh', `${window.innerHeight}px`);
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js', { scope: './' }).catch(() => {}), { once: true });
  }

  function init() {
    ensureBrand();
    setupNavigation();
    setViewportHeight();
    registerServiceWorker();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
  window.addEventListener('resize', setViewportHeight, { passive: true });
})();
