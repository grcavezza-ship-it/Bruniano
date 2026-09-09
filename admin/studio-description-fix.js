/* Correzione salvataggio descrizioni: intercetta il pulsante Salva del riquadro e verifica il dato rileggendolo dal DB. */
(function(){
  const API='../api/gallery';
  async function save(btn){
    const slot=Number(btn.dataset.save); const card=btn.closest('[data-dynamic-slot]'); if(!slot||!card)return;
    const ta=card.querySelector(`[data-desc="${slot}"]`); if(!ta)return;
    let items=[];
    try{
      const g=await fetch(API+'?admin=1',{credentials:'same-origin',cache:'no-store'}); const gd=await g.json(); items=gd.items||[];
      const m=items.find(x=>Number(x.studio_slot)===slot); if(!m)return;
      const description=ta.value.trim();
      const r=await fetch(API,{method:'PUT',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({id:m.id,title:description,alt_text:description||'Bruniano',media_type:m.media_type,media_url:m.media_url,sort_order:Number(m.sort_order)||0,studio_slot:slot,is_published:Boolean(m.is_published)})});
      const d=await r.json().catch(()=>({})); if(!r.ok)throw Error(d.error||`HTTP ${r.status}`);
      const v=await fetch(API+'?admin=1',{credentials:'same-origin',cache:'no-store'}); const vd=await v.json(); const saved=(vd.items||[]).find(x=>String(x.id)===String(m.id));
      if(saved)ta.value=saved.title||'';
      let s=card.querySelector('[data-desc-status]'); if(!s){s=document.createElement('span');s.dataset.descStatus='1';s.style.cssText='font-size:10px;font-weight:800;color:#18794e;margin-left:7px';btn.parentElement.appendChild(s)} s.textContent='Salvato ✓';setTimeout(()=>{s.textContent=''},1800);
    }catch(e){alert('Impossibile salvare la descrizione: '+(e.message||e));}
  }
  function init(){
    const root=document.getElementById('panel-gallery')||document.body;
    root.addEventListener('click',e=>{const b=e.target.closest('[data-save]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();save(b)},true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
