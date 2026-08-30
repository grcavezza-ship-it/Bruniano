const responsiveLink = document.createElement("link");
responsiveLink.rel = "stylesheet";
responsiveLink.href = "responsive-site.css?v=1";
document.head.appendChild(responsiveLink);

const WHATSAPP_NUMBER = "393343755885";
const WHATSAPP_MESSAGE = "Buongiorno, vorrei ricevere informazioni e prenotare un appuntamento presso Bruniano.";

function whatsappUrl(message = WHATSAPP_MESSAGE) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

document.querySelectorAll("[data-whatsapp]").forEach((link) => {
  link.href = whatsappUrl();
  link.target = "_blank";
  link.rel = "noopener noreferrer";
});

function setupBrandLockup() {
  const style = document.createElement("style");
  style.textContent = `
    .brand{display:flex;align-items:center;flex:0 0 auto;text-decoration:none}
    .brand-lockup{display:flex;align-items:center;gap:12px;min-height:54px}
    .brand-symbol{width:48px;height:48px;display:block;flex:0 0 48px}
    .brand-name{font-family:Manrope,system-ui,sans-serif;font-size:35px;line-height:1;font-weight:800;letter-spacing:-.065em;color:#111a2c}
    .brand-divider{width:1px;height:38px;background:#d8dde6;margin:0 10px 0 6px}
    .brand-tagline{font-family:Manrope,system-ui,sans-serif;font-size:12px;line-height:1.12;font-weight:800;letter-spacing:.10em;color:#687385;white-space:nowrap}
    .brand-tagline br{display:block}
    .brand::after{content:none!important}
    @media(max-width:900px){.brand-lockup{gap:10px;min-height:52px}.brand-symbol{width:46px;height:46px;flex-basis:46px}.brand-name{font-size:30px}.brand-divider{height:34px;margin:0 8px 0 3px}.brand-tagline{font-size:10px;letter-spacing:.085em}}
    @media(max-width:600px){.brand-lockup{gap:9px}.brand-symbol{width:42px;height:42px;flex-basis:42px}.brand-name{font-size:27px}.brand-divider{height:31px;margin:0 6px 0 1px}.brand-tagline{font-size:9px;letter-spacing:.075em}.nav-wrap{gap:12px}}
  `;
  document.head.appendChild(style);
  document.querySelectorAll(".brand").forEach((brand) => {
    brand.innerHTML = `<span class="brand-lockup"><img src="assets/logo-symbol.svg" alt="" class="brand-symbol"><span class="brand-name">bruniano</span><span class="brand-divider" aria-hidden="true"></span><span class="brand-tagline">CENTRO MEDICO<br>SPECIALISTICO</span></span>`;
  });
}
setupBrandLockup();

function setupHomeVideos() {
  const home = document.querySelector(".tech-showcase");
  if (!home) return;
  const videos = [
    {selector:".machine-card:nth-child(1) .machine-visual",label:"VIDEO BRUNIANO",src:"https://res.cloudinary.com/pomzhih4/video/upload/q_auto,c_limit,w_1280/v1787742244/Tecar.mp4",poster:"https://res.cloudinary.com/pomzhih4/video/upload/so_0/q_auto:good,c_limit,w_1280/v1787742244/Tecar.jpg",alt:"Video reale del trattamento Tecar Bruniano"},
    {selector:".machine-card:nth-child(2) .machine-visual",label:"VIDEO BRUNIANO",src:"https://res.cloudinary.com/pomzhih4/video/upload/q_auto,c_limit,w_1280/v1787742255/Laser.mp4",poster:"https://res.cloudinary.com/pomzhih4/video/upload/so_0/q_auto:good,c_limit,w_1280/v1787742255/Laser.jpg",alt:"Video reale del trattamento Laser Bruniano"},
    {selector:".machine-card:nth-child(3) .machine-visual",label:"VIDEO DI RIFERIMENTO",src:"https://res.cloudinary.com/pomzhih4/video/upload/q_auto,c_limit,w_1280/v1787742226/WhatsApp_Video_2026-08-17_at_11.50.58.mp4",poster:"https://res.cloudinary.com/pomzhih4/video/upload/so_0/q_auto,c_limit,w_1280/v1787742226/WhatsApp_Video_2026-08-17_at_11.50.58.jpg",alt:"Video provvisorio di riferimento per Onde d'urto"}
  ];
  videos.forEach(({selector,label,src,poster,alt})=>{
    const box=document.querySelector(selector); if(!box)return;
    box.querySelectorAll(".machine-badge,.image-credit-note,.visual-play").forEach(n=>n.remove());
    box.style.backgroundImage="none"; box.style.position="relative"; box.style.overflow="hidden";
    const video=document.createElement("video"); video.src=src; video.poster=poster; video.autoplay=true; video.muted=true; video.loop=true; video.playsInline=true; video.preload="metadata"; video.setAttribute("aria-label",alt); video.style.cssText="width:100%;height:100%;min-height:270px;object-fit:cover;display:block"; box.appendChild(video);
    const badge=document.createElement("span"); badge.className="machine-badge"; badge.textContent=label; box.appendChild(badge);
  });
  const demoFrame=document.querySelector(".video-frame");
  if(demoFrame){
    const iframe=demoFrame.querySelector("iframe"),label=demoFrame.querySelector(".demo-video-label");
    if(iframe){const video=document.createElement("video");video.src=videos[0].src;video.poster=videos[0].poster;video.autoplay=true;video.muted=true;video.loop=true;video.playsInline=true;video.preload="metadata";video.controls=true;video.style.cssText="width:100%;height:100%;object-fit:cover";iframe.replaceWith(video)}
    if(label)label.textContent="VIDEO REALE — TECAR";
  }
}
setupHomeVideos();

const curriculumData = {
  "cv-01": {name:"Nome Cognome", role:"Fisioterapista · Specializzazione", sections:[{title:"Profilo",text:"Breve presentazione professionale da compilare dal pannello admin."},{title:"Formazione",text:"Titoli di studio, corsi e formazione specialistica."},{title:"Esperienza",text:"Esperienze professionali e principali aree di competenza."}]},
  "cv-02": {name:"Nome Cognome", role:"Fisioterapista · Specializzazione", sections:[{title:"Profilo",text:"Breve presentazione professionale da compilare dal pannello admin."},{title:"Formazione",text:"Titoli di studio, corsi e formazione specialistica."},{title:"Esperienza",text:"Esperienze professionali e principali aree di competenza."}]},
  "cv-03": {name:"Nome Cognome", role:"Professionista · Specializzazione", sections:[{title:"Profilo",text:"Breve presentazione professionale da compilare dal pannello admin."},{title:"Formazione",text:"Titoli di studio, corsi e formazione specialistica."},{title:"Esperienza",text:"Esperienze professionali e principali aree di competenza."}]}
};

function setupCurriculumModal(){
  const modal=document.getElementById("curriculum-modal"); if(!modal)return;
  const title=document.getElementById("curriculum-title"),content=document.getElementById("curriculum-content");
  const close=()=>{modal.classList.remove("open");modal.setAttribute("aria-hidden","true");document.body.style.overflow=""};
  document.querySelectorAll(".curriculum-open").forEach(btn=>btn.addEventListener("click",()=>{
    const data=curriculumData[btn.dataset.curriculum]; if(!data)return;
    title.textContent=data.name;
    content.innerHTML=`<p class="team-role">${data.role}</p>${data.sections.map(s=>`<div class="cv-section"><h3>${s.title}</h3><p>${s.text}</p></div>`).join("")}`;
    modal.classList.add("open");modal.setAttribute("aria-hidden","false");document.body.style.overflow="hidden";
  }));
  modal.querySelectorAll("[data-curriculum-close]").forEach(el=>el.addEventListener("click",close));
  document.addEventListener("keydown",e=>{if(e.key==="Escape")close()});
}
setupCurriculumModal();

function setupFinishedTreatmentsPage(){
  if(!document.body.classList.contains('treatments-page')) return;

  const laserMedia=document.querySelector('#laser .technology-media');
  if(laserMedia){
    const old=laserMedia.querySelector('img');
    if(old) old.remove();
    const badge=laserMedia.querySelector('.media-badge');
    if(badge) badge.textContent='VIDEO REALE BRUNIANO';
    if(!laserMedia.querySelector('video')){
      const video=document.createElement('video');
      video.autoplay=true; video.muted=true; video.loop=true; video.playsInline=true; video.preload='metadata';
      video.poster='https://res.cloudinary.com/pomzhih4/video/upload/so_0/q_auto:good,c_limit,w_1280/v1787742255/Laser.jpg';
      video.src='https://res.cloudinary.com/pomzhih4/video/upload/q_auto,c_limit,w_1280/v1787742255/Laser.mp4';
      video.setAttribute('aria-label','Video reale del trattamento Laser Ixyon Bruniano');
      video.style.cssText='width:100%;height:100%;min-height:430px;object-fit:cover;display:block';
      laserMedia.appendChild(video);
    }
  }

  const replacements=[
    ['La brochure Bruniano affianca alle tecnologie una proposta più ampia di terapia manuale, riabilitazione, postura e movimento. La pagina li raccoglie in percorsi leggibili e facilmente consultabili.','Accanto alle tecnologie, Bruniano propone terapia manuale, riabilitazione, postura e movimento per accompagnare la persona in ogni fase del recupero.'],
    ['IMMAGINE DIMOSTRATIVA','TECNOLOGIA BRUNIANO'],
    ['VIDEO DI RIFERIMENTO','VIDEO DI TRATTAMENTO'],
    ['La brochure','Bruniano']
  ];

  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  const nodes=[]; let node;
  while(node=walker.nextNode()) nodes.push(node);
  nodes.forEach(textNode=>{
    let value=textNode.nodeValue;
    replacements.forEach(([from,to])=>{ if(value.includes(from)) value=value.split(from).join(to); });
    textNode.nodeValue=value;
  });

  const shockBadge=document.querySelector('#onde .media-badge');
  if(shockBadge) shockBadge.textContent='VIDEO DI TRATTAMENTO';
}
setupFinishedTreatmentsPage();

const year=document.getElementById("year"); if(year)year.textContent=new Date().getFullYear();

/* HOME CANONICAL FOOTER FIX */
(function(){
  const footer = document.querySelector('footer.footer');
  if (!footer) return;
  footer.outerHTML = `<div id="site-footer"></div>`;
  const host = document.getElementById('site-footer');
  if (host) host.innerHTML = `<footer class="footer"><div class="container footer-grid"><img src="assets/logo-bruniano.svg" alt="Bruniano" class="footer-logo"><div><strong>BRUNIANO</strong><p>Fisioterapia &amp; Riabilitazione</p></div><div class="footer-links"><a href="trattamenti.html">Trattamenti</a><a href="team.html">Team</a><a href="promozioni.html">Promozioni</a><a href="blog.html">Blog</a><a href="contatti.html">Contatti</a></div></div><div class="container footer-bottom"><span>© ${new Date().getFullYear()} Bruniano</span><span><a href="privacy.html">Privacy</a> · <a href="cookie.html">Cookie</a></span><span>Sito realizzato da <strong>Renderlab</strong></span><span><a href="admin/" class="operator-link">Operatori</a></span></div></footer>`;
})();

/* SMART SITE HEADER */
(function(){
  const initHeader=(header)=>{
    if(!header || header.dataset.smartHeaderReady==='1') return;
    header.dataset.smartHeaderReady='1';

    let lastScrollY=window.scrollY || document.scrollingElement?.scrollTop || 0;
    let ticking=false;
    let touchStartY=null;
    let hidden=false;
    let menuOpen=false;

    const isMobile=()=> (window.innerWidth || document.documentElement.clientWidth) <= 950;
    const getScrollY=()=>window.scrollY || document.scrollingElement?.scrollTop || document.documentElement.scrollTop || document.body.scrollTop || 0;

    const setHeaderVisible=(visible)=>{
      if(menuOpen && !visible) return;
      hidden=!visible;
      header.classList.toggle('is-scroll-hidden',hidden);
      if(isMobile()){
        header.style.setProperty('transform','none');
        header.style.setProperty('top',visible?'0px','important');
        header.style.setProperty('opacity',visible?'1':'0','important');
        header.style.setProperty('pointer-events',visible?'auto':'none','important');
      }else{
        header.style.removeProperty('top');
        header.style.removeProperty('transform');
        header.style.removeProperty('opacity');
        header.style.removeProperty('pointer-events');
      }
    };

    const evaluateScroll=()=>{
      const currentY=getScrollY();
      if(currentY<=32){
        setHeaderVisible(true);
      }else if(currentY < lastScrollY - 0.5){
        setHeaderVisible(true);
      }else if(currentY > lastScrollY + 1.5){
        setHeaderVisible(false);
      }
      lastScrollY=currentY;
      ticking=false;
    };

    const onScroll=()=>{
      if(!ticking){
        ticking=true;
        window.requestAnimationFrame(evaluateScroll);
      }
    };

    window.addEventListener('scroll',onScroll,{passive:true});

    const handleTouchStart=(event)=>{
      if(!isMobile()) return;
      touchStartY=event.touches?.[0]?.clientY ?? null;
      if(menuOpen) setHeaderVisible(true);
    };

    const handleTouchMove=(event)=>{
      if(!isMobile() || touchStartY===null) return;
      const currentY=event.touches?.[0]?.clientY;
      if(typeof currentY!=='number') return;
      const delta=currentY-touchStartY;
      if(Math.abs(delta)<3) return;
      if(delta>0) setHeaderVisible(true);
      else setHeaderVisible(false);
      touchStartY=currentY;
    };

    const checkMomentum=()=>{
      const before=getScrollY();
      window.setTimeout(()=>{
        const after=getScrollY();
        if(after < before - 0.5) setHeaderVisible(true);
        else if(after > before + 0.5) setHeaderVisible(false);
        lastScrollY=after;
      },120);
    };

    const handleTouchEnd=()=>{
      if(!isMobile()) return;
      touchStartY=null;
      checkMomentum();
    };

    window.addEventListener('touchstart',handleTouchStart,{passive:true});
    window.addEventListener('touchmove',handleTouchMove,{passive:true});
    window.addEventListener('touchend',handleTouchEnd,{passive:true});
    window.addEventListener('touchcancel',handleTouchEnd,{passive:true});

    window.addEventListener('resize',()=>{
      if(!isMobile()){
        menuOpen=false;
        const nav=header.querySelector('.mobile-nav');
        if(nav) nav.classList.remove('open');
        const toggle=header.querySelector('.menu-toggle');
        if(toggle){
          toggle.setAttribute('aria-expanded','false');
          toggle.setAttribute('aria-label','Apri menu');
        }
      }
      setHeaderVisible(true);
      lastScrollY=getScrollY();
      touchStartY=null;
    },{passive:true});

    const toggle=header.querySelector('.menu-toggle');
    const nav=header.querySelector('.mobile-nav');
    if(toggle && nav){
      const syncMenu=(open)=>{
        menuOpen=open;
        nav.classList.toggle('open',open);
        toggle.setAttribute('aria-expanded',String(open));
        toggle.setAttribute('aria-label',open?'Chiudi menu':'Apri menu');
        header.classList.toggle('is-menu-open',open);
        setHeaderVisible(true);
      };
      toggle.addEventListener('click',()=>syncMenu(!nav.classList.contains('open')));
      nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>syncMenu(false)));
    }

    document.addEventListener('keydown',(event)=>{
      if(event.key!=='Escape') return;
      const currentNav=header.querySelector('.mobile-nav');
      const currentToggle=header.querySelector('.menu-toggle');
      if(currentNav && currentNav.classList.contains('open')){
        currentNav.classList.remove('open');
        menuOpen=false;
        header.classList.remove('is-menu-open');
        if(currentToggle){
          currentToggle.setAttribute('aria-expanded','false');
          currentToggle.setAttribute('aria-label','Apri menu');
        }
        setHeaderVisible(true);
      }
    });

    setHeaderVisible(true);
  };

  const scan=()=>document.querySelectorAll('.site-header').forEach(initHeader);
  scan();
  const observer=new MutationObserver(scan);
  observer.observe(document.documentElement,{childList:true,subtree:true});
})();