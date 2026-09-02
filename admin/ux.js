(() => {
  const $ = id => document.getElementById(id);

  async function loadCloudinary(){
    if(window.BrunianoCloudinary) return;
    await new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      s.src='cloudinary-upload.js';
      s.onload=resolve;
      s.onerror=reject;
      document.head.appendChild(s);
    });
  }

  async function uploadBlogCover(){
    const status=$('blog-cover-status');
    if(!status)return;
    try{
      await loadCloudinary();
      status.textContent='Apertura caricamento…';
      await window.BrunianoCloudinary.uploadImage(info=>{
        if($('blog-cover'))$('blog-cover').value=info.secure_url||info.url||'';
        status.textContent='Copertina caricata su Cloudinary';
      });
    }catch(e){
      status.textContent=e?.message||'Impossibile caricare la copertina';
    }
  }

  function updateHeader(panel){
    const titles={
      dashboard:['Dashboard','Panoramica'],
      team:['Team','Professionisti'],
      gallery:['Studio','Foto e video'],
      promos:['Promozioni','Offerte'],
      blog:['Blog','Articoli e SEO'],
      reviews:['Recensioni','Google Reviews'],
      users:['Utenti','Accessi al gestionale']
    };
    const value=titles[panel]||titles.dashboard;
    if($('breadcrumb'))$('breadcrumb').textContent=value[0];
    if($('page-title'))$('page-title').textContent=value[1];
  }

  function setupNavigation(){
    document.querySelectorAll('.dash-card[data-panel]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const panel=btn.dataset.panel;
        updateHeader(panel);
        document.getElementById('sidebar')?.classList.remove('open');
        $('mobile-menu')?.setAttribute('aria-expanded','false');
      });
    });

    document.querySelectorAll('[data-view-link]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const panel=btn.dataset.viewLink;
        const target=document.querySelector(`.dash-card[data-panel="${panel}"]`);
        if(target){target.click();return;}
      });
    });

    const menu=$('mobile-menu');
    menu?.addEventListener('click',()=>{
      const sidebar=$('sidebar');
      if(!sidebar)return;
      const open=!sidebar.classList.contains('open');
      sidebar.classList.toggle('open',open);
      menu.setAttribute('aria-expanded',String(open));
    });
  }

  $('blog-cover-upload')?.addEventListener('click',uploadBlogCover);
  setupNavigation();
  updateHeader('dashboard');
})();