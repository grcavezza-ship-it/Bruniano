const teamState = { items: [] };
const team$ = (id) => document.getElementById(id);
const teamEsc = (v) => String(v ?? '').replace(/[&<>\"]/g, (s) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;' }[s]));
const text = (v) => String(v ?? '').trim();
const arr = (v) => Array.isArray(v) ? v : [];

async function teamApi(url, options = {}) {
  const r = await fetch(url, { headers: { 'content-type': 'application/json' }, ...options });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
  return d;
}

function emptyCurriculum() {
  return {
    version: 2,
    personal: { address:'', phone:'', email:'', nationality:'', birth_date:'' },
    profile: '',
    experiences: [],
    education: [],
    languages: [],
    skills: { relational:'', organizational:'', technical:'', artistic:'', other:'' },
    certifications: [],
    scientific: { publications:'', congresses:'', teaching:'', research:'' },
    driving: '',
    additional: '',
    consent: ''
  };
}

function normalizeCurriculum(raw) {
  const c = emptyCurriculum();
  if (!raw || typeof raw !== 'object') return c;
  c.version = 2;
  if (raw.version === 2) {
    Object.assign(c, raw);
    c.personal = { ...c.personal, ...(raw.personal || {}) };
    c.skills = { ...c.skills, ...(raw.skills || {}) };
    c.scientific = { ...c.scientific, ...(raw.scientific || {}) };
    c.experiences = arr(raw.experiences);
    c.education = arr(raw.education);
    c.languages = arr(raw.languages);
    c.certifications = arr(raw.certifications);
    return c;
  }
  c.profile = text(raw.profile);
  const add = [];
  if (text(raw.training)) c.education.push({ from:'', to:'', institution:'', title:'', level:'', result:'', notes:text(raw.training) });
  if (text(raw.experience)) c.experiences.push({ from:'', to:'', organization:'', address:'', sector:'', role:'', responsibilities:text(raw.experience) });
  if (text(raw.certifications)) c.certifications.push({ title:'', issuer:'', period:'', notes:text(raw.certifications) });
  if (add.length) c.additional = add.join('\n');
  return c;
}

function ensureCloudinary() {
  return new Promise((resolve, reject) => {
    if (window.BrunianoCloudinary) return resolve();
    const s = document.createElement('script');
    s.src = 'cloudinary-upload.js';
    s.onload = () => window.BrunianoCloudinary ? resolve() : reject(new Error('Caricatore immagini non disponibile'));
    s.onerror = () => reject(new Error('Impossibile aprire il caricatore immagini'));
    document.head.appendChild(s);
  });
}

async function uploadPhoto(inputId, statusId) {
  try {
    await ensureCloudinary();
    const status = team$(statusId);
    if (status) status.textContent = 'Apertura…';
    await window.BrunianoCloudinary.uploadImage(info => {
      const input = team$(inputId);
      if (input) input.value = info.secure_url || info.url || '';
      if (status) status.textContent = 'Foto caricata correttamente';
    });
  } catch (e) {
    const status = team$(statusId);
    if (status) status.textContent = e.message;
  }
}

function field(label, id, value, type='text') {
  return `<label>${label}<input id="${id}" type="${type}" value="${teamEsc(value)}"></label>`;
}
function area(label, id, value, rows=4) {
  return `<label>${label}<textarea id="${id}" rows="${rows}">${teamEsc(value)}</textarea></label>`;
}
function sectionTitle(title, note='') {
  return `<div class="form-card note team-section-title"><strong>${title}</strong>${note ? `<span>${note}</span>` : ''}</div>`;
}

function repeatable(containerId, items, renderItem, addLabel, emptyLabel='Nessun elemento aggiunto.') {
  const box = team$(containerId);
  if (!box) return;
  box.innerHTML = '';
  const list = arr(items);
  if (!list.length) {
    const empty = document.createElement('div');
    empty.className = 'form-card note team-empty';
    empty.textContent = emptyLabel;
    box.appendChild(empty);
  }
  list.forEach((item, index) => box.appendChild(renderItem(item, index)));
  const add = document.createElement('button');
  add.type = 'button';
  add.className = 'mini team-add';
  add.textContent = `+ ${addLabel}`;
  add.addEventListener('click', () => {
    box.querySelector('.team-empty')?.remove();
    box.insertBefore(renderItem({}, box.querySelectorAll('.team-repeat').length), add);
  });
  box.appendChild(add);
}

function removeButton() {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'mini team-remove'; b.textContent = 'Rimuovi';
  b.addEventListener('click', () => b.closest('.team-repeat')?.remove());
  return b;
}

function experienceRow(item={}) {
  const d = document.createElement('div'); d.className='form-card team-repeat';
  d.innerHTML = `<div class="panel-title"><strong>Esperienza professionale</strong></div>
    <div class="form-row">${field('Dal','exp-from',item.from||'','text')}${field('Al / attuale','exp-to',item.to||'','text')}</div>
    <div class="form-row">${field('Nome e indirizzo del datore / struttura','exp-organization',item.organization||'')}${field('Sede / indirizzo','exp-address',item.address||'')}</div>
    <div class="form-row">${field('Tipo di azienda / settore','exp-sector',item.sector||'')}${field('Tipo di impiego / ruolo','exp-role',item.role||'')}</div>
    ${area('Principali mansioni e responsabilità','exp-responsibilities',item.responsibilities||'',5)}`;
  d.querySelector('.panel-title').appendChild(removeButton());
  return d;
}
function educationRow(item={}) {
  const d = document.createElement('div'); d.className='form-card team-repeat';
  d.innerHTML = `<div class="panel-title"><strong>Istruzione e formazione</strong></div>
    <div class="form-row">${field('Dal','edu-from',item.from||'','text')}${field('Al','edu-to',item.to||'','text')}</div>
    ${field('Istituto / università / ente','edu-institution',item.institution||'')}
    ${field('Titolo / corso / qualifica','edu-title',item.title||'')}
    <div class="form-row">${field('Livello / classificazione','edu-level',item.level||'')}${field('Voto / risultato','edu-result',item.result||'')}</div>
    ${area('Note','edu-notes',item.notes||'',3)}`;
  d.querySelector('.panel-title').appendChild(removeButton());
  return d;
}
function languageRow(item={}) {
  const d = document.createElement('div'); d.className='form-card team-repeat';
  d.innerHTML = `<div class="panel-title"><strong>Lingua</strong></div>
    ${field('Lingua','lang-language',item.language||'')}
    <div class="form-row">${field('Lettura','lang-reading',item.reading||'')}${field('Scrittura','lang-writing',item.writing||'')}</div>
    ${field('Espressione orale','lang-speaking',item.speaking||'')}`;
  d.querySelector('.panel-title').appendChild(removeButton());
  return d;
}
function certificationRow(item={}) {
  const d = document.createElement('div'); d.className='form-card team-repeat';
  d.innerHTML = `<div class="panel-title"><strong>Certificazione / master / corso</strong></div>
    ${field('Titolo','cert-title',item.title||'')}
    <div class="form-row">${field('Ente / organizzatore','cert-issuer',item.issuer||'')}${field('Periodo / anno','cert-period',item.period||'')}</div>
    ${area('Note','cert-notes',item.notes||'',3)}`;
  d.querySelector('.panel-title').appendChild(removeButton());
  return d;
}

function readRepeat(id, fields) {
  return [...document.querySelectorAll(`#${id} .team-repeat`)].map(row => {
    const out = {};
    for (const [k, suffix] of Object.entries(fields)) out[k] = text(row.querySelector(`[id$="-${suffix}"]`)?.value);
    return out;
  });
}

function bindRepeaters(c) {
  repeatable('experience-list', c.experiences, experienceRow, 'Aggiungi esperienza', 'Nessuna esperienza aggiunta.');
  repeatable('education-list', c.education, educationRow, 'Aggiungi formazione', 'Nessun titolo di formazione aggiunto.');
  repeatable('languages-list', c.languages, languageRow, 'Aggiungi lingua', 'Nessuna lingua aggiunta.');
  repeatable('certifications-list', c.certifications, certificationRow, 'Aggiungi certificazione', 'Nessuna certificazione aggiunta.');
}

function collectCurriculum() {
  return {
    version: 2,
    personal: {
      address: text(team$('cv-address')?.value), phone: text(team$('cv-phone')?.value), email: text(team$('cv-email')?.value),
      nationality: text(team$('cv-nationality')?.value), birth_date: text(team$('cv-birth-date')?.value)
    },
    profile: text(team$('cv-profile')?.value),
    experiences: readRepeat('experience-list', { from:'from', to:'to', organization:'organization', address:'address', sector:'sector', role:'role', responsibilities:'responsibilities' }),
    education: readRepeat('education-list', { from:'from', to:'to', institution:'institution', title:'title', level:'level', result:'result', notes:'notes' }),
    languages: readRepeat('languages-list', { language:'language', reading:'reading', writing:'writing', speaking:'speaking' }),
    skills: {
      relational: text(team$('cv-skill-relational')?.value), organizational: text(team$('cv-skill-organizational')?.value),
      technical: text(team$('cv-skill-technical')?.value), artistic: text(team$('cv-skill-artistic')?.value), other: text(team$('cv-skill-other')?.value)
    },
    certifications: readRepeat('certifications-list', { title:'title', issuer:'issuer', period:'period', notes:'notes' }),
    scientific: {
      publications: text(team$('cv-publications')?.value), congresses: text(team$('cv-congresses')?.value),
      teaching: text(team$('cv-teaching')?.value), research: text(team$('cv-research')?.value)
    },
    driving: text(team$('cv-driving')?.value),
    additional: text(team$('cv-additional')?.value),
    consent: text(team$('cv-consent')?.value)
  };
}

function teamForm(item={}) {
  const form = team$('team-form'); if (!form) return;
  const c = normalizeCurriculum(item.curriculum);
  form.innerHTML = `<div class="panel-title"><div><p>SCHEDA PROFESSIONISTA</p><h3>${item.id ? 'Modifica professionista' : 'Nuovo professionista'}</h3></div><button class="mini" type="button" id="team-cancel">Annulla</button></div>
    <form id="team-editor">
      <input type="hidden" id="team-id" value="${teamEsc(item.id||'')}">
      ${sectionTitle('Identità professionale','Informazioni utilizzate nella scheda del professionista.')}
      <div class="form-row">${field('Nome e cognome','team-name',item.name||'')}${field('Qualifica / professione','team-role',item.role||'')}</div>
      <div class="form-row">${field('Specializzazione / area di competenza','team-specialty',item.specialty||'')}${field('Ordine visualizzazione','team-order',item.sort_order||0,'number')}</div>
      ${sectionTitle('Fotografia','La foto viene caricata separatamente.')}
      <div class="form-card note"><input type="hidden" id="team-photo" value="${teamEsc(item.photo_url||'')}"><button class="mini" type="button" id="team-photo-upload">${item.photo_url?'Sostituisci foto':'Carica foto'}</button><small id="team-photo-status">La foto del professionista si carica separatamente.</small></div>
      ${sectionTitle('Importazione curriculum','Carica il PDF e prova a distribuire automaticamente tutte le informazioni nelle sezioni sottostanti.')}
      <div class="form-card note"><button class="primary" type="button" id="team-cv-import-btn">Carica CV e compila</button><input id="team-cv-import-file" type="file" accept="application/pdf,.pdf" hidden><small id="team-cv-import-status"></small></div>
      ${area('Breve presentazione','team-bio',item.bio||'',4)}
      ${sectionTitle('Dati personali','Facoltativi e non pubblicati nella scheda pubblica.')}
      <div class="form-row">${field('Indirizzo','cv-address',c.personal.address)}${field('Telefono','cv-phone',c.personal.phone)}</div>
      <div class="form-row">${field('E-mail','cv-email',c.personal.email)}${field('Nazionalità','cv-nationality',c.personal.nationality)}</div>
      ${field('Data di nascita','cv-birth-date',c.personal.birth_date)}
      ${sectionTitle('Profilo professionale')}${area('Profilo','cv-profile',c.profile,6)}
      ${sectionTitle('Esperienza lavorativa','Blocchi separati come nel modello CV europeo.') }<div id="experience-list"></div>
      ${sectionTitle('Istruzione e formazione')}<div id="education-list"></div>
      ${sectionTitle('Lingue','Lettura, scrittura ed espressione orale.') }<div id="languages-list"></div>
      ${sectionTitle('Capacità e competenze personali')}
      ${area('Competenze relazionali','cv-skill-relational',c.skills.relational,4)}
      ${area('Competenze organizzative','cv-skill-organizational',c.skills.organizational,4)}
      ${area('Competenze tecniche','cv-skill-technical',c.skills.technical,5)}
      ${area('Competenze artistiche','cv-skill-artistic',c.skills.artistic,4)}
      ${area('Altre competenze','cv-skill-other',c.skills.other,4)}
      ${sectionTitle('Certificazioni, master e corsi')}<div id="certifications-list"></div>
      ${sectionTitle('Attività scientifica e didattica')}
      ${area('Pubblicazioni','cv-publications',c.scientific.publications,4)}
      ${area('Congressi / relazioni','cv-congresses',c.scientific.congresses,4)}
      ${area('Docenze','cv-teaching',c.scientific.teaching,4)}
      ${area('Ricerca','cv-research',c.scientific.research,4)}
      ${sectionTitle('Patenti e ulteriori informazioni')}
      ${field('Patenti','cv-driving',c.driving)}
      ${area('Ulteriori informazioni','cv-additional',c.additional,5)}
      ${area('Autorizzazione / consenso','cv-consent',c.consent,3)}
      <label class="check-inline"><input id="team-published" type="checkbox" ${item.id ? (item.is_published?'checked':'') : 'checked'}> Pubblica sul sito</label>
      <div class="form-actions"><button class="primary" type="submit">Salva professionista</button><span id="team-status"></span></div>
    </form>`;

  team$('team-cancel')?.addEventListener('click',()=>form.classList.add('hidden'));
  team$('team-photo-upload')?.addEventListener('click',()=>uploadPhoto('team-photo','team-photo-status'));
  bindRepeaters(c);
  team$('team-editor')?.addEventListener('submit',saveTeam);
  window.BrunianoTeamCvReady?.();
}

function renderTeam() {
  const list = team$('team-list'); if (!list) return;
  list.innerHTML = teamState.items.length ? teamState.items.map(m => `<div class="managed-item"><div style="display:flex;gap:12px;align-items:center">${m.photo_url?`<img src="${teamEsc(m.photo_url)}" alt="" style="width:54px;height:54px;object-fit:cover;border-radius:12px">`:''}<div><strong>${teamEsc(m.name)}</strong><small>${teamEsc(m.role)}${m.specialty?' · '+teamEsc(m.specialty):''} · ${m.is_published?'Pubblicato':'Bozza'}</small></div></div><div class="managed-actions"><button class="mini" data-team-edit="${teamEsc(m.id)}">Modifica</button><button class="mini" data-team-delete="${teamEsc(m.id)}">Elimina</button></div></div>`).join('') : '<div class="form-card note">Nessun professionista presente.</div>';
  const count = team$('count-team'); if (count) count.textContent = teamState.items.length;
}

async function loadTeam() {
  try {
    const d = await teamApi('/api/team?admin=1');
    teamState.items = d.items || [];
    teamState.items.forEach(m => { m.curriculum = normalizeCurriculum(m.curriculum); });
    renderTeam();
    const status=team$('system-status'); if(status){status.textContent='Servizio collegato';status.classList.add('ok');}
  } catch(e) {
    const list=team$('team-list'); if(list) list.innerHTML=`<div class="form-card note">${teamEsc(e.message||'Servizio non disponibile.')}</div>`;
    const status=team$('system-status'); if(status) status.textContent='Servizio non disponibile';
  }
}

async function saveTeam(e) {
  e.preventDefault();
  const id=team$('team-id')?.value||undefined;
  const payload={id,name:text(team$('team-name')?.value),role:text(team$('team-role')?.value),specialty:text(team$('team-specialty')?.value),photo_url:text(team$('team-photo')?.value),bio:text(team$('team-bio')?.value),sort_order:Number(team$('team-order')?.value||0),is_published:!!team$('team-published')?.checked,curriculum:collectCurriculum()};
  try {
    const saved=await teamApi('/api/team',{method:id?'PUT':'POST',body:JSON.stringify(payload)});
    const i=teamState.items.findIndex(x=>x.id===saved.id); if(i>=0)teamState.items[i]=saved; else teamState.items.push(saved);
    renderTeam(); teamForm(saved);
    const status=team$('team-status'); if(status) status.textContent='Professionista salvato';
  } catch(e) { const status=team$('team-status'); if(status) status.textContent=e.message; }
}

document.addEventListener('click',async e=>{
  const edit=e.target.closest('[data-team-edit]'), del=e.target.closest('[data-team-delete]');
  if(edit){ teamForm(teamState.items.find(x=>x.id===edit.dataset.teamEdit)); team$('team-form')?.classList.remove('hidden'); team$('team-form')?.scrollIntoView({behavior:'smooth'}); }
  if(del){
    if(!confirm('Eliminare definitivamente questo professionista?')) return;
    try{await teamApi('/api/team',{method:'DELETE',body:JSON.stringify({id:del.dataset.teamDelete})});teamState.items=teamState.items.filter(x=>x.id!==del.dataset.teamDelete);renderTeam();}
    catch(err){alert(err.message)}
  }
});

const addTeamReal=team$('add-team');
if(addTeamReal)addTeamReal.addEventListener('click',()=>{teamForm();team$('team-form')?.classList.remove('hidden');team$('team-form')?.scrollIntoView({behavior:'smooth'});});
loadTeam();
