(() => {
  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = 'modules.css';
  document.head.appendChild(style);

  const content = document.getElementById('app-content');
  const sidebar = document.getElementById('sidebar');
  const modal = document.getElementById('modal');
  const form = document.getElementById('appointment-form');
  const modalTitle = modal?.querySelector('h2');
  const modalIntro = modal?.querySelector('.modal-intro');

  const professionals = [
    { id: 'lucabianchi', name: 'Dott. Luca Bianchi', short: 'Luca Bianchi', color: 'blue' },
    { id: 'chiaraferri', name: 'Dott.ssa Chiara Ferri', short: 'Chiara Ferri', color: 'violet' }
  ];

  const treatments = [
    { id: 'fisioterapia', name: 'Fisioterapia', duration: 60 },
    { id: 'tecar', name: 'Tecar', duration: 45 },
    { id: 'laser', name: 'Laser', duration: 60 },
    { id: 'riabilitazione', name: 'Riabilitazione', duration: 60 }
  ];

  const appointments = [
    { id: 1, time: '09:00', end: '10:00', patient: 'Mario Rossi', treatment: 'Fisioterapia', professional: 'Dott. Luca Bianchi', status: 'confirmed', color: 'blue' },
    { id: 2, time: '10:00', end: '10:45', patient: 'Anna Esposito', treatment: 'Tecar', professional: 'Dott.ssa Chiara Ferri', status: 'confirmed', color: 'violet' },
    { id: 3, time: '12:00', end: '13:00', patient: 'Giuseppe Romano', treatment: 'Laser', professional: 'Dott.ssa Chiara Ferri', status: 'pending', color: 'amber' },
    { id: 4, time: '14:00', end: '15:00', patient: 'Francesca Russo', treatment: 'Riabilitazione', professional: 'Dott. Luca Bianchi', status: 'confirmed', color: 'green' }
  ];

  const state = { view: 'dashboard', date: new Date('2026-09-02T12:00:00'), calendarMode: 'week', professional: 'all', editingId: null };

  const titles = {
    dashboard: ['Dashboard', 'Panoramica'], agenda: ['Agenda', 'Agenda'], appointments: ['Appuntamenti', 'Gestione appuntamenti'],
    patients: ['Pazienti', 'Anagrafica'], professionals: ['Professionisti', 'Team clinico'], treatments: ['Trattamenti', 'Servizi e durata'],
    promotions: ['Promozioni', 'Offerte'], content: ['Sito e contenuti', 'Contenuti'], reviews: ['Recensioni', 'Google'],
    users: ['Amministrazione', 'Utenti e ruoli'], settings: ['Amministrazione', 'Impostazioni']
  };

  const formatDate = date => new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }).format(date);
  const formatDay = date => new Intl.DateTimeFormat('it-IT', { weekday: 'short', day: 'numeric' }).format(date).replace('.', '');
  const pad = n => String(n).padStart(2, '0');

  function statusLabel(status) {
    return ({ confirmed: 'Confermato', pending: 'Da confermare', completed: 'Completato', cancelled: 'Cancellato', noshow: 'No-show' })[status] || status;
  }

  function dashboardMarkup() {
    return `<div class="page-head"><div><p class="eyebrow">CONTROL CENTER</p><h1>Buon pomeriggio.</h1><p class="lead">Ecco cosa succede oggi al Centro Medico Bruniano.</p></div><button class="primary" id="quick-appointment">+ Nuovo appuntamento</button></div>
      <div class="stats"><article class="stat-card"><span>OGGI</span><strong>${appointments.filter(a => a.status !== 'cancelled').length}</strong><small>appuntamenti</small><em>↑ 2 rispetto a ieri</em></article><article class="stat-card"><span>IN ATTESA</span><strong>${appointments.filter(a => a.status === 'pending').length}</strong><small>da confermare</small><em class="neutral">Da gestire</em></article><article class="stat-card"><span>DISPONIBILITÀ</span><strong>11</strong><small>slot liberi oggi</small><em class="neutral">Tra tutti i professionisti</em></article><article class="stat-card"><span>NUOVI PAZIENTI</span><strong>6</strong><small>questa settimana</small><em>↑ 18%</em></article></div>
      <div class="grid-main"><section class="panel agenda-preview"><div class="panel-head"><div><span class="eyebrow">AGENDA</span><h2>Oggi · Mercoledì 2 settembre</h2></div><button class="text-button" data-view-link="agenda">Apri agenda →</button></div><div class="timeline">${appointments.map(a => appointmentRow(a)).join('')}<div class="time-row"><time>11:00</time><div class="slot free" data-new-time="11:00"><span class="slot-line"></span><div><strong>Slot disponibile</strong><small>Dott. Luca Bianchi</small></div><button class="mini">Prenota</button></div></div><div class="time-row"><time>13:00</time><div class="slot lunch"><span class="slot-line"></span><div><strong>Pausa</strong><small>Agenda chiusa</small></div></div></div></div></section><aside class="side-stack"><section class="panel quick-panel"><div class="panel-head"><div><span class="eyebrow">DA FARE</span><h2>Attività</h2></div><span class="counter">4</span></div><div class="task"><span class="task-dot amber"></span><div><strong>Confermare appuntamenti</strong><small>1 richiesta in attesa</small></div><button data-view-link="appointments">→</button></div><div class="task"><span class="task-dot blue-dot"></span><div><strong>Nuovo contatto WhatsApp</strong><small>18 min fa</small></div><button>→</button></div><div class="task"><span class="task-dot green-dot"></span><div><strong>Nuova recensione</strong><small>Da verificare</small></div><button data-view-link="reviews">→</button></div><div class="task"><span class="task-dot grey-dot"></span><div><strong>Promozione in scadenza</strong><small>Tra 4 giorni</small></div><button data-view-link="promotions">→</button></div></section><section class="panel today-card"><span class="eyebrow">PROSSIMO</span><strong>Anna Esposito</strong><small>Tecar · 10:00</small><div class="progress"><span style="width:58%"></span></div><small>Fra 24 minuti</small></section></aside></div>
      <section class="panel recent"><div class="panel-head"><div><span class="eyebrow">ATTIVITÀ RECENTI</span><h2>Ultime operazioni</h2></div></div><div class="activity-list"><div><span class="activity-avatar">MR</span><p><strong>Mario Rossi</strong> · appuntamento confermato<small>oggi, 08:42</small></p><b>Agenda</b></div><div><span class="activity-avatar blue-bg">CF</span><p><strong>Chiara Ferri</strong> ha modificato un appuntamento<small>oggi, 08:31</small></p><b>Agenda</b></div><div><span class="activity-avatar amber-bg">GS</span><p><strong>Gestore</strong> ha pubblicato una promozione<small>ieri, 18:10</small></p><b>Contenuti</b></div></div></section>`;
  }

  function appointmentRow(a) {
    return `<div class="time-row"><time>${a.time}</time><button class="slot busy ${a.color}" data-appointment-id="${a.id}"><span class="slot-line"></span><div><strong>${a.patient}</strong><small>${a.treatment} · ${a.professional}</small></div><b>${a.time}–${a.end}</b><span class="status-chip ${a.status}">${statusLabel(a.status)}</span></button></div>`;
  }

  function agendaMarkup() {
    const base = new Date(state.date);
    const monday = new Date(base);
    const day = monday.getDay() || 7;
    monday.setDate(monday.getDate() - day + 1);
    const days = Array.from({ length: 5 }, (_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return d; });
    const times = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];
    const filtered = state.professional === 'all' ? appointments : appointments.filter(a => a.professional === professionals.find(p => p.id === state.professional)?.name);
    return `<div class="page-head agenda-head"><div><p class="eyebrow">AGENDA OPERATIVA</p><h1>Agenda</h1><p class="lead">Organizza la giornata, controlla le disponibilità e gestisci gli appuntamenti.</p></div><button class="primary" id="quick-appointment">+ Nuovo appuntamento</button></div>
      <section class="panel agenda-toolbar"><div class="toolbar-left"><button class="seg active" data-mode="week">Settimana</button><button class="seg" data-mode="day">Giorno</button><button class="nav-arrow" data-date-move="-1">←</button><button class="nav-arrow" data-date-move="1">→</button><button class="today-btn" data-today>Oggi</button><strong>${formatDate(state.date)}</strong></div><div class="toolbar-right"><label class="filter-label">Professionista<select id="professional-filter"><option value="all">Tutti</option>${professionals.map(p => `<option value="${p.id}" ${state.professional === p.id ? 'selected' : ''}>${p.short}</option>`).join('')}</select></label></div></section>
      <section class="agenda-card panel"><div class="agenda-weekhead"><div class="week-spacer"></div>${days.map(d => `<div class="day-head-cell ${d.toDateString() === state.date.toDateString() ? 'selected' : ''}"><small>${formatDay(d)}</small><strong>${d.getDate()}</strong></div>`).join('')}</div>
      <div class="agenda-body"><div class="time-col">${times.map(t => `<span>${t}</span>`).join('')}</div><div class="calendar-grid">${days.map(d => `<div class="day-column">${times.map(t => `<div class="grid-slot" data-new-date="${d.toISOString().slice(0,10)}" data-new-time="${t}"></div>`).join('')}${filtered.filter(a => a.time).map(a => `<button class="calendar-event ${a.color} ${a.status}" style="--row:${times.indexOf(a.time)+1};height:${Math.max(62, treatments.find(t => t.name === a.treatment)?.duration || 60) * 1.02}px" data-appointment-id="${a.id}"><span>${a.time}</span><strong>${a.patient}</strong><small>${a.treatment}</small></button>`).filter((_, idx) => days[idx % days.length]).join('')}</div>`).join('')}</div></div></section>
      <div class="agenda-legend"><span><i class="legend-dot blue"></i>Confermato</span><span><i class="legend-dot amber"></i>Da confermare</span><span><i class="legend-dot green"></i>Completato</span><span><i class="legend-dot violet"></i>Altro</span><span class="legend-note">Clicca su uno slot libero per prenotare</span></div>`;
  }

  function appointmentsMarkup() {
    const rows = appointments.map(a => `<tr><td><strong>${a.time}</strong><small>2 set</small></td><td><strong>${a.patient}</strong><small>Privato</small></td><td>${a.treatment}</td><td>${a.professional}</td><td><span class="status-chip ${a.status}">${statusLabel(a.status)}</span></td><td><button class="row-action" data-appointment-id="${a.id}">Apri</button></td></tr>`).join('');
    return `<div class="page-head"><div><p class="eyebrow">OPERATIVITÀ</p><h1>Appuntamenti</h1><p class="lead">Richieste, conferme e storico operativo del centro.</p></div><button class="primary" id="quick-appointment">+ Nuovo appuntamento</button></div>
      <section class="panel filters-panel"><div class="search-box"><span>⌕</span><input id="appointment-search" placeholder="Cerca paziente, trattamento o professionista…"></div><select><option>Tutti gli stati</option><option>Da confermare</option><option>Confermato</option><option>Completato</option><option>Cancellato</option></select><button class="secondary">Esporta</button></section>
      <section class="panel table-panel"><div class="panel-head"><div><span class="eyebrow">OGGI</span><h2>Mercoledì 2 settembre</h2></div><span class="counter">${appointments.length}</span></div><div class="table-wrap"><table><thead><tr><th>Ora</th><th>Paziente</th><th>Trattamento</th><th>Professionista</th><th>Stato</th><th></th></tr></thead><tbody id="appointments-body">${rows}</tbody></table></div></section>`;
  }

  function placeholderView(view) {
    const cfg = views[view] || titles.content;
    const cards = view === 'users' ? `<div class="module-grid"><article class="module-card"><span class="eyebrow">UTENTI</span><h3>Inviti e accessi</h3><p>Creazione utente tramite invito email, senza condividere password.</p><button class="secondary">+ Nuovo utente</button></article><article class="module-card"><span class="eyebrow">RUOLI</span><h3>Permessi</h3><p>Super Admin · Amministratore · Reception · Professionista.</p><button class="secondary">Gestisci ruoli</button></article><article class="module-card"><span class="eyebrow">SICUREZZA</span><h3>Sessioni</h3><p>Accessi recenti, ultimo login e revoca delle sessioni attive.</p><button class="secondary">Visualizza log</button></article></div>` : `<div class="module-grid"><article class="module-card"><span class="eyebrow">PROSSIMO MODULO</span><h3>Struttura pronta</h3><p>La sezione è stata predisposta senza modificare il sito pubblico.</p><button class="secondary" data-view-link="dashboard">Torna alla dashboard</button></article><article class="module-card"><span class="eyebrow">INTEGRAZIONE</span><h3>API condivise</h3><p>Il modulo potrà dialogare con il database e le API Bruniano quando definiremo il modello dati.</p></article><article class="module-card"><span class="eyebrow">STAGING</span><h3>Solo test</h3><p>Nessun dato reale viene scritto in questa prima versione.</p></article></div>`;
    content.innerHTML = `<div class="page-head"><div><p class="eyebrow">${cfg[0] || cfg.eyebrow}</p><h1>${cfg[1] || cfg.title}</h1><p class="lead">${(views[view] || {}).lead || 'Modulo predisposto per la prossima fase.'}</p></div><button class="primary" data-view-link="dashboard">← Dashboard</button></div>${cards}`;
  }

  function openAppointmentModal(opts = {}) {
    state.editingId = opts.id || null;
    modalTitle.textContent = state.editingId ? 'Modifica appuntamento' : 'Nuovo appuntamento';
    modalIntro.textContent = 'Prototipo operativo: le modifiche restano in memoria durante questa sessione di test.';
    const a = state.editingId ? appointments.find(x => x.id === state.editingId) : null;
    const patient = form?.querySelector('input[placeholder="Cerca paziente..."]');
    const date = form?.querySelector('input[type="date"]');
    const time = form?.querySelector('input[type="time"]');
    const selects = form?.querySelectorAll('select');
    const textarea = form?.querySelector('textarea');
    if (patient) patient.value = a?.patient || '';
    if (date) date.value = opts.date || '2026-09-02';
    if (time) time.value = opts.time || a?.time || '11:00';
    if (selects?.[0]) selects[0].innerHTML = professionals.map(p => `<option ${a?.professional === p.name ? 'selected' : ''}>${p.name}</option>`).join('');
    if (selects?.[1]) selects[1].innerHTML = treatments.map(t => `<option ${a?.treatment === t.name ? 'selected' : ''}>${t.name}</option>`).join('');
    if (textarea) textarea.value = '';
    modal.classList.add('open'); modal.setAttribute('aria-hidden','false');
    setTimeout(() => patient?.focus(), 40);
  }

  function closeModal() { modal?.classList.remove('open'); modal?.setAttribute('aria-hidden','true'); state.editingId = null; }

  function bindActions() {
    document.querySelectorAll('[data-view]').forEach(btn => btn.onclick = () => showView(btn.dataset.view));
    document.querySelectorAll('[data-view-link]').forEach(btn => btn.onclick = () => showView(btn.dataset.viewLink));
    document.getElementById('quick-appointment')?.addEventListener('click', () => openAppointmentModal());
    document.querySelectorAll('[data-appointment-id]').forEach(btn => btn.onclick = () => openAppointmentModal({ id: Number(btn.dataset.appointmentId) }));
    document.querySelectorAll('[data-new-time]').forEach(btn => btn.onclick = () => openAppointmentModal({ time: btn.dataset.newTime, date: btn.dataset.newDate || '2026-09-02' }));
    document.querySelectorAll('[data-date-move]').forEach(btn => btn.onclick = () => { state.date.setDate(state.date.getDate() + Number(btn.dataset.dateMove) * (state.calendarMode === 'week' ? 7 : 1)); render(); });
    document.querySelector('[data-today]')?.addEventListener('click', () => { state.date = new Date('2026-09-02T12:00:00'); render(); });
    document.querySelectorAll('[data-mode]').forEach(btn => btn.onclick = () => { state.calendarMode = btn.dataset.mode; render(); });
    document.getElementById('professional-filter')?.addEventListener('change', e => { state.professional = e.target.value; render(); });
    const search = document.getElementById('appointment-search');
    search?.addEventListener('input', () => { const q = search.value.toLowerCase(); document.querySelectorAll('#appointments-body tr').forEach(r => r.style.display = r.textContent.toLowerCase().includes(q) ? '' : 'none'); });
  }

  function showView(view) { state.view = view; const t = titles[view] || titles.dashboard; document.getElementById('breadcrumb').textContent = t[0]; document.getElementById('page-title').textContent = t[1]; location.hash = view === 'dashboard' ? '' : view; render(); sidebar?.classList.remove('open'); }

  function render() {
    if (state.view === 'dashboard') content.innerHTML = dashboardMarkup();
    else if (state.view === 'agenda') content.innerHTML = agendaMarkup();
    else if (state.view === 'appointments') content.innerHTML = appointmentsMarkup();
    else placeholderView(state.view);
    bindActions();
  }

  document.getElementById('modal-close')?.addEventListener('click', closeModal);
  document.getElementById('modal-cancel')?.addEventListener('click', closeModal);
  modal?.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  document.getElementById('mobile-menu')?.addEventListener('click', () => sidebar?.classList.toggle('open'));
  form?.addEventListener('submit', e => {
    e.preventDefault();
    const patient = form.querySelector('input[placeholder="Cerca paziente..."]')?.value.trim();
    const date = form.querySelector('input[type="date"]')?.value;
    const time = form.querySelector('input[type="time"]')?.value;
    const selects = form.querySelectorAll('select');
    const professional = selects[0]?.value || professionals[0].name;
    const treatment = selects[1]?.value || treatments[0].name;
    if (!patient || !date || !time) return;
    const duration = treatments.find(t => t.name === treatment)?.duration || 60;
    const endMinutes = Number(time.slice(0,2)) * 60 + Number(time.slice(3)) + duration;
    const end = `${pad(Math.floor(endMinutes / 60) % 24)}:${pad(endMinutes % 60)}`;
    if (state.editingId) {
      const a = appointments.find(x => x.id === state.editingId); if (a) Object.assign(a, { patient, time, end, professional, treatment });
    } else {
      appointments.push({ id: Date.now(), time, end, patient, professional, treatment, status: 'pending', color: 'amber' });
    }
    closeModal(); render();
  });

  const initial = location.hash.replace('#', '');
  showView(initial && titles[initial] ? initial : 'dashboard');
})();