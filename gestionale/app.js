(() => {
  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = 'modules.css';
  document.head.appendChild(style);

  const titles = {
    dashboard: ['Dashboard','Panoramica'], agenda: ['Agenda','Agenda'], appointments: ['Appuntamenti','Gestione appuntamenti'], patients: ['Pazienti','Anagrafica'], professionals: ['Professionisti','Team clinico'], treatments: ['Trattamenti','Servizi e durata'], promotions: ['Promozioni','Offerte'], content: ['Sito e contenuti','Contenuti'], reviews: ['Recensioni','Google'], users: ['Amministrazione','Utenti e ruoli'], settings: ['Amministrazione','Impostazioni']
  };
  const views = {
    appointments: {eyebrow:'AGENDA', title:'Appuntamenti', lead:'Vista operativa degli appuntamenti e delle richieste da gestire.'},
    patients: {eyebrow:'ANAGRAFICA', title:'Pazienti', lead:'Area predisposta per l’anagrafica gestionale minima.'},
    professionals: {eyebrow:'TEAM', title:'Professionisti', lead:'Professionisti, disponibilità e collegamento con l’agenda.'},
    treatments: {eyebrow:'SERVIZI', title:'Trattamenti', lead:'Catalogo dei trattamenti utilizzato per la prenotazione.'},
    promotions: {eyebrow:'COMMERCIALE', title:'Promozioni', lead:'Gestione delle offerte pubblicate sul sito.'},
    content: {eyebrow:'CONTENUTI', title:'Sito e contenuti', lead:'Accesso rapido a Studio, Blog e media.'},
    reviews: {eyebrow:'FIDUCIA', title:'Recensioni', lead:'Connessione e gestione della presenza Google.'},
    users: {eyebrow:'SICUREZZA', title:'Utenti e ruoli', lead:'Gestione degli accessi al gestionale e dei relativi permessi.'},
    settings: {eyebrow:'CONFIGURAZIONE', title:'Impostazioni', lead:'Configurazioni operative del centro.'}
  };

  const content = document.getElementById('app-content');
  const sidebar = document.getElementById('sidebar');
  const modal = document.getElementById('modal');
  const openModal = () => { modal.classList.add('open'); modal.setAttribute('aria-hidden','false'); setTimeout(() => modal.querySelector('input')?.focus(), 40); };
  const closeModal = () => { modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); };

  function dashboardMarkup() {
    return `<div class="page-head"><div><p class="eyebrow">CONTROL CENTER</p><h1>Buon pomeriggio.</h1><p class="lead">Ecco cosa succede oggi al Centro Medico Bruniano.</p></div><button class="primary" id="quick-appointment">+ Nuovo appuntamento</button></div>
      <div class="stats"><article class="stat-card"><span>OGGI</span><strong>8</strong><small>appuntamenti</small><em>↑ 2 rispetto a ieri</em></article><article class="stat-card"><span>IN ATTESA</span><strong>3</strong><small>da confermare</small><em class="neutral">Da gestire</em></article><article class="stat-card"><span>DISPONIBILITÀ</span><strong>11</strong><small>slot liberi oggi</small><em class="neutral">Tra tutti i professionisti</em></article><article class="stat-card"><span>NUOVI PAZIENTI</span><strong>6</strong><small>questa settimana</small><em>↑ 18%</em></article></div>
      <div class="grid-main"><section class="panel agenda-preview"><div class="panel-head"><div><span class="eyebrow">AGENDA</span><h2>Oggi · Mercoledì 2 settembre</h2></div><button class="text-button" data-view-link="agenda">Apri agenda →</button></div><div class="timeline"><div class="time-row"><time>09:00</time><div class="slot busy"><span class="slot-line"></span><div><strong>Mario Rossi</strong><small>Fisioterapia · Dott. Luca Bianchi</small></div><b>09:00–10:00</b></div></div><div class="time-row"><time>10:00</time><div class="slot busy blue"><span class="slot-line"></span><div><strong>Anna Esposito</strong><small>Tecar · Dott.ssa Chiara Ferri</small></div><b>10:00–10:45</b></div></div><div class="time-row"><time>11:00</time><div class="slot free"><span class="slot-line"></span><div><strong>Slot disponibile</strong><small>Dott. Luca Bianchi</small></div><button class="mini">Prenota</button></div></div><div class="time-row"><time>12:00</time><div class="slot busy violet"><span class="slot-line"></span><div><strong>Giuseppe Romano</strong><small>Laser · Dott.ssa Chiara Ferri</small></div><b>12:00–13:00</b></div></div><div class="time-row"><time>13:00</time><div class="slot lunch"><span class="slot-line"></span><div><strong>Pausa</strong><small>Agenda chiusa</small></div></div></div><div class="time-row"><time>14:00</time><div class="slot busy green"><span class="slot-line"></span><div><strong>Francesca Russo</strong><small>Riabilitazione · Dott. Luca Bianchi</small></div><b>14:00–15:00</b></div></div></div></section><aside class="side-stack"><section class="panel quick-panel"><div class="panel-head"><div><span class="eyebrow">DA FARE</span><h2>Attività</h2></div><span class="counter">4</span></div><div class="task"><span class="task-dot amber"></span><div><strong>Confermare appuntamenti</strong><small>3 richieste in attesa</small></div><button>→</button></div><div class="task"><span class="task-dot blue-dot"></span><div><strong>Nuovo contatto WhatsApp</strong><small>Ricevuto 18 min fa</small></div><button>→</button></div><div class="task"><span class="task-dot green-dot"></span><div><strong>Nuova recensione</strong><small>Da verificare</small></div><button>→</button></div><div class="task"><span class="task-dot grey-dot"></span><div><strong>Promozione in scadenza</strong><small>Tra 4 giorni</small></div><button>→</button></div></section><section class="panel today-card"><span class="eyebrow">PROSSIMO</span><strong>Anna Esposito</strong><small>Tecar · 10:00</small><div class="progress"><span style="width:58%"></span></div><small>Fra 24 minuti</small></section></aside></div>
      <section class="panel recent"><div class="panel-head"><div><span class="eyebrow">ATTIVITÀ RECENTI</span><h2>Ultime operazioni</h2></div></div><div class="activity-list"><div><span class="activity-avatar">MR</span><p><strong>Mario Rossi</strong> · appuntamento completato<small>oggi, 08:42</small></p><b>Agenda</b></div><div><span class="activity-avatar blue-bg">CF</span><p><strong>Chiara Ferri</strong> ha modificato un appuntamento<small>oggi, 08:31</small></p><b>Agenda</b></div><div><span class="activity-avatar amber-bg">GS</span><p><strong>Gestore</strong> ha pubblicato una promozione<small>ieri, 18:10</small></p><b>Contenuti</b></div></div></section>`;
  }

  function placeholderView(view) {
    const cfg = views[view] || views.content;
    const cards = view === 'users' ? `<div class="module-grid"><article class="module-card"><span class="eyebrow">UTENTI</span><h3>Inviti e accessi</h3><p>Creazione utente tramite invito email, senza condividere password.</p><button class="secondary">+ Nuovo utente</button></article><article class="module-card"><span class="eyebrow">RUOLI</span><h3>Permessi</h3><p>Super Admin · Amministratore · Reception · Professionista.</p><button class="secondary">Gestisci ruoli</button></article><article class="module-card"><span class="eyebrow">SICUREZZA</span><h3>Sessioni</h3><p>Accessi recenti, ultimo login e revoca delle sessioni attive.</p><button class="secondary">Visualizza log</button></article></div>` : `<div class="module-grid"><article class="module-card"><span class="eyebrow">PROSSIMO MODULO</span><h3>Struttura pronta</h3><p>La sezione è stata predisposta senza modificare il sito pubblico.</p><button class="secondary" data-view-link="dashboard">Torna alla dashboard</button></article><article class="module-card"><span class="eyebrow">INTEGRAZIONE</span><h3>API condivise</h3><p>Il modulo potrà dialogare con il database e le API Bruniano quando definiremo il modello dati.</p></article><article class="module-card"><span class="eyebrow">STAGING</span><h3>Solo test</h3><p>Nessun dato reale viene scritto in questa prima versione.</p></article></div>`;
    content.innerHTML = `<div class="page-head"><div><p class="eyebrow">${cfg.eyebrow}</p><h1>${cfg.title}</h1><p class="lead">${cfg.lead}</p></div><button class="primary" data-view-link="dashboard">← Dashboard</button></div>${cards}`;
  }

  function bindStaticActions() {
    document.querySelectorAll('[data-view]').forEach(btn => btn.onclick = () => showView(btn.dataset.view));
    document.querySelectorAll('[data-view-link]').forEach(btn => btn.onclick = () => showView(btn.dataset.viewLink));
    document.getElementById('quick-appointment')?.addEventListener('click', openModal);
  }

  function showView(view) {
    document.querySelectorAll('.nav-item').forEach(x => x.classList.toggle('active', x.dataset.view === view));
    const t = titles[view] || titles.dashboard;
    document.getElementById('breadcrumb').textContent = t[0];
    document.getElementById('page-title').textContent = t[1];
    if (view === 'dashboard') {
      location.hash = '';
      content.innerHTML = dashboardMarkup();
    } else {
      location.hash = view;
      placeholderView(view);
    }
    sidebar?.classList.remove('open');
    bindStaticActions();
  }

  document.getElementById('modal-close')?.addEventListener('click', closeModal);
  document.getElementById('modal-cancel')?.addEventListener('click', closeModal);
  modal?.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.getElementById('appointment-form')?.addEventListener('submit', e => { e.preventDefault(); closeModal(); alert('Prototipo: l’appuntamento non è stato salvato. Collegheremo questo flusso al database nella fase successiva.'); });
  document.getElementById('mobile-menu')?.addEventListener('click', () => sidebar?.classList.toggle('open'));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  bindStaticActions();
  const initial = location.hash.replace('#','');
  if (initial && (views[initial] || initial === 'agenda')) showView(initial); else showView('dashboard');
})();