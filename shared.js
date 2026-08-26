const header = document.getElementById("site-header");
const footer = document.getElementById("site-footer");

if (header) {
  header.innerHTML = `<header class="site-header"><div class="container nav-wrap"><a class="brand" href="index.html" aria-label="Bruniano home"><span class="brand-lockup"><img src="assets/logo-symbol.svg" alt="" class="brand-symbol"><span class="brand-name">bruniano</span><span class="brand-divider" aria-hidden="true"></span><span class="brand-tagline">CENTRO MEDICO<br>SPECIALISTICO</span></span></a><nav class="desktop-nav"><a href="trattamenti.html">Trattamenti</a><a href="studio.html">Lo studio</a><a href="team.html">Team</a><a href="promozioni.html">Promozioni</a><a href="blog.html">Blog</a><a href="contatti.html">Contatti</a></nav><a class="button button-small button-primary" data-whatsapp href="#">Prenota</a><button class="menu-toggle" aria-label="Apri menu" aria-expanded="false"><span></span><span></span></button></div><nav class="mobile-nav"><a href="trattamenti.html">Trattamenti</a><a href="studio.html">Lo studio</a><a href="team.html">Team</a><a href="promozioni.html">Promozioni</a><a href="blog.html">Blog</a><a href="contatti.html">Contatti</a><a data-whatsapp href="#">Prenota su WhatsApp</a></nav></header>`;
}
if (footer) {
  footer.innerHTML = `<footer class="footer"><div class="container footer-grid"><img src="assets/logo-bruniano.svg" alt="Bruniano" class="footer-logo"><div><strong>BRUNIANO</strong><p>Fisioterapia & Riabilitazione</p></div><div class="footer-links"><a href="trattamenti.html">Trattamenti</a><a href="team.html">Team</a><a href="promozioni.html">Promozioni</a><a href="blog.html">Blog</a><a href="contatti.html">Contatti</a></div></div><div class="container footer-bottom"><span>© ${new Date().getFullYear()} Bruniano</span><span><a href="privacy.html">Privacy</a> · <a href="cookie.html">Cookie</a></span><span>Sito realizzato da <strong>Renderlab</strong></span><span><a href="admin/" class="operator-link">Operatori</a></span></div></footer>`;
}

function setupStudioGallery(){
  if(!document.body.classList.contains('studio-page')) return;
  const grid=document.querySelector('.studio-grid');
  const hero=document.querySelector('.studio-hero-media img');
  if(!grid) return;
  fetch('/api/gallery?admin=0',{cache:'no-store'})
    .then(r=>r.ok?r.json():Promise.reject(new Error('gallery')))
    .then(data=>{
      const items=(data.items||[]).filter(x=>x.media_url).slice(0,12);
      if(!items.length) return;
      const images=items.filter(x=>String(x.media_type).startsWith('image'));
      if(hero && images[0]){hero.src=images[0].media_url;hero.alt=images[0].alt_text||images[0].title||'Ambiente Bruniano';}
      grid.innerHTML=items.slice(0,4).map((m,i)=>{
        const media=String(m.media_type).startsWith('video')
          ? `<video src="${m.media_url}" autoplay muted loop playsinline preload="metadata" aria-label="${m.alt_text||m.title||'Video Bruniano'}"></video>`
          : `<img src="${m.media_url}" alt="${m.alt_text||m.title||'Ambiente Bruniano'}" loading="lazy">`;
        const classes=i===0?'studio-tile large':i===3?'studio-tile wide':'studio-tile';
        return `<div class="${classes}">${media}<div class="tile-copy"><small>${String(m.title||'BRUNIANO').toUpperCase()}</small><strong>${m.alt_text||'Scopri gli ambienti del Centro Medico Specialistico Bruniano.'}</strong></div></div>`;
      }).join('');
      grid.querySelectorAll('img,video').forEach(el=>{el.style.width='100%';el.style.height='100%';el.style.objectFit='cover';el.style.display='block';});
    }).catch(()=>{});
}
setupStudioGallery();
