(async function(){
  document.documentElement.style.visibility='hidden';
  try {
    const session=await fetch('/api/auth',{credentials:'same-origin',cache:'no-store'});
    if(!session.ok) throw new Error('unauthorized');
    const auth=await session.json();
    if(auth.must_change_password){window.location.replace('login.html?change=1');return;}
    const fullName=[auth.first_name,auth.last_name].filter(Boolean).join(' ').trim() || (auth.username==='admin'?'Amministratore':auth.username||'Operatore');
    if(document.getElementById('user-name'))document.getElementById('user-name').textContent=fullName;
    if(document.getElementById('dashboard-user-name'))document.getElementById('dashboard-user-name').textContent=fullName;
    if(document.getElementById('user-role'))document.getElementById('user-role').textContent=auth.username==='admin'?'Accesso completo':'Operatore';
    if(document.getElementById('user-avatar'))document.getElementById('user-avatar').textContent=fullName.charAt(0).toUpperCase();
    document.documentElement.style.visibility='visible';
  } catch {
    window.location.replace('login.html');
    return;
  }

  const state={blog:[],gallery:[]};
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>\"]/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[s]));

  async function logout(){
    try{await fetch('/api/auth',{method:'POST',headers:{'content-type':'application/json'},credentials:'same-origin',body:JSON.stringify({action:'logout'})});}
    finally{window.location.replace('login.html');}
  }
  function installLogout(){
    const host=document.querySelector('.admin-header-actions');
    if(!host||document.getElementById('admin-logout'))return;
    const b=document.createElement('button');b.id='admin-logout';b.type='button';b.textContent='Esci';b.className='mini';b.style.marginLeft='10px';b.addEventListener('click',logout);host.appendChild(b);
  }
  async function api(url,options={}){
    const r=await fetch(url,{credentials:'same-origin',headers:{'content-type':'application/json',...(options.headers||{})},...options});
    const d=await r.json().catch(()=>({}));
    if(r.status===401){window.location.replace('login.html');throw new Error('Sessione scaduta');}
    if(!r.ok)throw new Error(d.error||`HTTP ${r.status}`);return d;
  }
  function setStatus(message,error=false){const el=$('system-status');if(!el)return;el.textContent=message;el.classList.toggle('ok',!error)}
  function activatePanel(name){document.querySelectorAll('.dash-card').forEach(x=>x.classList.toggle('active',x.dataset.panel===name));document.querySelectorAll('.panel').forEach(x=>x.classList.toggle('active',x.id===`panel-${name}`))}
  document.querySelectorAll('.dash-card').forEach(btn=>btn.addEventListener('click',()=>activatePanel(btn.dataset.panel)));
  function setupChecks(){const apiBase='/api/health';fetch(apiBase,{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject()).then(()=>setStatus('Backend collegato')).catch(()=>setStatus('Backend non disponibile',true));if($('last-check'))$('last-check').textContent=new Date().toLocaleString('it-IT')}
  function renderBlog(){const list=$('blog-list');if(!list)return;list.innerHTML=state.blog.length?state.blog.map(p=>`<div class="managed-item"><div><strong>${esc(p.title)}</strong><small>${esc(p.category||'Senza categoria')} · ${p.is_published?'Pubblicato':'Bozza'}</small></div><div class="managed-actions"><button class="mini" data-edit-post="${p.id}">Modifica</button><button class="mini" data-delete-post="${p.id}">Elimina</button></div></div>`).join(''):'<div class="form-card note">Nessun articolo presente.</div>';if($('count-blog'))$('count-blog').textContent=state.blog.filter(p=>p.is_published).length}
  function resetPostForm(){if(!$('blog-form'))return;$('blog-form').reset();if($('blog-id'))$('blog-id').value='';if($('blog-content'))$('blog-content').innerHTML='';if($('blog-form-status'))$('blog-form-status').textContent=''}
  function fillPostForm(p){if(!$('blog-id'))return;$('blog-id').value=p.id;if($('blog-title'))$('blog-title').value=p.title||'';if($('blog-category'))$('blog-category').value=p.category||'';if($('blog-content'))$('blog-content').innerHTML=p.content||'';if($('blog-cover'))$('blog-cover').value=p.cover_image_url||'';if($('blog-meta'))$('blog-meta').value=p.meta_description||'';if($('blog-is-published'))$('blog-is-published').checked=Boolean(p.is_published);activatePanel('blog')}
  async function loadBlog(){try{const d=await api('/api/blog?admin=1');state.blog=d.items||[];renderBlog()}catch(e){renderBlog();setStatus('Blog non disponibile',true)}}
  async function savePost(e){e.preventDefault();const status=$('blog-form-status');if(!status)return;status.textContent='Salvataggio…';const payload={id:$('blog-id')?.value||undefined,title:$('blog-title')?.value||'',category:$('blog-category')?.value||'',content:$('blog-content')?.innerHTML.trim()||'',cover_image_url:$('blog-cover')?.value||'',meta_description:$('blog-meta')?.value||'',is_published:$('blog-is-published')?.checked||false};try{const saved=await api('/api/blog',{method:payload.id?'PUT':'POST',body:JSON.stringify(payload)});const i=state.blog.findIndex(x=>x.id===saved.id);if(i>=0)state.blog[i]=saved;else state.blog.unshift(saved);renderBlog();setStatus('Backend collegato')}catch(e){status.textContent=e.message;setStatus('Errore backend',true)}}
  async function deletePost(id){if(!confirm('Eliminare definitivamente questo articolo?'))return;try{await api('/api/blog',{method:'DELETE',body:JSON.stringify({id})});state.blog=state.blog.filter(x=>x.id!==id);renderBlog();resetPostForm()}catch(e){alert(e.message)}}
  $('new-post')?.addEventListener('click',()=>{resetPostForm();activatePanel('blog');$('blog-title')?.focus()});$('cancel-post')?.addEventListener('click',resetPostForm);$('blog-form')?.addEventListener('submit',savePost);$('blog-list')?.addEventListener('click',e=>{const edit=e.target.closest('[data-edit-post]'),del=e.target.closest('[data-delete-post]');if(edit){const p=state.blog.find(x=>x.id===edit.dataset.editPost);if(p)fillPostForm(p)}if(del)deletePost(del.dataset.deletePost)});
  function renderGallery(){const list=$('gallery-list');if(!list)return;const filter=$('gallery-filter')?.value||'all';let items=state.gallery;if(filter==='published')items=items.filter(x=>x.is_published);if(filter==='draft')items=items.filter(x=>!x.is_published);if($('count-gallery'))$('count-gallery').textContent=state.gallery.filter(x=>x.is_published).length;list.innerHTML=items.length?items.map(m=>{const video=String(m.media_type).startsWith('video');return `<article class="media-admin-card"><div class="media-preview">${video?`<video src="${esc(m.media_url)}" muted loop playsinline></video>`:`<img src="${esc(m.media_url)}" alt="${esc(m.alt_text||m.title||'Media Bruniano')}">`}</div><div class="media-admin-body"><strong>${esc(m.title||'Media Bruniano')}</strong><small>${video?'Video':'Foto'} · ${m.is_published?'Pubblicato':'Bozza'}</small><div class="media-admin-actions"><span class="media-status ${m.is_published?'':'draft'}">${m.is_published?'ONLINE':'BOZZA'}</span><button class="mini" data-gallery-toggle="${m.id}">${m.is_published?'Nascondi':'Pubblica'}</button><button class="mini" data-gallery-delete="${m.id}">Elimina</button></div></div></article>`}).join(''):'<div class="form-card note">Nessun media corrisponde al filtro.</div>'}
  async function loadGallery(){try{const d=await api('/api/gallery?admin=1');state.gallery=d.items||[];renderGallery();setStatus('Backend collegato')}catch(e){if($('gallery-list'))$('gallery-list').innerHTML='<div class="form-card note">Impossibile caricare la galleria.</div>';setStatus('Galleria non disponibile',true)}}
  async function toggleGallery(id){const item=state.gallery.find(x=>x.id===id);if(!item)return;try{const saved=await api('/api/gallery',{method:'PUT',body:JSON.stringify({...item,is_published:!item.is_published})});const i=state.gallery.findIndex(x=>x.id===id);state.gallery[i]=saved;renderGallery()}catch(e){alert(e.message)}}
  async function deleteGallery(id){if(!confirm('Eliminare questo media dal CMS?'))return;try{await api('/api/gallery',{method:'DELETE',body:JSON.stringify({id})});state.gallery=state.gallery.filter(x=>x.id!==id);renderGallery()}catch(e){alert(e.message)}}
  $('gallery-filter')?.addEventListener('change',renderGallery);$('gallery-list')?.addEventListener('click',e=>{const t=e.target.closest('[data-gallery-toggle]'),d=e.target.closest('[data-gallery-delete]');if(t)toggleGallery(t.dataset.galleryToggle);if(d)deleteGallery(d.dataset.galleryDelete)});
  async function uploadGallery(){try{if(!window.BrunianoCloudinary){await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='cloudinary-upload.js';s.onload=resolve;s.onerror=reject;document.head.appendChild(s)})}if($('gallery-status'))$('gallery-status').textContent='Apertura caricamento…';await window.BrunianoCloudinary.uploadMedia(async info=>{try{await api('/api/gallery',{method:'POST',body:JSON.stringify({title:info.original_filename||info.display_name||'Media Bruniano',media_type:info.resource_type||'image',media_url:info.secure_url||info.url,alt_text:info.original_filename||'Media Bruniano',is_published:false})});if($('gallery-status'))$('gallery-status').textContent='Media caricato e salvato come bozza';await loadGallery()}catch(e){if($('gallery-status'))$('gallery-status').textContent=e.message}})}catch(e){if($('gallery-status'))$('gallery-status').textContent=e.message}}
  $('add-gallery')?.addEventListener('click',uploadGallery);document.querySelector('.upload-drop')?.addEventListener('click',uploadGallery);document.querySelector('.upload-drop')?.addEventListener('dragover',e=>{e.preventDefault();e.currentTarget.classList.add('drag-active')});document.querySelector('.upload-drop')?.addEventListener('dragleave',e=>e.currentTarget.classList.remove('drag-active'));document.querySelector('.upload-drop')?.addEventListener('drop',e=>{e.preventDefault();e.currentTarget.classList.remove('drag-active');uploadGallery()});
  $('add-promo')?.addEventListener('click',()=>alert('La sezione Promozioni verrà collegata al CMS dedicato prima della consegna.'));
  if($('count-reviews'))$('count-reviews').textContent='—';
  installLogout();setupChecks();loadBlog();loadGallery();
})();
