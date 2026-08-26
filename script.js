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

const menuToggle = document.querySelector(".menu-toggle");
const mobileNav = document.querySelector(".mobile-nav");
if (menuToggle && mobileNav) {
  menuToggle.addEventListener("click", () => {
    const open = mobileNav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(open));
  });
  mobileNav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
    mobileNav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  }));
}

function setupHomeVideos() {
  const home = document.querySelector(".tech-showcase");
  if (!home) return;
  const videos = [
    {selector:".machine-card:nth-child(1) .machine-visual",label:"VIDEO BRUNIANO",src:"https://res.cloudinary.com/pomzhih4/video/upload/q_auto,c_limit,w_1280/v1787742244/Tecar.mp4",poster:"https://res.cloudinary.com/pomzhih4/video/upload/so_0/q_auto:good,c_limit,w_1280/v1787742244/Tecar.jpg",alt:"Video reale del trattamento Tecar Bruniano"},
    {selector:".machine-card:nth-child(2) .machine-visual",label:"VIDEO BRUNIANO",src:"https://res.cloudinary.com/pomzhih4/video/upload/q_auto,c_limit,w_1280/v1787742255/Laser.mp4",poster:"https://res.cloudinary.com/pomzhih4/video/upload/so_0/q_auto:good,c_limit,w_1280/v1787742255/Laser.jpg",alt:"Video reale del trattamento Laser Bruniano"},
    {selector:".machine-card:nth-child(3) .machine-visual",label:"VIDEO DI RIFERIMENTO",src:"https://res.cloudinary.com/pomzhih4/video/upload/q_auto,c_limit,w_1280/v1787742226/WhatsApp_Video_2026-08-17_at_11.50.58.mp4",poster:"https://res.cloudinary.com/pomzhih4/video/upload/so_0/q_auto:good,c_limit,w_1280/v1787742226/WhatsApp_Video_2026-08-17_at_11.50.58.jpg",alt:"Video provvisorio di riferimento per Onde d'urto"}
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

  // Il Laser Ixyon usa il video reale già presente su Cloudinary, non un'immagine dimostrativa.
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

  // Elimina dal front-end ogni testo redazionale/interno e sostituiscilo con copy rivolto al paziente.
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
