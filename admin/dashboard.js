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

  async function loadGalleryCount() {
    const el = document.getElementById('count-gallery');
    if (!el) return;
    try {
      const response = await fetch('../api/gallery?admin=1', { credentials: 'same-origin', cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      const items = Array.isArray(data.items) ? data.items : [];
      el.textContent = items.filter(item => item.is_published === true).length;
    } catch {
      // Keep the placeholder when the endpoint is unavailable.
    }
  }

  loadPromotionCount();
  loadGalleryCount();
  loadAdminScript('studio-manager.js', 'studioManager').then(() => loadAdminScript('studio-slots.js', 'studioSlots'));
  loadAdminScript('interface-copy.js', 'interfaceCopy');
})();
