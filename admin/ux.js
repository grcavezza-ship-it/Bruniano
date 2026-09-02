(() => {
  const $ = (id) => document.getElementById(id);
  const esc = (v) => String(v ?? '').replace(/[&<>\"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[s]));
  const style = document.createElement('style');
  style.textContent = `
    .admin-logo{display:flex;align-items:center;gap:11px;text-decoration:none;color:#0b1729}.admin-logo img{width:42px;height:42px;display:block}.admin-logo strong{font-size:25px;line-height:1;font-weight:800;letter-spacing:-.06em}.admin-logo small{display:block;margin-top:5px;font-size:8px;line-height:1.1;letter-spacing:.12em;font-weight:800;color:#6e7b8f}.admin-context{margin-left:24px;padding-left:24px;border-left:1px solid #e5eaf2}.admin-context strong{display:block;font-size:12px}.admin-context span{display:block;color:#7b8798;font-size:10px;margin-top:3px}.admin-brand{display:flex;align-items:center}.admin-header-actions{display:flex;align-items:center;gap:18px}.admin-header-actions a{color:#155cff;font-weight:800;text-decoration:none;font-size:13px}.admin-live{display:flex;align-items:center;gap:7px;font-size:11px;font-weight:800;color:#43546b}.admin-live i{width:8px;height:8px;border-radius:50%;background:#28b76b}.admin-logout{border:1px solid #dce4ee;background:#fff;color:#526177;border-radius:10px;padding:8px 11px;font:800 12px Manrope;cursor:pointer}.admin-logout:hover{background:#f5f8fc;color:#155cff}.gallery-toolbar{display:flex;align-items:center;justify-content:space-between;gap:15px;margin:14px 0 18px}.gallery-toolbar label{font-size:12px;font-weight:800;color:#526177}.gallery-toolbar select{margin-left:8px;border:1px solid #dce4ee;border-radius:10px;padding:9px 12px;background:#fff}.media-admin-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.media-admin-card{border:1px solid #e2e8f0;border-radius:18px;overflow:hidden;background:#fff}.media-admin-thumb{height:190px;background:#edf3fa;position:relative;overflow:hidden}.media-admin-thumb img,.media-admin-thumb video{width:100%;height:100%;object-fit:cover;display:block}.media-admin-body{padding:15px}.media-admin-body strong{display:block;font-size:14px}.media-admin-body small{display:block;color:#7c889a;margin-top:4px;line-height:1.5}.media-admin-actions{display:flex;gap:7px;margin-top:12px}.media-admin-actions .mini{flex:1}.media-status{position:absolute;top:10px;left:10px;padding:6px 9px;border-radius:999px;background:rgba(8,24,55,.82);color:#fff;font-size:9px;font-weight:900;letter-spacing:.12em}.media-preview-empty{display:grid;place-items:center;height:100%;color:#8693a5;font-size:12px;font-weight:700}.coming-soon-card{display:flex;gap:18px;align-items:flex-start;padding:24px;border:1px solid #e2e8f0;border-radius:20px;background:#f8fbff}.coming-soon-icon{width:44px;height:44px;border-radius:14px;display:grid;place-items:center;background:#eaf1ff;color:#155cff;font-weight:900;font-size:22px}.coming-soon-card strong{display:block}.coming-soon-card p{margin:7px 0 0;color:#69778a;line-height:1.65;font-size:13px}.form-section-head{display:flex;align-items:end;justify-content:space-between;gap:12px;margin-bottom:17px}.form-section-head strong{font-size:18px}.form-section-head span{font-size:11px;color:#8290a4}.form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}.media-input-row{display:flex;gap:9px;align-items:center}.media-input-row input{flex:1}.media-input-row button{white-space:nowrap}.cv-modal{position:fixed;inset:0;display:none;align-items:center;justify-content:center;padding:25px;background:rgba(6,18,40,.55);backdrop-filter:blur(5px);z-index:30}.cv-modal.open{display:flex}.cv-modal-card{width:min(760px,100%);max-height:min(820px,90vh);overflow:auto;background:#fff;border-radius:24px;padding:28px;box-shadow:0 30px 100px rgba(3,19,52,.25)}.cv-modal-card h2{margin:0 0 6px;font-size:32px;letter-spacing:-.04em}.cv-subtitle{margin:0 0 24px;color:#6c7a8f}.cv-modal-card .eyebrow{margin:0 0 10px;color:#155cff;font-size:10px;font-weight:900;letter-spacing:.15em}.cv-close{float:right;border:0;background:#f0f3f8;border-radius:9px;padding:6px 9px;cursor:pointer}
    @media(max-width:850px){.admin-context{display:none}.media-admin-grid{grid-template-columns:1fr 1fr}.admin-header-actions a{display:none}}
    @media(max-width:600px){.media-admin-grid{grid-template-columns:1fr}.admin-logo strong{font-size:22px}.admin-logo img{width:38px;height:38px}.gallery-toolbar{align-items:flex-start;flex-direction:column}.form-row{grid-template-columns:1fr}.admin-header{height:auto;min-height:70px;padding:12px 16px}.admin-logout{font-size:11px;padding:7px 9px}}
  `;
  document.head.appendChild(style);

  const actions = document.querySelector('.admin-header-actions');
  if (actions && !document.getElementById('ux-admin-logout')) {
    const btn = document.createElement('button');
    btn.id = 'ux-admin-logout';
    btn.className = 'admin-logout';
    btn.type = 'button';
    btn.textContent = 'Esci';
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.textContent = 'Uscita…';
      try {
        await fetch('../api/auth?action=logout', { method: 'POST', credentials: 'same-origin', headers: {'content-type':'application/json'} });
      } finally {
        sessionStorage.removeItem('brunianoAdminDemo');
        window.location.replace('login.html');
      }
    });
    actions.appendChild(btn);
  }

  async function loadCloudinary(){
    if(window.BrunianoCloudinary) return;
    await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='../admin/cloudinary-upload.js';s.onload=resolve;s.onerror=reject;document.head.appendChild(s);});
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
    }catch(e){status.textContent=e?.message||'Impossibile caricare la copertina';}
  }
  $('blog-cover-upload')?.addEventListener('click',uploadBlogCover);
})();