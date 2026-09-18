/* BRUNIANO — Studio gallery mosaic (staging only) */
(function(){
  const API='/api/gallery';
  const STYLE_ID='bruniano-studio-mosaic-v4';
  let cachedItems=[];
  let board=null;
  let rendering=false;
  let observer=null;

  function esc(v){
    return String(v ?? '').replace(/[&<>\"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[s]));
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
    return labels[key] || String(title||'').trim() || 'Ambiente';
  }
  function injectMosaicCss(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      .studio-page .studio-grid{
        display:grid!important;
        grid-template-columns:repeat(12,minmax(0,1fr))!important;
        grid-auto-rows:clamp(82px,7.15vw,112px)!important;
        grid-auto-flow:dense!important;
        gap:16px!important;
        align-items:stretch!important;
        height:auto!important;
        min-height:0!important;
        overflow:visible!important
      }
      .studio-page .studio-grid>.studio-row{display:contents!important}
      .studio-page .studio-grid .studio-tile{
        grid-column:auto!important;
        grid-row:auto!important;
        min-width:0!important;
        min-height:0!important;
        width:auto!important;
        height:auto!important;
        border-radius:24px!important;
        overflow:hidden!important;
        position:relative!important;
        background:#dce6f2!important;
        float:none!important;
        inset:auto!important;
        transform:none!important
      }
      .studio-page .studio-grid .studio-tile:nth-child(1){grid-column:span 8!important;grid-row:span 5!important}
      .studio-page .studio-grid .studio-tile:nth-child(2){grid-column:span 4!important;grid-row:span 4!important}
      .studio-page .studio-grid .studio-tile:nth-child(3){grid-column:span 4!important;grid-row:span 3!important}
      .studio-page .studio-grid .studio-tile:nth-child(4){grid-column:span 3!important;grid-row:span 4!important}
      .studio-page .studio-grid .studio-tile:nth-child(5){grid-column:span 5!important;grid-row:span 4!important}
      .studio-page .studio-grid .studio-tile:nth-child(6){grid-column:span 2!important;grid-row:span 2!important}
      .studio-page .studio-grid .studio-tile:nth-child(7){grid-column:span 2!important;grid-row:span 2!important}
      .studio-page .studio-grid .studio-tile:nth-child(n+8){grid-column:span 3!important;grid-row:span 2!important}
      .studio-page .studio-grid .studio-tile:after{
        content:""!important;
        position:absolute!important;
        inset:0!important;
        background:linear-gradient(transparent 48%,rgba(5,19,45,.72))!important;
        pointer-events:none!important;
        z-index:2!important
      }
      .studio-page .studio-grid .studio-tile img,
      .studio-page .studio-grid .studio-tile video{
        width:100%!important;
        height:100%!important;
        object-fit:cover!important;
        display:block!important
      }
      .studio-page .studio-grid .studio-tile>span,
      .studio-page .studio-grid .studio-tile>small{
        position:absolute!important;
        left:18px!important;
        right:18px!important;
        z-index:3!important;
        color:#fff!important;
        text-shadow:0 2px 10px rgba(0,0,0,.3)!important
      }
      .studio-page .studio-grid .studio-tile>span{
        bottom:40px!important;
        font-size:10px!important;
        letter-spacing:.15em!important;
        font-weight:900!important
      }
      .studio-page .studio-grid .studio-tile>small{
        bottom:17px!important;
        font-size:12px!important;
        line-height:1.25!important
      }

      @media(max-width:1050px){
        .studio-page .studio-grid{
          grid-template-columns:repeat(10,minmax(0,1fr))!important;
          grid-auto-rows:clamp(85px,8.7vw,108px)!important;
          gap:14px!important
        }
        .studio-page .studio-grid .studio-tile:nth-child(1){grid-column:span 6!important;grid-row:span 5!important}
        .studio-page .studio-grid .studio-tile:nth-child(2){grid-column:span 4!important;grid-row:span 4!important}
        .studio-page .studio-grid .studio-tile:nth-child(3){grid-column:span 4!important;grid-row:span 3!important}
        .studio-page .studio-grid .studio-tile:nth-child(4){grid-column:span 3!important;grid-row:span 4!important}
        .studio-page .studio-grid .studio-tile:nth-child(5){grid-column:span 3!important;grid-row:span 4!important}
        .studio-page .studio-grid .studio-tile:nth-child(6){grid-column:span 2!important;grid-row:span 2!important}
        .studio-page .studio-grid .studio-tile:nth-child(7){grid-column:span 2!important;grid-row:span 2!important}
      }

      /* MOBILE: hard vertical stack, independent from the desktop mosaic */
      @media(max-width:760px){
        .studio-page .studio-grid{
          display:block!important;
          width:100%!important;
          height:auto!important;
          min-height:0!important;
          overflow:visible!important;
          margin:0!important;
          padding:0!important
        }
        .studio-page .studio-grid>.studio-row{
          display:block!important;
          width:100%!important;
          height:auto!important;
          min-height:0!important;
          margin:0!important;
          padding:0!important
        }
        .studio-page .studio-grid>.studio-tile,
        .studio-page .studio-grid>.studio-row>.studio-tile,
        .studio-page .studio-grid .studio-tile,
        .studio-page .studio-grid .studio-tile:nth-child(n){
          display:block!important;
          box-sizing:border-box!important;
          width:100%!important;
          max-width:100%!important;
          height:220px!important;
          min-height:220px!important;
          margin:0 0 14px 0!important;
          padding:0!important;
          position:relative!important;
          float:none!important;
          clear:both!important;
          inset:auto!important;
          transform:none!important;
          aspect-ratio:auto!important;
          grid-column:auto!important;
          grid-row:auto!important
        }
        .studio-page .studio-grid .studio-tile:last-child{margin-bottom:0!important}
        .studio-page .studio-grid .studio-row:last-child>.studio-tile:last-child{margin-bottom:0!important}
        .studio-page .studio-grid .studio-tile img,
        .studio-page .studio-grid .studio-tile video{
          width:100%!important;
          height:100%!important;
          max-width:none!important;
          display:block!important;
          object-fit:cover!important
        }
      }

      @media(max-width:560px){
        .studio-page .studio-grid>.studio-tile,
        .studio-page .studio-grid>.studio-row>.studio-tile,
        .studio-page .studio-grid .studio-tile,
        .studio-page .studio-grid .studio-tile:nth-child(n){
          height:205px!important;
          min-height:205px!important
        }
      }
    `;
    document.head.appendChild(style);
  }

  function render(items){
    if(!board||!items.length||rendering)return;
    rendering=true;
    const mobileStack=window.matchMedia('(max-width:760px)').matches;
    board.innerHTML=items.map(m=>{
      const label=labelFor(m.title);
      const video=String(m.media_type||'').startsWith('video');
      const media=video
        ? `<video src="${esc(m.media_url)}" muted loop autoplay playsinline preload="metadata" aria-label="${esc(m.alt_text||label)}"></video>`
        : `<img src="${esc(m.media_url)}" alt="${esc(m.alt_text||label)}" loading="lazy" decoding="async">`;
      const mobileStyle=mobileStack ? 'style="display:block!important;box-sizing:border-box!important;width:100%!important;max-width:100%!important;height:220px!important;min-height:220px!important;margin:0 0 14px 0!important;padding:0!important;position:relative!important;float:none!important;clear:both!important;inset:auto!important;transform:none!important;aspect-ratio:auto!important;grid-column:auto!important;grid-row:auto!important;"' : '';
      return `<div class="studio-tile" ${mobileStyle}>${media}<span>BRUNIANO</span><small>${esc(label)}</small></div>`;
    }).join('');
    if(mobileStack){
      const tiles=[...board.querySelectorAll('.studio-tile')];
      if(tiles.length) tiles[tiles.length-1].style.setProperty('margin-bottom','0','important');
    }
    board.dataset.count=String(items.length);
    board.dataset.studioManaged='1';
    board.classList.add('is-ready');
    rendering=false;
  }

  function ensureMosaic(){
    if(!board||!cachedItems.length||rendering)return;
    const children=[...board.children];
    const directTiles=children.length===cachedItems.length && children.every(el=>el.classList.contains('studio-tile'));
    if(!directTiles)render(cachedItems);
  }

  async function load(){
    board=document.querySelector('.studio-page .studio-grid');
    if(!board)return;
    injectMosaicCss();

    if(!observer){
      observer=new MutationObserver(()=>{
        if(rendering)return;
        ensureMosaic();
      });
      observer.observe(board,{childList:true});
    }

    try{
      const r=await fetch(API,{credentials:'same-origin',cache:'no-store'});
      if(!r.ok)throw new Error('gallery');
      const data=await r.json();
      cachedItems=(data.items||[]).filter(x=>x.is_published&&x.media_url);
      render(cachedItems);
      setTimeout(ensureMosaic,50);
      setTimeout(ensureMosaic,250);
    }catch(error){
      console.warn('Studio mosaic:',error);
    }
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',load,{once:true});
  }else{
    load();
  }
  window.addEventListener('resize',()=>{
    if(!board||!cachedItems.length||rendering)return;
    const mobile=window.matchMedia('(max-width:760px)').matches;
    const tiles=[...board.querySelectorAll('.studio-tile')];
    tiles.forEach((tile,index)=>{
      if(mobile){
        tile.style.setProperty('display','block','important');
        tile.style.setProperty('width','100%','important');
        tile.style.setProperty('height',window.innerWidth<=560?'205px':'220px','important');
        tile.style.setProperty('margin-bottom',index===tiles.length-1?'0':'14px','important');
        tile.style.setProperty('position','relative','important');
        tile.style.setProperty('float','none','important');
        tile.style.setProperty('clear','both','important');
        tile.style.setProperty('grid-column','auto','important');
        tile.style.setProperty('grid-row','auto','important');
      }else{
        ['display','width','height','margin-bottom','position','float','clear','grid-column','grid-row'].forEach(p=>tile.style.removeProperty(p));
      }
    });
  });
})();