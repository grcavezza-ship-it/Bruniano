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
    return new Promise((resolve) => {
      if (document.querySelector(`script[data-${attribute}]`)) return resolve();
      const script = document.createElement('script');
      script.src = `${path}?v=20260909-description-fix2`;
      script.dataset[attribute] = '1';
      script.onload = resolve;
      script.onerror = resolve;
      document.body.appendChild(script);
    });
  }

  loadPromotionCount();
  loadAdminScript('studio-manager.js', 'studioManager').then(() => loadAdminScript('studio-slots.js', 'studioSlots'));
  loadAdminScript('interface-copy.js', 'interfaceCopy');
})();
