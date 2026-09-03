(() => {
  const replacements = [
    ['Oppure premi “Carica media”. I file vengono ottimizzati e archiviati su Cloudinary.', 'Trascina qui foto e video oppure selezionali dal dispositivo.'],
    ['URL Cloudinary oppure carica un’immagine.', 'Scegli un’immagine dal dispositivo.'],
    ['Carica direttamente su Cloudinary.', 'Scegli un’immagine dal dispositivo.'],
    ['Carica dal PC: il file viene inviato a Cloudinary e nel database viene salvato solo il link.', 'Scegli la foto dal tuo dispositivo.'],
    ['Cloudinary non disponibile', 'Caricatore immagini non disponibile'],
    ['Cloudinary Widget non disponibile', 'Caricatore immagini non disponibile'],
    ['Caricatore Cloudinary non disponibile', 'Caricatore immagini non disponibile'],
    ['Caricamento Cloudinary', 'Caricamento immagine'],
    ['Backend collegato', 'Servizio collegato'],
    ['Backend non disponibile', 'Servizio non disponibile'],
    ['CMS dedicato', 'gestione promozioni'],
    ['verrà collegata al CMS dedicato prima della consegna.', 'è pronta per la pubblicazione.'],
    ['Scrivi, formatta e inserisci immagini senza usare URL.', 'Scrivi e formatta il tuo articolo.']
  ];

  function cleanNode(node) {
    if (node.nodeType !== Node.TEXT_NODE) return;
    let value = node.nodeValue;
    replacements.forEach(([from, to]) => { if (value.includes(from)) value = value.split(from).join(to); });
    if (value !== node.nodeValue) node.nodeValue = value;
  }

  function clean(root = document.body) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);
    nodes.forEach(cleanNode);
  }

  clean();
  new MutationObserver((mutations) => mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) cleanNode(node); else if (node.nodeType === Node.ELEMENT_NODE) clean(node);
  }))).observe(document.body, { childList: true, subtree: true });

  const nativeAlert = window.alert.bind(window);
  window.alert = (message) => {
    let text = String(message ?? '');
    replacements.forEach(([from, to]) => { if (text.includes(from)) text = text.split(from).join(to); });
    nativeAlert(text);
  };
})();
