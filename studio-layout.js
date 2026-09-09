/* Layout pubblico dinamico di "Lo Studio": nessun riquadro vuoto. */
(function(){
  const API='/api/gallery';
  function esc(v){return String(v??'').replace(/[&<>\"]/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[s]))}
  function technical(v){const s=String(v||'').trim();return !s||/\.(jpe?g|png|webp|avif|mp4|mov)$/i.test(s)||/^[A-Z0-9_-]{12,}(\.[A-Z0-9]+)?$/i.test(s)}
  function layoutClass(n){if(n===1)return 'studio-auto-count-1';if(n===2)return 'studio-auto-count-2';if(n===3)return 'studio-auto-count-3';if(n===4)return 'studio-auto-count-4';if(n===5)return 'studio-auto-count-5';if(n===6)return 'studio-auto-count-6';if(n===7)return 'studio-auto-count-7';if(n===8)return 'studio-auto-count-8';return n%4===0?'studio-auto-count-4plus':n%3===0?'studio-auto-count-3plus':'studio-auto-count-auto'}
  async function load(){
    const board=document.getElementById('studio-grid')||document.querySelector('[data-studio-grid]');
    if(!board)return;
    try{
      const r=await fetch(API,{credentials:'same-origin',cache:'no-store'});if(!r.ok)return;
      const data=await r.json();const items=(data.items||[]).filter(x=>x.is_published && x.media_url);
      board.classList.add('studio-auto-grid');
      board.classList.remove(...Array.from(board.classList).filter(c=>c.indexOf('studio-auto-count-')===0));
      board.classList.add(layoutClass(items.length));
      board.innerHTML=items.map((m,i)=>{
        const video=String(m.media_type||'').startsWith('video');
        const desc=technical(m.title)?'':m.title;
        return `<article class="studio-auto-item"><div class="studio-auto-media">${video?`<video src="${esc(m.media_url)}" muted loop autoplay playsinline></video>`:`<img src="${esc(m.media_url)}" alt="${esc(m.alt_text||desc||'Centro Bruniano')}">`}</div>${desc?`<div class="studio-auto-caption">${esc(desc)}</div>`:''}</article>`;
      }).join('');
    }catch(error){console.warn('Studio layout:',error)}
  }
  function init(){load()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
