(() => {
  const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs';
  const WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
  let pdfjsPromise;
  const $ = id => document.getElementById(id);
  const norm = v => String(v ?? '').replace(/\u00a0/g,' ').replace(/[ \t]+/g,' ').trim();
  const low = v => norm(v).toLowerCase();
  const set = (id,v) => { const el=$(id); if(el && v!=null) el.value=String(v); };
  const esc = v => String(v??'').replace(/[&<>\"]/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[s]));

  const empty = () => ({ version:2, personal:{address:'',phone:'',email:'',nationality:'',birth_date:''}, profile:'', experiences:[], education:[], languages:[], skills:{relational:'',organizational:'',technical:'',artistic:'',other:''}, certifications:[], scientific:{publications:'',congresses:'',teaching:'',research:''}, driving:'', additional:'', consent:'' });

  function loadPdfJs(){ if(!pdfjsPromise) pdfjsPromise=import(PDFJS).then(pdfjs=>{pdfjs.GlobalWorkerOptions.workerSrc=WORKER;return pdfjs;}); return pdfjsPromise; }
  async function extract(file,status){
    const pdfjs=await loadPdfJs(); const pdf=await pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
    const pages=[];
    for(let n=1;n<=pdf.numPages;n++){
      const page=await pdf.getPage(n), c=await page.getTextContent({normalizeWhitespace:true,disableCombineTextItems:false});
      const items=(c.items||[]).map(i=>({str:norm(i.str),x:Number(i.transform?.[4]||0),y:Number(i.transform?.[5]||0)})).filter(i=>i.str).sort((a,b)=>Math.abs(a.y-b.y)>3?b.y-a.y:a.x-b.x);
      const lines=[]; for(const item of items){const last=lines[lines.length-1]; if(last&&Math.abs(last.y-item.y)<=3)last.parts.push(item.str); else lines.push({y:item.y,parts:[item.str]});}
      pages.push(lines.map(x=>norm(x.parts.join(' '))).filter(Boolean).join('\n')); if(status)status.textContent=`Lettura curriculum… pagina ${n}/${pdf.numPages}`;
    }
    return pages.join('\n\n');
  }

  const H={
    experience:['esperienza lavorativa','esperienza professionale','esperienze professionali','esperienza','esperienze lavorative','attività professionale','attivita professionale'],
    education:['istruzione e formazione','istruzione','formazione','formazione accademica','educazione','studi'],
    personal:['informazioni personali','dati personali'],
    profile:['profilo professionale','profilo','presentazione','chi sono','summary','about'],
    relational:['capacità e competenze relazionali','competenze relazionali'],
    organizational:['capacità e competenze organizzative','competenze organizzative'],
    technical:['capacità e competenze tecniche','competenze tecniche'],
    artistic:['capacità e competenze artistiche','competenze artistiche'],
    certifications:['certificazioni e competenze','certificazioni','titoli e certificazioni','abilitazioni','master','corsi'],
    scientific:['pubblicazioni','attività scientifica','attività scientifica e didattica','ricerca','docenze','congressi'],
    driving:['patente o patenti','patenti'],
    additional:['ulteriori informazioni','altre informazioni','informazioni aggiuntive']
  };
  const allH=Object.values(H).flat().concat(['NOME','NOME E COGNOME','QUALIFICA','PROFESSIONE','SPECIALIZZAZIONE','ORDINE','MADRELINGUA','ALTRE LINGUA','DATA DI NASCITA','TELEFONO','E-MAIL','EMAIL']);
  const heading = s => { const t=norm(s).replace(/[:\-–]+$/,''); const l=low(t); return allH.some(h=>l===low(h)) || (t.length<=70&&/^[A-ZÀ-ÖØ-Ý0-9][A-ZÀ-ÖØ-Ý0-9 .&/’'_-]+$/.test(t)&&!/[.!?]/.test(t)); };
  const findH=(lines,a)=>lines.findIndex(x=>a.some(h=>low(x).replace(/[:\-–]+$/,'')===low(h)));
  function section(lines,a){const start=findH(lines,a); if(start<0)return[]; const out=[]; for(let i=start+1;i<lines.length;i++){if(heading(lines[i])&&allH.some(h=>low(lines[i]).replace(/[:\-–]+$/,'')===low(h)))break;out.push(lines[i]);}return out;}
  function label(lines,aliases){for(let i=0;i<lines.length;i++){for(const a of aliases){const re=new RegExp(`^${a.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\s*[:\\-–]?\\s*(.*)$`,'i');const m=lines[i].match(re);if(m)return norm(m[1])||norm(lines[i+1]||'');}}return '';}
  const dateRx=/^(?:(?:\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})|(?:\d{2}\/\d{4})|(?:\d{4}))[ \t]*(?:[-–]|a|al)[ \t]*(?:(?:\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})|(?:\d{2}\/\d{4})|(?:\d{4})|oggi|tuttora|in corso)$/i;
  function blocks(lines){const out=[];let cur=[];for(const x of lines){if(dateRx.test(x)&&cur.length){out.push(cur);cur=[x];}else cur.push(x);}if(cur.length)out.push(cur);return out.filter(Boolean);}
  function splitDate(s){const p=s.split(/\s*(?:[-–]|\s+al\s+)\s*/i);return {from:norm(p[0]),to:norm(p.slice(1).join(' - '))};}

  function parse(raw){
    const lines=raw.split(/\r?\n/).map(norm).filter(Boolean), c=empty();
    c.personal.address=label(lines,['indirizzo']); c.personal.phone=label(lines,['telefono','tel.'])||((raw.match(/(?:\+39[ .-]?)?(?:\d[ .-]?){8,12}\d/g)||[])[0]||''); c.personal.email=label(lines,['e-mail','email','mail'])||((raw.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)||[])[0]||''); c.personal.nationality=label(lines,['nazionalità','nazionalita']); c.personal.birth_date=label(lines,['data di nascita','nato il','nata il']);
    c.profile=section(lines,H.profile).join(' ');
    c.experiences=blocks(section(lines,H.experience)).map(b=>{const d={from:'',to:'',organization:'',address:'',sector:'',role:'',responsibilities:''};let i=0;if(dateRx.test(b[0])){Object.assign(d,splitDate(b[0]));i=1;}const take=(aliases,k)=>{for(let j=i;j<b.length;j++){const re=new RegExp(`^(?:${aliases.map(a=>a.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')})\\s*[:\\-–]?\\s*(.*)$`,'i'),m=b[j].match(re);if(m){d[k]=norm(m[1])||norm(b[j+1]||'');return true;}}return false;};take(['nome e indirizzo del datore di lavoro','datore di lavoro','azienda','struttura','ente'],'organization');take(['sede','indirizzo'],'address');take(['tipo di azienda o settore','azienda o settore','settore'],'sector');take(['tipo di impiego','ruolo','incarico','posizione'],'role');take(['principali mansioni e responsabilità','principali mansioni','mansioni','responsabilità','responsabilita'],'responsibilities');if(!d.organization&&b[i])d.organization=b[i++];if(!d.sector&&b[i]&&b[i].length<120)d.sector=b[i++];if(!d.role&&b[i]&&b[i].length<120)d.role=b[i++];if(!d.responsibilities&&i<b.length)d.responsibilities=b.slice(i).join(' ');return d;}).filter(x=>Object.values(x).some(Boolean));
    c.education=blocks(section(lines,H.education)).map(b=>{const d={from:'',to:'',institution:'',title:'',level:'',result:'',notes:''};let i=0;if(dateRx.test(b[0])){Object.assign(d,splitDate(b[0]));i=1;}const take=(aliases,k)=>{for(let j=i;j<b.length;j++){const re=new RegExp(`^(?:${aliases.map(a=>a.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')})\\s*[:\\-–]?\\s*(.*)$`,'i'),m=b[j].match(re);if(m){d[k]=norm(m[1])||norm(b[j+1]||'');return true;}}return false;};take(['nome e tipo di istituto di istruzione o formazione','istituto','università','universita','ente'],'institution');take(['titolo','qualifica','corso','laurea','specializzazione'],'title');take(['livello nella classifica nazionale','livello','classificazione'],'level');take(['voto','risultato','valutazione'],'result');if(!d.institution&&b[i])d.institution=b[i++];if(!d.title&&b[i])d.title=b[i++];if(!d.result){const r=b.find(x=>/\b\d{1,3}(?:[\/,]\d{1,3})?\b/.test(x));if(r)d.result=r;}if(i<b.length)d.notes=b.slice(i).join(' ');return d;}).filter(x=>Object.values(x).some(Boolean));
    const langSection=section(lines,['capacità e competenze personali','competenze personali','lingue']);
    c.languages=[]; for(let i=0;i<langSection.length;i++){const x=langSection[i];if(/madrelingua/i.test(x)){c.languages.push({language:norm(x.replace(/madrelingua[:\-]?/i,''))||'Madrelingua',reading:'Nativo',writing:'Nativo',speaking:'Nativo'});continue;}if(/inglese|francese|spagnolo|tedesco|italiano|portoghese|rumeno|arabo/i.test(x)){const n={language:x,reading:'',writing:'',speaking:''};let j=i+1;for(;j<Math.min(i+6,langSection.length);j++){const y=langSection[j];const m=y.match(/(?:capacità di )?(lettura|scrittura|espressione orale)\s*:?\s*(.*)/i);if(m)n[m[1].toLowerCase()==='espressione orale'?'speaking':m[1].toLowerCase()==='scrittura'?'writing':'reading']=norm(m[2]);}c.languages.push(n);}}
    c.skills={relational:section(lines,H.relational).join(' '),organizational:section(lines,H.organizational).join(' '),technical:section(lines,H.technical).join(' '),artistic:section(lines,H.artistic).join(' '),other:''};
    c.certifications=blocks(section(lines,H.certifications)).map(b=>({title:b[0]||'',issuer:'',period:'',notes:b.slice(1).join(' ')})).filter(x=>x.title||x.notes);
    c.scientific={publications:section(lines,['pubblicazioni']).join(' '),congresses:section(lines,['congressi','relazioni','comunicazioni']).join(' '),teaching:section(lines,['docenze','attività didattica','attivita didattica']).join(' '),research:section(lines,['ricerca']).join(' ')};
    c.driving=section(lines,H.driving).join(' '); c.additional=section(lines,H.additional).join(' ');
    const name=label(lines,['nome e cognome','nominativo','nome'])||lines.slice(0,15).find(x=>/^(?:[A-ZÀ-ÖØ-Ý][A-Za-zÀ-ÖØ-öø-ÿ'’-]+\s+){1,3}[A-ZÀ-ÖØ-Ý][A-Za-zÀ-ÖØ-öø-ÿ'’-]+$/.test(x))||'';
    const role=label(lines,['qualifica','professione','ruolo','professionalità','professionalita'])||'';
    const specialty=label(lines,['specializzazione','specialità','specialita','area di competenza'])||'';
    return {name,role,specialty,bio:c.profile||lines.find(x=>x.length>100&&x!==name&&x!==role)||'',curriculum:c};
  }

  function up(id,v){const el=$(id);if(el&&v!=null)el.value=v;}
  function clearRows(id){$(id)?.querySelectorAll('.team-repeat').forEach(r=>r.remove());}
  function clickAdd(id){$(id)?.querySelector('.team-add')?.click();}
  function putRow(id,vals,index){const box=$(id);if(!box)return;const add=box.querySelector('.team-add'); if(add){add.click();} const rows=box.querySelectorAll('.team-repeat'); const r=rows[rows.length-1]; if(!r)return; Object.entries(vals).forEach(([k,v])=>{const input=r.querySelector(`[id$="-${k}"]`);if(input)input.value=v||'';});}
  function importData(d,status){
    up('team-name',d.name);up('team-role',d.role);up('team-specialty',d.specialty);up('team-bio',d.bio);
    const c=d.curriculum||empty(); ['address','phone','email','nationality','birth_date'].forEach(k=>up('cv-'+k,c.personal?.[k]||'')); up('cv-profile',c.profile||'');
    ['relational','organizational','technical','artistic','other'].forEach(k=>up('cv-skill-'+k,c.skills?.[k]||'')); ['publications','congresses','teaching','research'].forEach(k=>up('cv-'+k,c.scientific?.[k]||''));up('cv-driving',c.driving||'');up('cv-additional',c.additional||'');up('cv-consent',c.consent||'');
    clearRows('experience-list'); (c.experiences||[]).forEach(x=>putRow('experience-list',{'from':x.from,'to':x.to,'organization':x.organization,'address':x.address,'sector':x.sector,'role':x.role,'responsibilities':x.responsibilities}));
    clearRows('education-list'); (c.education||[]).forEach(x=>putRow('education-list',{'from':x.from,'to':x.to,'institution':x.institution,'title':x.title,'level':x.level,'result':x.result,'notes':x.notes}));
    clearRows('languages-list'); (c.languages||[]).forEach(x=>putRow('languages-list',{language:x.language,reading:x.reading,writing:x.writing,speaking:x.speaking}));
    clearRows('certifications-list'); (c.certifications||[]).forEach(x=>putRow('certifications-list',{title:x.title,issuer:x.issuer,period:x.period,notes:x.notes}));
    const summary=[`${c.experiences?.length||0} esperienze`,`${c.education?.length||0} formazioni`,`${c.languages?.length||0} lingue`,`${c.certifications?.length||0} certificazioni`].join(' · '); if(status){status.textContent=`CV importato: ${summary}. Controlla e completa prima di salvare.`;status.style.color='#145cff';}
  }
  async function run(file){const status=$('team-cv-import-status'),btn=$('team-cv-import-btn');try{if(file.type!=='application/pdf'&&!/\.pdf$/i.test(file.name))throw new Error('Seleziona un file PDF.');if(file.size>15*1024*1024)throw new Error('Il PDF supera il limite di 15 MB.');if(btn)btn.disabled=true;const raw=await extract(file,status);if(raw.replace(/\s/g,'').length<80)throw new Error('Il PDF non contiene testo selezionabile: sembra una scansione. Serve OCR o inserimento manuale.');importData(parse(raw),status);document.querySelector('#team-editor')?.scrollIntoView({behavior:'smooth',block:'start'});}catch(e){if(status){status.textContent=e.message||'Impossibile importare il curriculum.';status.style.color='#b42318';}console.error('Team CV import',e);}finally{if(btn)btn.disabled=false;}}
  function bind(){const btn=$('team-cv-import-btn'),input=$('team-cv-import-file');if(!btn||!input||btn.dataset.bound==='1')return;btn.dataset.bound='1';btn.addEventListener('click',()=>input.click());input.addEventListener('change',()=>{const f=input.files?.[0];if(f)run(f);input.value='';});}
  window.BrunianoTeamCvReady=bind;
  const mo=new MutationObserver(bind); mo.observe(document.body,{childList:true,subtree:true}); bind();
})();