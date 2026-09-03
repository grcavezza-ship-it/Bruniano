(() => {
  const $ = (id) => document.getElementById(id);
  if (!$('panel-gallery')) return;

  const state = { items: [], homeHero: '' };
  const SLOT_LABELS = ['01 · Accoglienza', '02 · Trattamento', '03 · Tecnologia', '04 · Persona'];

  const esc = (v) => String(v ?? '').replace(/[&<>\"]|'/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));

  async function api(url, options = {}) {
    const r = await fetch(url, { credentials: 'same-origin', headers: { 'content-type': 'application/json', ...(options.headers || {}) }, ...options });
    const d = await r.json().catch(() => ({}));
    if (r.status === 401) { location.replace('login.html'); throw new Error('Sessione scaduta'); }
    if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
    return d;
  }

  async function uploadFile(file) {
    if (!file) return null;
    if (!/^(image|video)\/(jpeg|png|webp|avif|mp4|quicktime)$/.test(file.type)) throw new Error('Formato non supportato.');
    if (file.size > 100 * 1024 * 1024) throw new Error('Il file supera il limite di 100 MB.');
    const body = new FormData();
    body.append('file', file);
    body.append('upload_preset', 'bruniano');
    body.append('folder', 'bruniano');
    const r = await fetch('https://api.cloudinary.com/v1_1/pomzhih4/auto/upload', { method: 'POST', body });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d.secure_url) throw new Error('Impossibile caricare il file.');
    return d;
  }

  function injectStyles() {
    if ($('studio-manager-style')) return;
    const style = document.createElement('style');
    style.id = 'studio-manager-style';
    style.textContent = `
      .studio-admin-home{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:16px;margin:0 0 18px}.studio-admin-card{background:#fff;border:1px solid #e2e8f0;border-radius:20px;box-shadow:0 12px 34px rgba(22,52,95,.035);overflow:hidden}.studio-admin-card-head{display:flex;justify-content:space-between;align-items:end;gap:15px;padding:19px 20px;border-bottom:1px solid #edf1f5}.studio-admin-card-head h2{margin:0;font-size:17px;letter-spacing:-.035em}.studio-admin-kicker{font-size:9px;font-weight:900;letter-spacing:.14em;color:#155cff;margin:0 0 6px}.studio-home-preview{display:grid;grid-template-columns:185px 1fr;min-height:150px}.studio-home-image{background:#eef2f7;min-height:150px;overflow:hidden}.studio-home-image img{width:100%;height:100%;object-fit:cover;display:block}.studio-home-empty{height:100%;display:grid;place-items:center;color:#8c98a8;font-size:11px;padding:20px;text-align:center}.studio-home-copy{padding:20px;display:flex;flex-direction:column;justify-content:center}.studio-home-copy strong{font-size:14px}.studio-home-copy p{font-size:11px;color:#718096;line-height:1.55;margin:6px 0 16px}.studio-home-actions{display:flex;gap:8px;flex-wrap:wrap}.studio-slot-board{padding:14px;display:grid;grid-template-columns:1.35fr .8fr .8fr;grid-template-rows:145px 145px;gap:10px}.studio-slot{border:1px dashed #aebdd0;border-radius:15px;background:#f8fbff;position:relative;overflow:hidden;min-width:0;transition:.16s}.studio-slot.large{grid-row:span 2}.studio-slot.wide{grid-column:2/4}.studio-slot.is-dragover{border-color:#155cff;background:#eef4ff;transform:scale(1.01)}.studio-slot.has-media{border-style:solid;background:#e8edf4}.studio-slot-label{position:absolute;left:10px;top:9px;z-index:3;padding:5px 7px;border-radius:999px;background:rgba(255,255,255,.92);color:#344054;font-size:9px;font-weight:900}.studio-slot img,.studio-slot video{width:100%;height:100%;display:block;object-fit:cover}.studio-slot-overlay{position:absolute;inset:auto 0 0;padding:28px 10px 9px;background:linear-gradient(transparent,rgba(5,19,45,.76));z-index:2;color:#fff}.studio-slot-overlay strong{display:block;font-size:10px}.studio-slot-overlay small{display:block;font-size:8px;opacity:.8;margin-top:3px}.studio-slot-empty{position:absolute;inset:0;display:grid;place-items:center;text-align:center;padding:26px;color:#8490a1;font-size:10px;line-height:1.45}.studio-slot-actions{position:absolute;right:8px;top:8px;z-index:4;display:flex;gap:5px}.studio-slot-actions button{border:1px solid rgba(255,255,255,.75);background:rgba(255,255,255,.94);color:#344054;border-radius:8px;padding:5px 7px;font-size:9px;font-weight:800;cursor:pointer}.studio-slot-actions button:hover{background:#fff;color:#155cff}.studio-media-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 12px}.studio-media-head p{margin:0;color:#718096;font-size:11px}.studio-media-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.studio-media-card{border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;background:#fff;cursor:grab}.studio-media-card:active{cursor:grabbing}.studio-media-preview{height:145px;background:#eef2f7;position:relative}.studio-media-preview img,.studio-media-preview video{width:100%;height:100%;object-fit:cover;display:block}.studio-media-card.dragging{opacity:.5}.studio-media-slot{position:absolute;left:8px;bottom:8px;background:rgba(255,255,255,.94);border-radius:999px;padding:5px 7px;font-size:8px;font-weight:900;color:#344054}.studio-media-body{padding:10px}.studio-media-body strong{display:block;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.studio-media-body small{display:block;font-size:9px;color:#7d899a;margin-top:3px}.studio-media-actions{display:flex;gap:6px;margin-top:9px;flex-wrap:wrap}.studio-media-actions .mini{font-size:9px;padding:6px 8px}.studio-upload-zone{margin:0 0 16px;padding:24px;border:1px dashed #aebdd0;border-radius:18px;background:#f8fbff;text-align:center;color:#657083;font-size:11px;cursor:pointer}.studio-upload-zone strong{display:block;font-size:14px;color:#26384f;margin-bottom:5px}.studio-upload-zone.is-dragover{border-color:#155cff;background:#eef4ff}
      @media(max-width:1000px){.studio-admin-home{grid-template-columns:1fr}.studio-slot-board{grid-template-columns:1fr 1fr;grid-template-rows:170px 170px}.studio-slot.large{grid-row:auto}.studio-slot.wide{grid-column:1/3}.studio-media-grid{grid-template-columns:repeat(2,1fr)}}
      @media(max-width:650px){.studio-home-preview{grid-template-columns:1fr}.studio-home-image{min-height:190px}.studio-slot-board{grid-template-columns:1fr;grid-template-rows:repeat(4,220px)}.studio-slot.wide{grid-column:auto}.studio-media-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function findSlot(slot){ return state.items.find((item) => Number(item.studio_slot) === slot); }

  function renderHomeCard(){
    const host = $('studio-admin-home'); if (!host) return;
    host.innerHTML = `<section class="studio-admin-card"><div class="studio-admin-card-head"><div><p class="studio-admin-kicker">HOME</p><h2>Immagine principale</h2></div><span class="dashboard-card-note">Copertina della Home</span></div><div class="studio-home-preview"><div class="studio-home-image">${state.homeHero ? `<img src="${esc(state.homeHero)}" alt="Immagine principale del sito" loading="lazy">` : '<div class="studio-home-empty">Nessuna immagine personalizzata.<br>Viene utilizzata l’immagine predefinita.</div>'}</div><div class="studio-home-copy"><strong>Immagine principale della Home</strong><p>Sostituiscila quando vuoi con una nuova fotografia del centro, una grafica stagionale o un’immagine dedicata a una ricorrenza.</p><div class="studio-home-actions"><button class="primary" type="button" id="studio-home-upload">${state.homeHero ? 'Sostituisci immagine' : 'Carica immagine'}</button>${state.homeHero ? '<button class="mini" type="button" id="studio-home-remove">Ripristina predefinita</button>' : ''}</div></div></div></section><section class="studio-admin-card"><div class="studio-admin-card-head"><div><p class="studio-admin-kicker">LO STUDIO</p><h2>Composizione galleria</h2></div></div><div class="studio-home-copy"><p>Trascina una foto dal catalogo in uno dei riquadri per scegliere esattamente dove mostrarla.</p></div></section>`;
    $('studio-home-upload')?.addEventListener('click', () => uploadHomeHero());
    $('studio-home-remove')?.addEventListener('click', () => removeHomeHero());
  }

  function renderSlots(){
    const board = $('studio-slot-board'); if (!board) return;
    board.innerHTML = [1,2,3,4].map(slot => {
      const item = findSlot(slot);
      const media = item ? (String(item.media_type).startsWith('video') ? `<video src="${esc(item.media_url)}" muted loop playsinline></video>` : `<img src="${esc(item.media_url)}" alt="${esc(item.alt_text || item.title || 'Immagine studio')}">`) : '';
      return `<div class="studio-slot ${slot===1?'large':''} ${slot===4?'wide':''} ${item?'has-media':''}" data-studio-slot="${slot}"><span class="studio-slot-label">${SLOT_LABELS[slot-1]}</span>${media || '<div class="studio-slot-empty">Trascina qui una foto<br>oppure selezionala dal catalogo</div>'}${item ? `<div class="studio-slot-overlay"><strong>${esc(item.title || 'Immagine studio')}</strong><small>Posizione ${slot}</small></div><div class="studio-slot-actions"><button type="button" data-clear-slot="${slot}">Svuota</button></div>` : ''}</div>`;
    }).join('');
    board.querySelectorAll('[data-clear-slot]').forEach(btn => btn.addEventListener('click', () => clearSlot(Number(btn.dataset.clearSlot))));
    board.querySelectorAll('.studio-slot').forEach(slotEl => {
      slotEl.addEventListener('dragover', (event) => { event.preventDefault(); slotEl.classList.add('is-dragover'); });
      slotEl.addEventListener('dragleave', () => slotEl.classList.remove('is-dragover'));
      slotEl.addEventListener('drop', (event) => { event.preventDefault(); slotEl.classList.remove('is-dragover'); handleDrop(event, Number(slotEl.dataset.studioSlot)); });
    });
  }

  function renderCatalog(){
    const host = $('studio-media-catalog'); if (!host) return;
    host.innerHTML = state.items.length ? state.items.map(item => {
      const video = String(item.media_type).startsWith('video');
      const slot = Number(item.studio_slot || 0);
      return `<article class="studio-media-card" draggable="true" data-media-id="${esc(item.id)}"><div class="studio-media-preview">${video ? `<video src="${esc(item.media_url)}" muted loop playsinline></video>` : `<img src="${esc(item.media_url)}" alt="${esc(item.alt_text || item.title || 'Media studio')}">`}${slot ? `<span class="studio-media-slot">Riquadro ${slot}</span>` : ''}</div><div class="studio-media-body"><strong title="${esc(item.title || '')}">${esc(item.title || 'Media studio')}</strong><small>${video ? 'Video' : 'Foto'} · ${item.is_published ? 'Pubblicato' : 'Bozza'}</small><div class="studio-media-actions"><button class="mini" type="button" data-place-media="${esc(item.id)}">Posiziona</button><button class="mini" type="button" data-toggle-media="${esc(item.id)}">${item.is_published ? 'Nascondi' : 'Pubblica'}</button><button class="mini" type="button" data-delete-media="${esc(item.id)}">Elimina</button></div></div></article>`;
    }).join('') : '<div class="form-card note">Nessun media presente. Aggiungi una foto o un video per iniziare.</div>';
    host.querySelectorAll('.studio-media-card').forEach(card => { card.addEventListener('dragstart', event => { card.classList.add('dragging'); event.dataTransfer.setData('text/plain', card.dataset.mediaId); event.dataTransfer.effectAllowed = 'move'; }); card.addEventListener('dragend', () => card.classList.remove('dragging')); });
    host.querySelectorAll('[data-place-media]').forEach(btn => btn.addEventListener('click', () => chooseSlotFor(btn.dataset.placeMedia)));
    host.querySelectorAll('[data-toggle-media]').forEach(btn => btn.addEventListener('click', () => toggleMedia(btn.dataset.toggleMedia)));
    host.querySelectorAll('[data-delete-media]').forEach(btn => btn.addEventListener('click', () => deleteMedia(btn.dataset.deleteMedia)));
  }

  function renderPanel(){
    injectStyles();
    const panel = $('panel-gallery'); if (!panel || $('studio-slot-board')) return;
    panel.querySelector('.upload-drop')?.remove();
    const head = panel.querySelector('.gallery-toolbar');
    const homeWrap = document.createElement('div'); homeWrap.id='studio-admin-home'; homeWrap.className='studio-admin-home'; panel.insertBefore(homeWrap, head || null);
    if (head) head.innerHTML = '<div class="studio-media-head"><p>Gestisci le immagini e la loro posizione sul sito.</p><button class="primary" id="studio-upload-media" type="button">+ Aggiungi foto o video</button></div>';
    const boardCard = document.createElement('section'); boardCard.className='studio-admin-card'; boardCard.innerHTML='<div class="studio-admin-card-head"><div><p class="studio-admin-kicker">POSIZIONAMENTO</p><h2>Galleria “Lo studio”</h2></div><span class="dashboard-card-note">4 riquadri</span></div><div class="studio-slot-board" id="studio-slot-board"></div>';
    panel.insertBefore(boardCard, panel.querySelector('.media-admin-grid') || null);
    const catalog = document.createElement('section'); catalog.className='studio-admin-card'; catalog.style.marginTop='16px'; catalog.innerHTML='<div class="studio-admin-card-head"><div><p class="studio-admin-kicker">CATALOGO</p><h2>Media disponibili</h2></div><span class="dashboard-card-note">Trascina per posizionare</span></div><div id="studio-media-catalog" class="studio-media-grid" style="padding:14px"></div>';
    const oldList = panel.querySelector('.media-admin-grid'); if (oldList) oldList.replaceWith(catalog); else panel.appendChild(catalog);
    $('studio-upload-media')?.addEventListener('click', () => chooseLocalFile(null));
    renderHomeCard(); renderSlots(); renderCatalog();
  }

  async function load(){
    try { const [gallery, settings] = await Promise.all([api('/api/gallery?admin=1'), api('/api/settings?admin=1')]); state.items=gallery.items||[]; state.homeHero=settings.items?.home_hero_image||''; renderPanel(); renderHomeCard(); renderSlots(); renderCatalog(); }
    catch (error) { const host=$('gallery-list'); if(host) host.innerHTML=`<div class="form-card note">${esc(error.message||'Impossibile caricare i contenuti.')}</div>`; }
  }

  async function uploadHomeHero(file){
    try { const chosen = file || await requestFile(['image/jpeg','image/png','image/webp','image/avif']); if(!chosen)return; const info=await uploadFile(chosen); const url=info.secure_url; await api('/api/settings',{method:'PUT',body:JSON.stringify({key:'home_hero_image',value:url})}); state.homeHero=url; renderHomeCard(); }
    catch(error){ alert(error.message||'Impossibile caricare l’immagine.'); }
  }
  async function removeHomeHero(){ if(!confirm('Ripristinare l’immagine predefinita della Home?'))return; try{await api('/api/settings',{method:'PUT',body:JSON.stringify({key:'home_hero_image',value:''})});state.homeHero='';renderHomeCard();}catch(error){alert(error.message);} }

  function requestFile(types){ return new Promise(resolve=>{const input=document.createElement('input');input.type='file';input.accept=types.join(',');input.onchange=()=>resolve(input.files?.[0]||null);input.click();}); }
  async function chooseLocalFile(slot){ try{const file=await requestFile(['image/*','video/*']); if(!file)return; const info=await uploadFile(file); const saved=await api('/api/gallery',{method:'POST',body:JSON.stringify({title:info.original_filename||file.name,media_type:info.resource_type||'image',media_url:info.secure_url,alt_text:info.original_filename||file.name,is_published:Boolean(slot),studio_slot:slot||null})}); state.items.push(saved); renderSlots(); renderCatalog(); }catch(error){alert(error.message||'Impossibile aggiungere il file.');} }
  async function handleDrop(event,slot){const id=event.dataTransfer.getData('text/plain');if(id)return moveMedia(id,slot);const file=Array.from(event.dataTransfer.files||[])[0];if(!file)return;try{const info=await uploadFile(file);const saved=await api('/api/gallery',{method:'POST',body:JSON.stringify({title:info.original_filename||file.name,media_type:info.resource_type||'image',media_url:info.secure_url,alt_text:info.original_filename||file.name,is_published:true,studio_slot:slot})});state.items.push(saved);renderSlots();renderCatalog();}catch(error){alert(error.message||'Impossibile aggiungere il file.');}}
  async function moveMedia(id,slot){const item=state.items.find(x=>x.id===id);if(!item)return;try{const saved=await api('/api/gallery',{method:'PUT',body:JSON.stringify({...item,studio_slot:slot,is_published:(slot !== null && slot !== undefined)})});state.items[state.items.findIndex(x=>x.id===id)]=saved;renderSlots();renderCatalog();}catch(error){alert(error.message);}}
  async function clearSlot(slot){const item=findSlot(slot);if(item)await moveMedia(item.id,null);}
  async function toggleMedia(id){const item=state.items.find(x=>x.id===id);if(!item)return;try{const saved=await api('/api/gallery',{method:'PUT',body:JSON.stringify({...item,is_published:!item.is_published})});state.items[state.items.findIndex(x=>x.id===id)]=saved;renderCatalog();renderSlots();}catch(error){alert(error.message);}}
  async function deleteMedia(id){if(!confirm('Eliminare definitivamente questo contenuto?'))return;try{await api('/api/gallery',{method:'DELETE',body:JSON.stringify({id})});state.items=state.items.filter(x=>x.id!==id);renderCatalog();renderSlots();}catch(error){alert(error.message);}}
  function chooseSlotFor(id){const item=state.items.find(x=>x.id===id);if(!item)return;const raw=prompt('Scegli il riquadro: 1 = Accoglienza, 2 = Trattamento, 3 = Tecnologia, 4 = Persona',String(item.studio_slot||'1'));if(raw===null)return;const slot=Number(raw);if(!Number.isInteger(slot)||slot<1||slot>4)return alert('Riquadro non valido.');moveMedia(item.id,slot);}

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load, { once:true }); else load();
})();
