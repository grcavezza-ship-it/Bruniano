/* Gestione riquadri dinamici della sezione "Lo Studio". */
(function(){
  const API='/api/gallery';
  const STORAGE_KEY='bruniano-studio-slot-count';
  const esc=v=>String(v??'').replace(/[&<>\"]/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[s]));
  let items=[];
  let slotCount=4;

  function loadStoredCount(maxAssigned){
    const saved=Number(localStorage.getItem(STORAGE_KEY)||0);
    slotCount=Math.max(4,maxAssigned||0,saved||0);
  }

  async function api(options={}){
    const r=await fetch(API+(options.query||''),{
      method:options.method||'GET',
      credentials:'same-origin',
      headers:{'content-type':'application/json',...(options.headers||{})},
      body:options.body
    });
    const data=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(data.error||`HTTP ${r.status}`);
    return data;
  }

  async function load(){
    try{
      const data=await api({query:'?admin=1'});
      items=data.items||[];
      loadStoredCount(Math.max(0,...items.map(x=>Number(x.studio_slot)||0)));
      render();
      enhanceLibraryCards();
    }catch(error){
      const host=document.getElementById('studio-slot-manager');
      if(host)host.innerHTML=`<div class="form-card note">Impossibile caricare i riquadri: ${esc(error.message)}</div>`;
    }
  }

  function itemForSlot(slot){return items.find(x=>Number(x.studio_slot)===slot)||null;}
  function firstFreeSlot(){for(let i=1;i<=slotCount;i++)if(!itemForSlot(i))return i;return slotCount+1;}
  function ensureSlotCount(n){if(n>slotCount){slotCount=n;localStorage.setItem(STORAGE_KEY,String(slotCount));}}

  function render(){
    const host=document.getElementById('studio-slot-manager');
    if(!host)return;
    const cards=[];
    for(let slot=1;slot<=slotCount;slot++){
      const item=itemForSlot(slot);
      const video=item&&String(item.media_type).startsWith('video');
      cards.push(`<article class="studio-slot-card ${item?'has-media':'empty'}" data-studio-slot="${slot}">
        <div class="studio-slot-head"><div><span class="studio-slot-kicker">RIQUADRO ${slot}</span><strong>Posizione ${slot}</strong></div><span class="studio-slot-state">${item?(item.is_published?'ONLINE':'BOZZA'):'VUOTO'}</span></div>
        <div class="studio-slot-drop" data-slot-drop="${slot}">
          ${item?(video?`<video src="${esc(item.media_url)}" muted loop playsinline></video>`:`<img src="${esc(item.media_url)}" alt="">`):`<div class="studio-slot-empty"><span>＋</span><strong>Trascina qui una foto</strong><small>oppure usa “Carica foto”</small></div>`}
          <div class="studio-slot-drop-label">Rilascia per assegnare al riquadro ${slot}</div>
        </div>
        <div class="studio-slot-fields">
          <label>Descrizione sul sito<textarea data-slot-description="${slot}" rows="2" placeholder="Es. Sala di fisioterapia">${esc(item?.title||'')}</textarea></label>
          <div class="studio-slot-actions">
            <button class="mini studio-slot-upload" type="button" data-slot-upload="${slot}">Carica foto</button>
            ${item?`<button class="mini" type="button" data-slot-save="${slot}">Salva</button><button class="mini" type="button" data-slot-publish="${slot}">${item.is_published?'Nascondi':'Pubblica'}</button><button class="mini danger" type="button" data-slot-remove="${slot}">Togli foto</button>`:''}
          </div>
        </div>
      </article>`);
    }
    host.innerHTML=`<div class="studio-slots-toolbar"><div><span class="eyebrow">LAYOUT</span><h2>Riquadri de “Lo Studio”</h2><p>Posiziona le foto nei riquadri. Puoi aggiungerne quanti ne vuoi.</p></div><div class="studio-slots-toolbar-actions"><button class="mini" id="studio-add-slot" type="button">＋ Aggiungi riquadro</button><button class="primary" id="studio-upload-many" type="button">＋ Carica più foto</button></div></div><div class="studio-slots-grid">${cards.join('')}</div>`;
    bind();
  }

  function getUploadHelper(){
    if(window.BrunianoCloudinary)return Promise.resolve(window.BrunianoCloudinary);
    return new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      script.src='cloudinary-upload.js';
      script.onload=()=>window.BrunianoCloudinary?resolve(window.BrunianoCloudinary):reject(new Error('Cloudinary non disponibile'));
      script.onerror=()=>reject(new Error('Impossibile caricare il modulo immagini'));
      document.head.appendChild(script);
    });
  }

  async function createMedia(info,slot){
    const filename=info.original_filename||info.display_name||'Foto Bruniano';
    const saved=await api({method:'POST',body:JSON.stringify({title:filename,media_type:info.resource_type||'image',media_url:info.secure_url||info.url,alt_text:filename,studio_slot:slot,is_published:false})});
    items=items.filter(x=>Number(x.studio_slot)!==slot);
    items.push(saved);
    return saved;
  }

  async function uploadIntoSlot(slot){
    try{
      const cloud=await getUploadHelper();
      const info=await new Promise((resolve,reject)=>{
        cloud.uploadImage(result=>resolve(result)).catch(reject);
      });
      await createMedia(info,slot);
      ensureSlotCount(slot);
      render();
      document.getElementById('gallery-filter')?.dispatchEvent(new Event('change'));
      document.getElementById('gallery-status')?.replaceChildren(document.createTextNode(`Foto assegnata al riquadro ${slot} come bozza`));
    }catch(error){alert(error.message||'Caricamento non riuscito');}
  }

  async function uploadMany(){
    try{
      const cloud=await getUploadHelper();
      let target=firstFreeSlot();
      const files=await chooseFiles();
      if(!files.length)return;
      ensureSlotCount(target+files.length-1);
      let index=0;
      await cloud.uploadFiles(files,async info=>{
        const slot=target+index++;
        await createMedia(info,slot);
      });
      render();
      document.getElementById('gallery-status')?.replaceChildren(document.createTextNode('Foto caricate e posizionate nei riquadri disponibili'));
    }catch(error){alert(error.message||'Caricamento non riuscito');}
  }

  function chooseFiles(){
    return new Promise(resolve=>{
      const input=document.createElement('input');
      input.type='file';input.multiple=true;input.accept='image/jpeg,image/png,image/webp,image/avif,video/mp4,video/quicktime';
      input.onchange=()=>resolve(Array.from(input.files||[]));
      input.click();
    });
  }

  async function saveSlot(slot){
    const item=itemForSlot(slot);if(!item)return;
    const description=document.querySelector(`[data-slot-description="${slot}"]`)?.value.trim()||'';
    try{
      const saved=await api({method:'PUT',body:JSON.stringify({...item,id:item.id,title:description,alt_text:description||item.alt_text||'Bruniano',studio_slot:slot})});
      items=items.map(x=>x.id===saved.id?saved:x);render();
    }catch(error){alert(error.message);}
  }

  async function publishSlot(slot){
    const item=itemForSlot(slot);if(!item)return;
    try{
      const saved=await api({method:'PUT',body:JSON.stringify({...item,id:item.id,is_published:!item.is_published,studio_slot:slot})});
      items=items.map(x=>x.id===saved.id?saved:x);render();
    }catch(error){alert(error.message);}
  }

  async function removeFromSlot(slot){
    const item=itemForSlot(slot);if(!item)return;
    if(!confirm(`Togliere la foto dal riquadro ${slot}? La foto resterà nel catalogo.`))return;
    try{
      const saved=await api({method:'PUT',body:JSON.stringify({...item,id:item.id,studio_slot:null})});
      items=items.map(x=>x.id===saved.id?saved:x);render();
    }catch(error){alert(error.message);}
  }

  async function assignExisting(id,slot){
    const item=items.find(x=>String(x.id)===String(id));if(!item)return;
    try{
      const saved=await api({method:'PUT',body:JSON.stringify({...item,id:item.id,studio_slot:slot})});
      items=items.filter(x=>Number(x.studio_slot)!==slot&&x.id!==saved.id);items.push(saved);ensureSlotCount(slot);render();
    }catch(error){alert(error.message);}
  }

  function bind(){
    document.getElementById('studio-add-slot')?.addEventListener('click',()=>{slotCount++;localStorage.setItem(STORAGE_KEY,String(slotCount));render();document.querySelector(`[data-studio-slot="${slotCount}"]`)?.scrollIntoView({behavior:'smooth',block:'center'});});
    document.getElementById('studio-upload-many')?.addEventListener('click',uploadMany);
    document.querySelectorAll('[data-slot-upload]').forEach(btn=>btn.addEventListener('click',()=>uploadIntoSlot(Number(btn.dataset.slotUpload))));
    document.querySelectorAll('[data-slot-save]').forEach(btn=>btn.addEventListener('click',()=>saveSlot(Number(btn.dataset.slotSave))));
    document.querySelectorAll('[data-slot-publish]').forEach(btn=>btn.addEventListener('click',()=>publishSlot(Number(btn.dataset.slotPublish))));
    document.querySelectorAll('[data-slot-remove]').forEach(btn=>btn.addEventListener('click',()=>removeFromSlot(Number(btn.dataset.slotRemove))));
    document.querySelectorAll('[data-slot-drop]').forEach(zone=>{
      zone.addEventListener('dragover',e=>{e.preventDefault();zone.classList.add('is-dragover');});
      zone.addEventListener('dragleave',()=>zone.classList.remove('is-dragover'));
      zone.addEventListener('drop',e=>{e.preventDefault();zone.classList.remove('is-dragover');const id=e.dataTransfer?.getData('text/bruniano-media');if(id)assignExisting(id,Number(zone.dataset.slotDrop));});
    });
  }

  function enhanceLibraryCards(){
    document.querySelectorAll('#gallery-list .media-admin-card').forEach(card=>{
      if(card.dataset.studioDragEnhanced)return;
      const del=card.querySelector('[data-gallery-delete]');const toggle=card.querySelector('[data-gallery-toggle]');const id=del?.dataset.galleryDelete||toggle?.dataset.galleryToggle;
      if(!id)return;
      card.dataset.studioDragEnhanced='1';card.draggable=true;card.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/bruniano-media',id);e.dataTransfer.effectAllowed='move';});
    });
  }

  function injectStyles(){
    if(document.getElementById('studio-slots-css'))return;
    const style=document.createElement('style');style.id='studio-slots-css';style.textContent=`
      #studio-slot-manager{margin:22px 0 30px}.studio-slots-toolbar{display:flex;justify-content:space-between;gap:20px;align-items:flex-end;padding:22px;border:1px solid #e1e8f2;border-radius:22px;background:#fff;box-shadow:0 10px 30px rgba(20,45,85,.05)}.studio-slots-toolbar h2{margin:4px 0 5px;font-size:24px}.studio-slots-toolbar p{margin:0;color:#718096}.studio-slots-toolbar-actions{display:flex;gap:8px;flex-wrap:wrap}.studio-slots-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:16px}.studio-slot-card{border:1px solid #dfe7f1;border-radius:22px;background:#fff;overflow:hidden;box-shadow:0 8px 24px rgba(20,45,85,.05)}.studio-slot-head{display:flex;justify-content:space-between;align-items:center;padding:16px 18px;border-bottom:1px solid #edf1f6}.studio-slot-head strong{display:block;font-size:14px;margin-top:3px}.studio-slot-kicker{font-size:9px;font-weight:900;letter-spacing:.14em;color:#155cff}.studio-slot-state{font-size:9px;font-weight:900;letter-spacing:.1em;padding:6px 8px;border-radius:999px;background:#f0f4fa;color:#6c788b}.studio-slot-card.has-media .studio-slot-state{background:#edf5ff;color:#155cff}.studio-slot-drop{position:relative;min-height:230px;background:#f4f7fb;display:flex;align-items:center;justify-content:center;overflow:hidden}.studio-slot-drop img,.studio-slot-drop video{width:100%;height:230px;object-fit:cover;display:block}.studio-slot-empty{text-align:center;color:#7a8799}.studio-slot-empty span{display:block;font-size:30px;line-height:1}.studio-slot-empty strong{display:block;margin-top:8px;color:#4b586b}.studio-slot-empty small{display:block;margin-top:4px}.studio-slot-drop-label{position:absolute;inset:auto 10px 10px;padding:7px 9px;background:rgba(8,26,56,.82);color:#fff;border-radius:10px;font-size:10px;text-align:center;opacity:0;transition:.2s}.studio-slot-drop.is-dragover .studio-slot-drop-label{opacity:1}.studio-slot-drop.is-dragover{outline:3px solid rgba(21,92,255,.28);outline-offset:-3px}.studio-slot-fields{padding:15px 18px 18px}.studio-slot-fields label{display:block;font-size:11px;font-weight:800;color:#536174}.studio-slot-fields textarea{display:block;width:100%;margin-top:7px;box-sizing:border-box;border:1px solid #dce4ef;border-radius:12px;padding:10px 12px;font:inherit;font-size:13px;resize:vertical;min-height:58px}.studio-slot-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.studio-slot-actions .danger{color:#b23a3a}.studio-slots-toolbar .eyebrow{margin:0;font-size:9px;letter-spacing:.14em;font-weight:900;color:#155cff}@media(max-width:800px){.studio-slots-toolbar{display:block}.studio-slots-toolbar-actions{margin-top:15px}.studio-slots-grid{grid-template-columns:1fr}}
    `;document.head.appendChild(style);
  }

  function init(){
    const panel=document.getElementById('panel-gallery');if(!panel)return;
    const toolbar=panel.querySelector('.gallery-toolbar');
    if(!toolbar)return;
    const host=document.createElement('section');host.id='studio-slot-manager';toolbar.parentNode.insertBefore(host,toolbar);
    injectStyles();load();
    const observer=new MutationObserver(enhanceLibraryCards);const list=document.getElementById('gallery-list');if(list)observer.observe(list,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
