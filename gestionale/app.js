(() => {
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

  function placeholderView(view) {
    const cfg = views[view] || views.content;
    const cards = view === 'users' ? `
      <div class="module-grid">
        <article class="module-card"><span class="eyebrow">UTENTI</span><h3>Inviti e accessi</h3><p>Creazione utente tramite invito email, senza condividere password.</p><button class="secondary">+ Nuovo utente</button></article>
        <article class="module-card"><span class="eyebrow">RUOLI</span><h3>Permessi</h3><p>Super Admin · Amministratore · Reception · Professionista.</p><button class="secondary">Gestisci ruoli</button></article>
        <article class="module-card"><span class="eyebrow">SICUREZZA</span><h3>Sessioni</h3><p>Accessi recenti, ultimo login e revoca delle sessioni attive.</p><button class="secondary">Visualizza log</button></article>` : `
      <div class="module-grid">
        <article class="module-card"><span class="eyebrow">PROSSIMO MODULO</span><h3>Struttura pronta</h3><p>La sezione è stata predisposta senza modificare il sito pubblico.</p><button class="secondary" data-view-link="dashboard">Torna alla dashboard</button></article>
        <article class="module-card"><span class="eyebrow">INTEGRAZIONE</span><h3>API condivise</h3><p>Il modulo potrà dialogare con il database e le API Bruniano quando definiremo il modello dati.</p></article>
        <article class="module-card"><span class="eyebrow">STAGING</span><h3>Solo test</h3><p>Nessun dato reale viene scritto in questa prima versione.</p></article>`;
    content.innerHTML = `<div class="page-head"><div><p class="eyebrow">${cfg.eyebrow}</p><h1>${cfg.title}</h1><p class="lead">${cfg.lead}</p></div><button class="primary" data-view-link="dashboard">← Dashboard</button></div>${cards}`;
  }

  function showView(view) {
    document.querySelectorAll('.nav-item').forEach(x => x.classList.toggle('active', x.dataset.view === view));
    const t = titles[view] || titles.dashboard;
    document.getElementById('breadcrumb').textContent = t[0];
    document.getElementById('page-title').textContent = t[1];
    if (view === 'dashboard') location.hash = '';
    else location.hash = view;
    if (view === 'dashboard') location.reload();
    else placeholderView(view);
    sidebar?.classList.remove('open');
    bindViewLinks();
  }

  function bindViewLinks() {
    document.querySelectorAll('[data-view]').forEach(btn => btn.onclick = () => showView(btn.dataset.view));
    document.querySelectorAll('[data-view-link]').forEach(btn => btn.onclick = () => showView(btn.dataset.viewLink));
  }

  document.getElementById('quick-appointment')?.addEventListener('click', openModal);
  document.getElementById('modal-close')?.addEventListener('click', closeModal);
  document.getElementById('modal-cancel')?.addEventListener('click', closeModal);
  modal?.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.getElementById('appointment-form')?.addEventListener('submit', e => { e.preventDefault(); closeModal(); alert('Prototipo: l’appuntamento non è stato salvato. Collegheremo questo flusso al database nella fase successiva.'); });
  document.getElementById('mobile-menu')?.addEventListener('click', () => sidebar?.classList.toggle('open'));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  bindViewLinks();

  const initial = location.hash.replace('#','');
  if (initial && views[initial]) showView(initial);
})();
