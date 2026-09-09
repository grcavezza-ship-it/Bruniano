(() => {
  const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs';
  const WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
  let pdfjsPromise;

  const $ = (id) => document.getElementById(id);
  const norm = (v) => String(v ?? '').replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').trim();
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
    const task = pdfjs.getDocument({ data: bytes, useWorkerFetch: true, isEvalSupported: true });
    const pdf = await task.promise;
    if (!pdf.numPages) throw new Error('Il PDF non contiene pagine.');

    const pages = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent({ normalizeWhitespace: true, disableCombineTextItems: false });
      const items = (content.items || [])
        .map(item => ({
          str: norm(item.str),
          x: Number(item.transform?.[4] || 0),
          y: Number(item.transform?.[5] || 0)
        }))
        .filter(item => item.str);

      items.sort((a, b) => {
        if (Math.abs(a.y - b.y) > 3) return b.y - a.y;
        return a.x - b.x;
      });

      const lines = [];
      for (const item of items) {
        const last = lines[lines.length - 1];
        if (last && Math.abs(last.y - item.y) <= 3) last.parts.push(item.str);
        else lines.push({ y: item.y, parts: [item.str] });
      }
      pages.push(lines.map(line => norm(line.parts.join(' '))).filter(Boolean).join('\n'));
      if (status) status.textContent = `Lettura curriculum… pagina ${i}/${pdf.numPages}`;
    }
    return pages.join('\n\n');
  }

  function cleanLines(raw) { return raw.split(/\r?\n/).map(norm).filter(Boolean); }
  function escapeRegExp(v) { return String(v).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  const LABELS = {
    name: ['nome e cognome','nominativo','nome'],
    role: ['qualifica','professione','ruolo','professionalità','professionalita'],
    specialty: ['specializzazione','specialità','specialita','area di competenza','settore']
  };

  function looksLikeHeading(line) {
    const all = Object.values(SECTION_ALIASES).flat().concat(['NOME E COGNOME','QUALIFICA','PROFESSIONE','SPECIALIZZAZIONE','AREA DI COMPETENZA','CONTATTI','EMAIL','TELEFONO','LINGUE','PUBBLICAZIONI','PRIVACY']);
    const clean = norm(line).replace(/[:\-–]+$/, '');
    if (all.some(h => clean.localeCompare(h, 'it', { sensitivity: 'base' }) === 0)) return true;
    return clean.length <= 60 && /^[A-ZÀ-ÖØ-Ý0-9][A-ZÀ-ÖØ-Ý0-9 .&/’'_-]+$/.test(clean) && !/[.!?]/.test(clean);
  }

  function findLabeled(lines, labels) {
    const labelRe = new RegExp(`^(?:${labels.map(escapeRegExp).join('|')})\\s*[:\\-–]?\\s*(.*)$`, 'i');
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(labelRe);
      if (!match) continue;
      const sameLine = norm(match[1]);
      if (sameLine) return sameLine;
      const next = lines[i + 1] || '';
      if (next && !looksLikeHeading(next)) return next;
    }
    return '';
  }

  const SECTION_ALIASES = {
    profile: ['PROFILO PROFESSIONALE','PROFILO','PRESENTAZIONE','CHI SONO','SUMMARY','ABOUT','PROFILO PERSONALE'],
    training: ['FORMAZIONE','ISTRUZIONE','EDUCAZIONE','FORMAZIONE ACCADEMICA','STUDI','ISTRUZIONE E FORMAZIONE'],
    experience: ['ESPERIENZA PROFESSIONALE','ESPERIENZE PROFESSIONALI','ESPERIENZA','ATTIVITÀ PROFESSIONALE','ATTIVITA PROFESSIONALE','ESPERIENZA LAVORATIVA','ESPERIENZE LAVORATIVE'],
    certifications: ['CERTIFICAZIONI E COMPETENZE','CERTIFICAZIONI','COMPETENZE','TITOLI E CERTIFICAZIONI','ABILITAZIONI','MASTER','CORSI','COMPETENZE PROFESSIONALI']
  };

  function section(lines, heads) {
    const normalizedHeads = heads.map(h => norm(h).toLowerCase());
    const start = lines.findIndex(line => {
      const clean = norm(line).replace(/[:\-–]+$/, '').toLowerCase();
      return normalizedHeads.some(h => clean === h || clean.startsWith(h + ' '));
    });
    if (start < 0) return '';
    const out = [];
    for (let i = start + 1; i < lines.length; i++) {
      const line = norm(lines[i]);
      if (!line) continue;
      if (looksLikeHeading(line)) {
        const clean = line.replace(/[:\-–]+$/, '').toLowerCase();
        const allHeadings = Object.values(SECTION_ALIASES).flat();
        if (allHeadings.some(h => clean === h.toLowerCase())) break;
      }
      out.push(line);
    }
    return norm(out.join(' '));
  }

  function parseCv(raw) {
    const lines = cleanLines(raw);
    let name = findLabeled(lines, LABELS.name);
    if (!name) name = lines.slice(0, 12).find(x => /^(?:[A-ZÀ-ÖØ-Ý][A-Za-zÀ-ÖØ-öø-ÿ'’-]+\s+){1,3}[A-ZÀ-ÖØ-Ý][A-Za-zÀ-ÖØ-öø-ÿ'’-]+$/.test(x)) || '';

    let role = findLabeled(lines, LABELS.role);
    if (!role) role = lines.find(x => /\b(medico|medica|fisioterapista|nutrizionista|dietista|osteopata|logopedista|psicologo|psicologa|psicoterapeuta|cardiologo|cardiologa|ortopedico|ortopedica|neurologo|neurologa|ginecologo|ginecologa|dermatologo|dermatologa|radiologo|radiologa|odontoiatra|infermiere|infermiera|podologo|podologa|biologo|biologa)\b/i.test(x) && x.length < 140) || '';

    let specialty = findLabeled(lines, LABELS.specialty);
    if (!specialty && role) specialty = norm(role.replace(/^(medico\s*(chirurgo)?|medica|dott\.?|dottoressa|dottore)\s*[-–:]?\s*/i, ''));

    const profile = section(lines, SECTION_ALIASES.profile);
    const training = section(lines, SECTION_ALIASES.training);
    const experience = section(lines, SECTION_ALIASES.experience);
    const certifications = section(lines, SECTION_ALIASES.certifications);

    const email = (raw.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i) || [])[0] || '';
    const phone = (raw.match(/(?:\+39[ .-]?)?(?:\d[ .-]?){8,12}\d/) || [])[0] || '';

    let bio = profile;
    if (!bio) {
      const candidates = lines.filter(x => x !== name && x !== role && x !== specialty && !/@/.test(x) && !/^(tel|telefono|email|mail|curriculum|curriculum vitae|cv)$/i.test(x));
      bio = candidates.find(x => x.length >= 90) || '';
    }
    bio = norm(bio).slice(0, 900);

    const confidence = { name: !!name, role: !!role, specialty: !!specialty, profile: !!profile, training: !!training, experience: !!experience, certifications: !!certifications };
    return { name, role, specialty, profile, training, experience, certifications, bio, email, phone, confidence };
  }

  function bindButton() {
    const btn = $('team-cv-import-btn');
    const input = $('team-cv-import-file');
    if (!btn || !input || btn.dataset.cvBound === '1') return;
    btn.dataset.cvBound = '1';
    btn.addEventListener('click', () => input.click());
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (file) await runImport(file);
      input.value = '';
    });
  }

  function addFallbackUi(form) {
    if (form.querySelector('#team-cv-import-btn')) { bindButton(); return; }
    const box = document.createElement('div');
    box.className = 'form-card note';
    box.style.margin = '12px 0 16px';
    box.innerHTML = '<strong>Importa dati dal CV</strong><span>Carica il curriculum PDF per compilare automaticamente la scheda.</span><div style="margin-top:10px"><button type="button" class="primary" id="team-cv-import-btn">Carica CV e compila</button><input id="team-cv-import-file" type="file" accept="application/pdf,.pdf" hidden><div id="team-cv-import-status" style="margin-top:8px;color:#657083;font-size:10px"></div></div>';
    form.insertBefore(box, form.firstChild);
    bindButton();
  }

  async function runImport(file) {
    const status = $('team-cv-import-status');
    const btn = $('team-cv-import-btn');
    try {
      if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) throw new Error('Seleziona un file PDF.');
      if (file.size > 15 * 1024 * 1024) throw new Error('Il PDF supera il limite di 15 MB.');
      if (btn) btn.disabled = true;
      if (status) { status.style.color = '#657083'; status.textContent = 'Apertura curriculum…'; }

      const raw = await extractPdfText(file, status);
      if (raw.replace(/\s/g, '').length < 80) throw new Error('Questo PDF non contiene testo selezionabile. Probabilmente è una scansione o un PDF composto da immagini.');

      const data = parseCv(raw);
      const found = Object.values(data.confidence).filter(Boolean).length;
      if (!found) throw new Error('Ho letto il PDF ma non riconosco una struttura di curriculum. Prova con il CV originale in PDF.');

      set('team-name', data.name);
      set('team-role', data.role);
      set('team-specialty', data.specialty);
      set('team-bio', data.bio);
      set('cv-profile', data.profile);
      set('cv-training', data.training);
      set('cv-experience', data.experience);
      set('cv-certifications', data.certifications);

      if (status) { status.textContent = `Importazione completata: ${found}/7 campi rilevati. Controlla i dati prima di salvare.`; status.style.color = '#145cff'; }
      $('team-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) {
      if (status) { status.textContent = e?.message || 'Impossibile importare il curriculum.'; status.style.color = '#b42318'; }
      console.error('Team CV import', e);
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  window.BrunianoTeamCvReady = bindButton;
  window.BrunianoTeamCvImport = { run: runImport };

  function observe() {
    const scan = () => {
      const form = $('team-editor');
      if (form) {
        if ($('team-cv-import-btn')) bindButton();
        else addFallbackUi(form);
      }
    };
    scan();
    new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', observe, { once: true });
  else observe();
})();
