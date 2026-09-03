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

  function loadStudioManager() {
    if (!document.getElementById('panel-gallery') || document.querySelector('script[data-studio-manager]')) return;
    const script = document.createElement('script');
    script.src = 'studio-manager.js?v=20260903';
    script.dataset.studioManager = '1';
    script.async = true;
    document.body.appendChild(script);
  }

  loadPromotionCount();
  loadStudioManager();
})();
