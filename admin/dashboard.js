(() => {
  async function loadPromotionCount() {
    const el = document.getElementById('count-promos');
    if (!el) return;
    try {
      const response = await fetch('../api/promotions', { credentials: 'same-origin', cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      const items = Array.isArray(data.items) ? data.items : [];
      el.textContent = items.length;
    } catch {
      // Keep the placeholder when the endpoint is unavailable.
    }
  }

  function loadAdminScript(path, attribute) {
    if (document.querySelector(`script[data-${attribute}]`)) return;
    const script = document.createElement('script');
    script.src = `${path}?v=20260903`;
    script.dataset[attribute] = '1';
    script.async = true;
    document.body.appendChild(script);
  }

  function loadAdminStyle(path, attribute) {
    if (document.querySelector(`link[data-${attribute}]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${path}?v=20260903`;
    link.dataset[attribute] = '1';
    document.head.appendChild(link);
  }

  loadPromotionCount();
  loadAdminStyle('mobile-shell.css', 'mobileAdminStyle');
  loadAdminScript('studio-manager.js', 'studioManager');
  loadAdminScript('interface-copy.js', 'interfaceCopy');
  loadAdminScript('mobile-shell.js', 'mobileAdmin');
})();
