(() => {
  async function loadPromotionCount() {
    const el = document.getElementById('count-promos'); if (!el) return;
    try { const r = await fetch('../api/promotions', {credentials:'same-origin',cache:'no-store'}); if(!r.ok)return; const d=await r.json(); el.textContent=Array.isArray(d.items)?d.items.length:0; } catch {}
  }
  function loadAdminScript(path, attribute) {
    if (document.querySelector(`script[data-${attribute}]`)) return;
    const script=document.createElement('script'); script.src=`${path}?v=20260910-description-final`; script.dataset[attribute]='1'; script.async=true; document.body.appendChild(script);
  }
  loadPromotionCount();
  loadAdminScript('studio-manager.js','studioManager');
  loadAdminScript('studio-slots.js','studioSlots');
  loadAdminScript('studio-description-fix.js','studioDescriptionFix');
  loadAdminScript('interface-copy.js','interfaceCopy');
})();
