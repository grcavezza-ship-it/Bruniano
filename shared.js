const header = document.getElementById("site-header") || document.querySelector(".home-impact .site-header");

/* Shared layout is rendered once, from one source of truth, so every public page
   has exactly the same header and footer. */
if (header) {
  const isExistingHomeHeader = header.classList.contains("site-header");
  if (!isExistingHomeHeader) {
    header.innerHTML = `<header class="site-header" id="top">
  <div class="container nav-wrap">
    <a class="brand" href="index.html" aria-label="Bruniano home"><img src="assets/logo-bruniano.svg" alt="Bruniano" class="brand-logo"></a>
    <nav class="desktop-nav" aria-label="Navigazione principale">
      <a href="trattamenti.html">Trattamenti</a><a href="studio.html">Lo studio</a><a href="team.html">Team</a><a href="promozioni.html">Promozioni</a><a href="blog.html">Blog</a><a href="contatti.html">Contatti</a>
    </nav>
    <a class="button button-small button-primary" data-whatsapp href="#">Prenota</a>
    <button class="menu-toggle" type="button" aria-label="Apri menu" aria-expanded="false"><span></span><span></span></button>
  </div>
  <nav class="mobile-nav" aria-label="Menu mobile">
    <a href="trattamenti.html">Trattamenti</a><a href="studio.html">Lo studio</a><a href="team.html">Team</a><a href="promozioni.html">Promozioni</a><a href="blog.html">Blog</a><a href="contatti.html">Contatti</a><a data-whatsapp href="#">Prenota su WhatsApp</a>
  </nav>
</header>`;
  }
  document.querySelectorAll(".site-header .brand").forEach((brand) => {
    brand.innerHTML = `<span class="brand-lockup"><img src="assets/logo-symbol.svg" alt="" class="brand-symbol"><span class="brand-name">bruniano</span><span class="brand-divider" aria-hidden="true"></span><span class="brand-tagline">CENTRO MEDICO<br>SPECIALISTICO</span></span>`;
  });
  const brandStyle = document.createElement("style");
  brandStyle.textContent = `
    .site-header .brand{display:flex;align-items:center;flex:0 0 auto;text-decoration:none}
    .site-header .brand-lockup{display:flex;align-items:center;gap:12px;min-height:54px}
    .site-header .brand-symbol{width:48px;height:48px;display:block;flex:0 0 48px}
    .site-header .brand-name{font-family:Manrope,system-ui,sans-serif;font-size:35px;line-height:1;font-weight:800;letter-spacing:-.065em;color:#111a2c}
    .site-header .brand-divider{width:1px;height:38px;background:#d8dde6;margin:0 10px 0 6px}
    .site-header .brand-tagline{font-family:Manrope,system-ui,sans-serif;font-size:12px;line-height:1.12;font-weight:800;letter-spacing:.10em;color:#687385;white-space:nowrap}
    @media(max-width:900px){.site-header .brand-lockup{gap:10px;min-height:52px}.site-header .brand-symbol{width:46px;height:46px;flex-basis:46px}.site-header .brand-name{font-size:30px}.site-header .brand-divider{height:34px;margin:0 8px 0 3px}.site-header .brand-tagline{font-size:10px;letter-spacing:.085em}}
    @media(max-width:600px){.site-header .brand-lockup{gap:9px}.site-header .brand-symbol{width:42px;height:42px;flex-basis:42px}.site-header .brand-name{font-size:27px}.site-header .brand-divider{height:31px;margin:0 6px 0 1px}.site-header .brand-tagline{font-size:9px;letter-spacing:.075em}}
  `;
  document.head.appendChild(brandStyle);
  const menuToggle = header.querySelector(".menu-toggle");
  const mobileNav = header.querySelector(".mobile-nav");
  if (menuToggle && mobileNav) {
    const setMenu = (open) => { mobileNav.classList.toggle("open", open); menuToggle.setAttribute("aria-expanded", String(open)); menuToggle.setAttribute("aria-label", open ? "Chiudi menu" : "Apri menu"); };
    document.addEventListener("click", (event) => { const toggle = event.target.closest?.(".menu-toggle"); if (toggle !== menuToggle) return; event.preventDefault(); event.stopPropagation(); setMenu(!mobileNav.classList.contains("open")); }, true);
    mobileNav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenu(false)));
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") setMenu(false); });
  }
  const menuStyle = document.createElement("style");
  menuStyle.textContent = `@media (max-width:950px){#site-header{min-height:0!important;height:70px!important}#site-header>.site-header{min-height:70px!important;height:70px!important}#site-header>.site-header .nav-wrap{height:70px!important;min-height:70px!important}.site-header .mobile-nav{display:flex;flex-direction:column;overflow:hidden;max-height:0;opacity:0;visibility:hidden;transform:translateY(-10px);pointer-events:none;transition:max-height .34s ease,opacity .24s ease,transform .30s ease,visibility 0s linear .34s}.site-header .mobile-nav.open{max-height:520px;opacity:1;visibility:visible;transform:translateY(0);pointer-events:auto;transition:max-height .38s ease,opacity .24s ease,transform .30s ease,visibility 0s linear 0s}}`;
  document.head.appendChild(menuStyle);
}

const footerMarkup = `<footer class="footer"><div class="container footer-grid"><img src="assets/logo-bruniano.svg" alt="Bruniano" class="footer-logo"><div><strong>BRUNIANO</strong><p>Fisioterapia & Riabilitazione</p></div><div class="footer-links"><a href="trattamenti.html">Trattamenti</a><a href="team.html">Team</a><a href="promozioni.html">Promozioni</a><a href="blog.html">Blog</a><a href="contatti.html">Contatti</a></div></div><div class="container footer-bottom"><span>© ${new Date().getFullYear()} Bruniano</span><span><a href="privacy.html">Privacy</a> · <a href="cookie.html">Cookie</a></span><span>Sito realizzato da <strong>Renderlab</strong></span><span><a href="admin/" class="operator-link">Operatori</a></span></div></footer>`;
const footerPlaceholder = document.getElementById("site-footer");
const legacyFooter = document.querySelector("footer.footer");
const footerHost = footerPlaceholder || legacyFooter;
if (footerHost) { if (footerHost.tagName === "FOOTER") footerHost.outerHTML = footerMarkup; else footerHost.innerHTML = footerMarkup; }
else { const host = document.createElement("div"); host.id = "site-footer"; host.innerHTML = footerMarkup; document.body.appendChild(host); }

function setupStudioGallery(){
  if(!document.body.classList.contains('studio-page')) return;
  const grid=document.querySelector('.studio-grid'); const hero=document.querySelector('.studio-hero-media img'); if(!grid) return;
  fetch('/api/gallery?admin=0',{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject(new Error('gallery'))).then(data=>{
    const items=(data.items||[]).filter(x=>x.media_url).slice(0,12); if(!items.length) return;
    const images=items.filter(x=>String(x.media_type).startsWith('image'));
    if(hero&&images[0]){hero.src=images[0].media_url;hero.alt=images[0].alt_text||images[0].title||'Ambiente Bruniano';}
    grid.innerHTML=items.slice(0,4).map((m,i)=>{const media=String(m.media_type).startsWith('video')?`<video src="${m.media_url}" autoplay muted loop playsinline preload="metadata" aria-label="${m.alt_text||m.title||'Video Bruniano'}"></video>`:`<img src="${m.media_url}" alt="${m.alt_text||m.title||'Ambiente Bruniano'}" loading="lazy">`;const classes=i===0?'studio-tile large':i===3?'studio-tile wide':'studio-tile';return `<div class="${classes}">${media}<div class="tile-copy"><small>${String(m.title||'BRUNIANO').toUpperCase()}</small><strong>${m.alt_text||'Scopri gli ambienti del Centro Medico Specialistico Bruniano.'}</strong></div></div>`;}).join('');
    grid.querySelectorAll('img,video').forEach(el=>{el.style.width='100%';el.style.height='100%';el.style.objectFit='cover';el.style.display='block';});
  }).catch(()=>{});
}
setupStudioGallery();

function promoActive(p){const now=Date.now();return (!p.starts_at||new Date(p.starts_at).getTime()<=now)&&(!p.ends_at||new Date(p.ends_at).getTime()>=now)}
function promoText(p){return p.subtitle||p.description||''}
function promoWa(p){return encodeURIComponent(p.whatsapp_message||`Buongiorno, vorrei ricevere informazioni sulla promozione "${p.title}" presso Bruniano.`)}
function setupHomePromotions(){
 if(!document.body.classList.contains('home-impact'))return;
 const ribbon=document.querySelector('.offer-ribbon'),band=document.querySelector('.promo-home');
 if(!ribbon&&!band)return;
 fetch('/api/promotions',{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject()).then(data=>{
  const items=(data.items||[]).filter(p=>p.is_published!==false&&promoActive(p));
  const top=items.filter(p=>p.show_home_top).sort((a,b)=>(a.home_top_order||0)-(b.home_top_order||0))[0];
  const center=items.filter(p=>p.show_home_center).sort((a,b)=>(a.home_center_order||0)-(b.home_center_order||0))[0];
  const apply=(el,p,type)=>{if(!el||!p)return;if(type==='top'){const strong=el.querySelector('.offer-ribbon-inner strong'),small=el.querySelector('.offer-ribbon-inner small'),link=el.querySelector('.offer-link');if(strong)strong.textContent=p.title;if(small)small.textContent=promoText(p);if(link){link.href=p.id?`promozioni.html#promo-${p.id}`:'promozioni.html';link.textContent=`${p.cta_label||'Scopri l’offerta'} →`}}else{const h=el.querySelector('h2'),desc=el.querySelector('p'),link=el.querySelector('a.button');if(h)h.innerHTML=`${p.title.replace(/\n/g,'<br>')}${p.subtitle?`<br><em>${p.subtitle}</em>`:''}`;if(desc)desc.textContent=p.description||p.subtitle||'';if(link){link.href=p.id?`promozioni.html#promo-${p.id}`:'promozioni.html';link.textContent=p.cta_label||'Scopri l’offerta'}}};
  if(top)apply(ribbon,top,'top');else if(ribbon)ribbon.style.display='none';
  if(center)apply(band,center,'center');else if(band)band.style.display='none';
 }).catch(()=>{});
}
setupHomePromotions();

function setupPublicPromotions(){
 if(!document.body.classList.contains('promos-page'))return;
 const featured=document.querySelector('.featured-promo'),grid=document.querySelector('.promo-system .promo-grid');
 fetch('/api/promotions',{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject()).then(data=>{
  const items=(data.items||[]).filter(p=>p.is_published!==false&&promoActive(p));
  const pageItems=items.filter(p=>p.page_published);
  if(featured){if(!pageItems.length){featured.style.display='none'}else{featured.innerHTML=pageItems.map((p,i)=>`<div class="container" id="promo-${p.id}"><div class="featured-card"><div class="featured-media">${p.image_url?`<img src="${p.image_url}" alt="${p.title}" loading="lazy">`:''}<span class="featured-badge">${i===0?'PROMOZIONE IN EVIDENZA':'PROMOZIONE'}</span></div><div class="featured-copy"><p class="eyebrow">OFFERTA BRUNIANO</p><h2>${p.title}${p.subtitle?`<br><em>${p.subtitle}</em>`:''}</h2><p>${p.description||''}</p><div class="promo-actions"><a class="button button-light" href="https://wa.me/393343755885?text=${promoWa(p)}">${p.cta_label||'Chiedi informazioni'} ↗</a><a class="button button-large" href="contatti.html">Contatti</a></div>${p.ends_at?`<p class="small-note">Offerta valida fino al ${new Date(p.ends_at).toLocaleDateString('it-IT')}.</p>`:''}</div></div></div>`).join('')}}
  }
  if(grid){const cards=pageItems.map((p,i)=>`<article class="promo-card"><div class="promo-card-media">${p.image_url?`<img src="${p.image_url}" alt="${p.title}" loading="lazy">`:''}</div><div class="promo-card-body"><p class="eyebrow">${String(i+1).padStart(2,'0')} · PROMOZIONE</p><h3>${p.title}${p.subtitle?` · ${p.subtitle}`:''}</h3><p>${p.description||''}</p><a class="text-link" href="#promo-${p.id}">Scopri <span>→</span></a></div></article>`);if(cards.length)grid.innerHTML=cards.join('')}
 }).catch(()=>{});
}
setupPublicPromotions();

const seoLoader=document.createElement('script');seoLoader.src='seo.js';document.head.appendChild(seoLoader);