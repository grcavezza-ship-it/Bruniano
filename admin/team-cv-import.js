(() => {
  const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs';
  const WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
  let pdfjsPromise;

  const $ = (id) => document.getElementById(id);
  const text = (v) => String(v || '').replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').trim();
  const set = (id, value) => { const el = $(id); if (el && value) el.value = value; };

  function loadPdfJs() {
    if (!pdfjsPromise) {
      pdfjsPromise = import(PDFJS).then(pdfjs => {
        pdfjs.GlobalWorkerOptions.workerSrc = WORKER;
        return pdfjs;
      });
    }
    return pdfjsPromise;
  }

  async function extractPdfText(file, status) {
    const pdfjs = await loadPdfJs();
    const bytes = new Uint8Array(await file.arrayBuffer());
    const pdf = await pdfjs.getDocument({ data: bytes }).promise;
    if (!pdf.numPages) throw new Error('Il PDF non contiene pagine.');
    const pages = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const lines = [];
      let current = '';
      let lastY = null;
      for (const item of content.items) {
        const str = text(item.str);
        if (!str) continue;
        const y = item.transform?.[5];
        if (lastY !== null && Math.abs(y - lastY) > 4) {
          if (current) lines.push(text(current));
          current = str;
        } else current += (current ? ' ' : '') + str;
        lastY = y;
      }
      if (current) lines.push(text(current));
      pages.push(lines.join('\n'));
      if (status) status.textContent = `Lettura curriculum… pagina ${i}/${pdf.numPages}`;
    }
    return pages.join('\n\n');
  }

  function cleanLines(raw) {
    return raw.split(/\r?\n/).map(text).filter(Boolean).filter(x => x.length < 180);
  }

  function findLabeled(raw, labels) {
    const re = new RegExp('(?:^|\\n)\\s*(?:' + labels.join('|') + ')\\s*[:\\-–]?\\s*(.+)', 'im');
    const m = raw.match(re);
    return m ? text(m[1]) : '';
  }

  function section(raw, heads) {
    const lines = raw.split(/\r?\n/);
    const start = lines.findIndex(l => heads.some(h => new RegExp('^\\s*' + h + '\\s*[:\\-–]?\\s*$', 'i').test(l)) || heads.some(h => new RegExp('^\\s*' + h + '\\b', 'i').test(l)));
    if (start < 0) return '';
    const stopWords = /^(profilo professionale|profilo|formazione|istruzione|educazione|esperienza professionale|esperienze|esperienza|attività professionale|certificazioni|competenze|titoli|master|corsi|abilitazioni|ordine professionale|contatti|lingue|pubblicazioni|privacy)$/i;
    const out=[];
    for (let i=start+1; i<lines.length; i++) {
      const l=text(lines[i]);
      if (l && stopWords.test(l)) break;
      if (l) out.push(l);
    }
    return text(out.join(' '));
  }

  function parseCv(raw) {
    const lines = cleanLines(raw);
    const low = raw.toLowerCase();
    let name = findLabeled(raw, ['nome e cognome','nome','cognome']);
    if (!name) {
      name = lines.slice(0, 8).find(x => /^(?:[A-ZÀ-ÖØ-Ý][a-zà-öø-ÿ'’-]+\s+){1,3}[A-ZÀ-ÖØ-Ý][a-zà-öø-ÿ'’-]+$/.test(x)) || '';
    }

    let role = findLabeled(raw, ['qualifica','professione','ruolo','professionalità']);
    if (!role) role = lines.find(x => /\b(medico|fisioterapista|nutrizionista|dietista|osteopata|logopedista|psicologo|psicoterapeuta|cardiologo|ortopedico|neurologo|ginecologo|dermatologo|radiologo|odontoiatra|infermiere|podologo|biologo)\b/i.test(x) && x.length < 120) || '';

    let specialty = findLabeled(raw, ['specializzazione','specialità','area di competenza','settore']);
    if (!specialty && role) specialty = text(role.replace(/^(medico\s*(chirurgo)?|dott\.|dottore)\s*[-–:]?\s*/i, ''));

    const profile = section(raw, ['PROFILO PROFESSIONALE','PROFILO','PRESENTAZIONE','CHI SONO','SUMMARY','ABOUT']);
    const training = section(raw, ['FORMAZIONE','ISTRUZIONE','EDUCAZIONE','FORMAZIONE ACCADEMICA','STUDI']);
    const experience = section(raw, ['ESPERIENZA PROFESSIONALE','ESPERIENZE PROFESSIONALI','ESPERIENZA','ATTIVITÀ PROFESSIONALE','ATTIVITA PROFESSIONALE']);
    const certifications = section(raw, ['CERTIFICAZIONI E COMPETENZE','CERTIFICAZIONI','COMPETENZE','TITOLI E CERTIFICAZIONI','MASTER','CORSI']);

    const email = (raw.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i) || [])[0] || '';
    const phone = (raw.match(/(?:\+39\s*)?(?:\d[\s.-]?){8,12}\d/) || [])[0] || '';

    let bio = profile;
    if (!bio) {
      const candidates = lines.filter(x => x !== name && x !== role && x !== specialty && !/@/.test(x) && !/^(tel|telefono|email|mail|curriculum|curriculum vitae|cv)$/i.test(x));
      bio = candidates.find(x => x.length >= 80) || '';
    }
    bio = text(bio).slice(0, 900);

    const confidence = {
      name: !!name, role: !!role, specialty: !!specialty,
      profile: !!profile, training: !!training, experience: !!experience, certifications: !!certifications
    };
    return { name, role, specialty, profile, training, experience, certifications, bio, email, phone, confidence };
  }

  function addUi(form) {
    if (form.querySelector('#team-cv-import-box')) return;
    const box = document.createElement('div');
    box.id = 'team-cv-import-box';
    box.className = 'form-card note';
    box.style.margin = '12px 0 16px';
    box.innerHTML = '<div style="display:flex;justify-content:space-between;gap:14px;align-items:center;flex-wrap:wrap"><div><strong>Importa curriculum</strong><div style="font-size:11px;color:#657083;margin-top:4px">Carica il PDF e compilo automaticamente la scheda. La foto del professionista resta separata.</div></div><button type="button" class="mini" id="team-cv-import-btn">Carica CV in PDF</button></div><input id="team-cv-import-file" type="file" accept="application/pdf,.pdf" hidden><div id="team-cv-import-status" style="display:block;margin-top:8px;color:#657083;font-size:10px"></div>';
    const firstRow = form.querySelector('.form-row');
    form.insertBefore(box, firstRow || form.firstChild);
    const btn = $('#team-cv-import-btn');
    const input = $('#team-cv-import-file');
    btn.addEventListener('click', () => input.click());
    input.addEventListener('change', () => input.files[0] && runImport(input.files[0]));
  }

  async function runImport(file) {
    const status = $('team-cv-import-status');
    const btn = $('team-cv-import-btn');
    try {
      if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) throw new Error('Seleziona un file PDF.');
      if (file.size > 15 * 1024 * 1024) throw new Error('Il PDF supera il limite di 15 MB.');
      btn.disabled = true;
      status.textContent = 'Preparazione…';
      const raw = await extractPdfText(file, status);
      if (raw.replace(/\s/g,'').length < 80) throw new Error('Non riesco a estrarre testo da questo PDF. Potrebbe essere una scansione: in quel caso compila i campi manualmente.');
      const data = parseCv(raw);
      if (!Object.values(data.confidence).some(Boolean)) throw new Error('Non ho trovato informazioni strutturate nel curriculum.');

      set('team-name', data.name);
      set('team-role', data.role);
      set('team-specialty', data.specialty);
      set('team-bio', data.bio);
      set('cv-profile', data.profile);
      set('cv-training', data.training);
      set('cv-experience', data.experience);
      set('cv-certifications', data.certifications);

      const found = Object.values(data.confidence).filter(Boolean).length;
      status.textContent = `Importazione completata: ${found}/7 campi rilevati. Controlla i dati prima di salvare.`;
      status.style.color = '#145cff';
      const form = $('team-editor');
      form?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) {
      status.textContent = e.message || 'Impossibile importare il curriculum.';
      status.style.color = '#b42318';
    } finally {
      btn.disabled = false;
    }
  }

  function observe() {
    const root = document.body;
    const scan = () => {
      const form = $('team-editor');
      if (form) addUi(form);
    };
    scan();
    new MutationObserver(scan).observe(root, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', observe, { once: true });
  else observe();
})();
