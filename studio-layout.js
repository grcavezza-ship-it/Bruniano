/* Studio gallery: same visual language and card structure as the homepage gallery. */
(function(){
  const API='/api/gallery';

  function esc(v){
    return String(v ?? '').replace(/[&<>\"]/g, s => ({
      '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;'
    }[s]));
  }

  function labelFor(title){
    const key=String(title||'').trim().toUpperCase();
    const labels={
      'HALL':'Ambiente',
      'SALA TRATTAMENTI':'Sala trattamento',
      'STUDIO FISIOTERAPISTA':'Studio fisioterapista',
      'SALA ESERCIZI':'Sala esercizi',
      'AREA ATTESA':'Area attesa',
      'STUDIO MEDICO':'Studio medico',
      'STUDIO NUTRIZIONISTA':'Studio nutrizionista'
    };
    return labels[key] || String(title||'').trim();
  }

  async function load(){
    const board=document.querySelector('.studio-grid');
    if(!board)return;
    try{
      const r=await fetch(API,{credentials:'same-origin',cache:'no-store'});
      if(!r.ok)return;
      const data=await r.json();
      const items=(data.items||[]).filter(x=>x.is_published && x.media_url);

      // Adopt the exact same gallery classes used on the homepage.
      board.className='gallery-grid home-gallery';
      board.innerHTML=items.map(m=>{
        const label=labelFor(m.title);
        const video=String(m.media_type||'').startsWith('video');
        if(video){
          return `<div class="gallery-tile real-photo" style="background:#dce7f9">
            <video src="${esc(m.media_url)}" muted loop autoplay playsinline style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></video>
            <span>BRUNIANO</span><small>${esc(label)}</small>
          </div>`;
        }
        return `<div class="gallery-tile real-photo" style="background-image:url('${esc(m.media_url)}')">
          <span>BRUNIANO</span><small>${esc(label)}</small>
        </div>`;
      }).join('');
    }catch(error){
      console.warn('Studio gallery:',error);
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});
  else load();
})();
