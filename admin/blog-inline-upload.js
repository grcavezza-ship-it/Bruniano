(() => {
  const $ = (id) => document.getElementById(id);
  const TOOLBAR_ID = 'blog-editor-toolbar';

  async function ensureCloudinary() {
    if (window.BrunianoCloudinary?.uploadImage) return window.BrunianoCloudinary;
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'cloudinary-upload.js'; script.async = true;
      script.onload = resolve; script.onerror = () => reject(new Error('Impossibile aprire il caricatore immagini.'));
      document.head.appendChild(script);
    });
    if (!window.BrunianoCloudinary?.uploadImage) throw new Error('Caricatore immagini non disponibile.');
    return window.BrunianoCloudinary;
  }

  function exec(command, value = null) {
    document.execCommand(command, false, value);
    $('blog-content')?.focus();
    document.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function insertImage(url, alt) {
    const editor = $('blog-content'); if (!editor) return;
    editor.focus();
    const selection = window.getSelection();
    const range = selection && selection.rangeCount ? selection.getRangeAt(0) : null;
    const image = document.createElement('img');
    image.src = url; image.alt = alt || 'Immagine articolo Bruniano'; image.loading = 'lazy'; image.decoding = 'async';
    if (range && editor.contains(range.commonAncestorContainer)) {
      range.deleteContents(); range.insertNode(image); range.setStartAfter(image); range.collapse(true); selection.removeAllRanges(); selection.addRange(range);
    } else editor.appendChild(image);
    const spacer = document.createElement('p'); spacer.innerHTML = '<br>'; image.after(spacer);
    document.dispatchEvent(new Event('input', { bubbles: true }));
  }

  async function uploadBodyImage() {
    const button = document.querySelector('[data-blog-image-upload]');
    if (button) { button.disabled = true; button.textContent = 'Caricamento…'; }
    try {
      const cloudinary = await ensureCloudinary();
      await cloudinary.uploadImage((info) => {
        const url = info?.secure_url || info?.url || '';
        if (!url) throw new Error('Impossibile utilizzare questa immagine.');
        insertImage(url, info.original_filename || 'Immagine articolo Bruniano');
      });
    } catch (error) { window.alert(error?.message || 'Impossibile caricare l’immagine.'); }
    finally { if (button) { button.disabled = false; button.textContent = 'Immagine'; } }
  }

  function buildToolbar() {
    const editor = $('blog-content'); if (!editor || document.getElementById(TOOLBAR_ID)) return;
    const toolbar = document.createElement('div'); toolbar.id = TOOLBAR_ID; toolbar.className = 'blog-editor-toolbar'; toolbar.setAttribute('aria-label','Strumenti articolo');
    toolbar.innerHTML = `
      <button type="button" title="Grassetto" data-command="bold"><strong>B</strong></button>
      <button type="button" title="Corsivo" data-command="italic"><em>I</em></button>
      <button type="button" title="Sottolineato" data-command="underline"><u>U</u></button>
      <button type="button" title="Titolo H2" data-format="h2">H2</button>
      <button type="button" title="Titolo H3" data-format="h3">H3</button>
      <button type="button" title="Elenco puntato" data-command="insertUnorderedList">•</button>
      <button type="button" title="Elenco numerato" data-command="insertOrderedList">1.</button>
      <button type="button" title="Citazione" data-format="blockquote">“</button>
      <button type="button" title="Inserisci link" data-link="true">↗</button>
      <button type="button" title="Inserisci immagine" data-blog-image-upload>Immagine</button>
      <span class="blog-editor-spacer"></span>
      <span class="blog-editor-hint">Scrivi e formatta il tuo articolo.</span>`;
    editor.parentNode.insertBefore(toolbar, editor);
    toolbar.addEventListener('mousedown', (event) => event.preventDefault());
    toolbar.addEventListener('click', (event) => {
      const commandButton = event.target.closest('[data-command]');
      const formatButton = event.target.closest('[data-format]');
      const linkButton = event.target.closest('[data-link]');
      const imageButton = event.target.closest('[data-blog-image-upload]');
      if (commandButton) exec(commandButton.dataset.command);
      if (formatButton) exec('formatBlock', formatButton.dataset.format);
      if (linkButton) { const url = window.prompt('Inserisci il link'); if (url) exec('createLink', url.trim()); }
      if (imageButton) uploadBodyImage();
    });
  }

  function setup() { buildToolbar(); const editor = $('blog-content'); if (editor && !editor.getAttribute('data-placeholder')) editor.setAttribute('data-placeholder','Inizia a scrivere l’articolo…'); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup, { once:true }); else setup();
})();

/* BRUNIANO — Blog CMS shell
   Front-end only: keeps the existing API, editor, uploads and save/delete flows untouched. */
(() => {
  const boot = () => {
    const panel = document.getElementById('panel-blog');
    const layout = panel?.querySelector('.blog-layout');
    const editorPane = layout?.children?.[0];
    const archivePane = layout?.children?.[1];
    const list = document.getElementById('blog-list');
    if (!panel || !layout || !editorPane || !archivePane || !list) { window.setTimeout(boot, 120); return; }
    if (panel.dataset.blogCmsShell === '1') return;
    panel.dataset.blogCmsShell = '1';

    const pageHead = panel.querySelector('.page-head');
    const pageH1 = pageHead?.querySelector('h1');
    const pageLead = pageHead?.querySelector('.lead');
    const newButton = document.getElementById('new-post');
    const backButton = document.getElementById('blog-back');
    const topPageTitle = document.getElementById('page-title');
    const topBreadcrumb = document.getElementById('breadcrumb');

    const style = document.createElement('style');
    style.id = 'bruniano-blog-cms-shell-style';
    style.textContent = `
      #panel-blog .blog-page-head-actions{display:flex;align-items:center;gap:10px}
      #panel-blog .blog-back-button{white-space:nowrap}
      #panel-blog .blog-layout{margin-top:10px}

      #panel-blog[data-blog-mode="archive"] .blog-layout{display:block}
      #panel-blog[data-blog-mode="archive"] .blog-layout>div:first-child{display:none}
      #panel-blog[data-blog-mode="archive"] .blog-layout>div:nth-child(2){display:block;position:static}
      #panel-blog[data-blog-mode="archive"] .archive-head{display:flex;margin:0 0 14px}
      #panel-blog[data-blog-mode="archive"] .blog-publish-card,
      #panel-blog[data-blog-mode="archive"] .blog-live-preview{display:none}

      #panel-blog[data-blog-mode="editor"] .blog-layout>div:first-child{display:block}
      #panel-blog[data-blog-mode="editor"] .blog-layout>div:nth-child(2){display:flex;flex-direction:column;gap:18px;position:sticky;top:84px}
      #panel-blog[data-blog-mode="editor"] .archive-head,
      #panel-blog[data-blog-mode="editor"] #blog-list,
      #panel-blog[data-blog-mode="editor"] .blog-archive-tools{display:none}
      #panel-blog[data-blog-mode="editor"] .blog-publish-card,
      #panel-blog[data-blog-mode="editor"] .blog-live-preview{display:block}

      #panel-blog .blog-archive-tools{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:0 0 16px;padding:14px 16px;background:#fff;border:1px solid #e3e8ef;border-radius:14px;box-shadow:0 8px 24px rgba(15,23,42,.04)}
      #panel-blog .blog-archive-summary{display:flex;align-items:center;gap:8px;margin-right:auto;font-size:12px;color:#667085}
      #panel-blog .blog-archive-summary strong{color:#0a1528;font-size:16px}
      #panel-blog .blog-archive-search{min-width:240px;max-width:340px;margin:0!important}
      #panel-blog .blog-archive-filter{min-width:150px;padding:10px 12px;border:1px solid #dfe5ed;border-radius:10px;background:#fff;color:#223047;font:inherit}

      #panel-blog[data-blog-mode="archive"] #blog-list .managed-item{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:17px 18px;border:1px solid #e3e8ef;border-radius:14px;background:#fff;box-shadow:0 7px 22px rgba(15,23,42,.035);margin-bottom:10px;transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease}
      #panel-blog[data-blog-mode="archive"] #blog-list .managed-item:hover{transform:translateY(-1px);border-color:#cbd6e5;box-shadow:0 12px 28px rgba(15,23,42,.06)}
      #panel-blog[data-blog-mode="archive"] #blog-list .managed-item>div:first-child{min-width:0}
      #panel-blog[data-blog-mode="archive"] #blog-list .managed-item strong{display:block;font-size:15px;line-height:1.35;color:#0a1528}
      #panel-blog[data-blog-mode="archive"] #blog-list .managed-item small{display:block;margin-top:6px;color:#7b8799;font-size:11px}
      #panel-blog[data-blog-mode="archive"] #blog-list .managed-actions{flex:0 0 auto}
      #panel-blog[data-blog-mode="archive"] #blog-list .managed-item[hidden]{display:none!important}

      #panel-blog[data-blog-mode="editor"] .form-card{box-shadow:0 12px 34px rgba(15,23,42,.055)}
      #panel-blog[data-blog-mode="editor"] #blog-title{font-size:22px}
      #panel-blog[data-blog-mode="editor"] .editor-content{min-height:520px;background:#fff}
      #panel-blog[data-blog-mode="editor"] .blog-publish-card{border-left:3px solid #145cff}

      @media(max-width:1000px){#panel-blog[data-blog-mode="editor"] .blog-layout>div:nth-child(2){position:static}}
      @media(max-width:700px){
        #panel-blog .blog-page-head-actions{width:100%;justify-content:flex-start}
        #panel-blog .blog-archive-tools{align-items:stretch}
        #panel-blog .blog-archive-summary{width:100%;margin-right:0}
        #panel-blog .blog-archive-search{min-width:0;max-width:none;flex:1 1 100%}
        #panel-blog .blog-archive-filter{width:100%}
        #panel-blog[data-blog-mode="archive"] #blog-list .managed-item{align-items:flex-start;flex-direction:column;gap:12px}
        #panel-blog[data-blog-mode="archive"] #blog-list .managed-actions{width:100%}
        #panel-blog[data-blog-mode="editor"] .editor-content{min-height:420px}
      }
    `;
    document.head.appendChild(style);

    const archiveTools = document.createElement('div');
    archiveTools.className = 'blog-archive-tools';
    archiveTools.innerHTML = `
      <div class="blog-archive-summary"><strong id="blog-archive-count">0</strong><span id="blog-archive-label">articoli</span></div>
      <input class="blog-archive-search" id="blog-archive-search" type="search" placeholder="Cerca un articolo…" aria-label="Cerca un articolo">
      <select class="blog-archive-filter" id="blog-archive-filter" aria-label="Filtra articoli">
        <option value="all">Tutti gli articoli</option>
        <option value="published">Pubblicati</option>
        <option value="draft">Bozze</option>
      </select>`;
    archivePane.insertBefore(archiveTools, list);

    const search = document.getElementById('blog-archive-search');
    const filter = document.getElementById('blog-archive-filter');
    const count = document.getElementById('blog-archive-count');
    const countLabel = document.getElementById('blog-archive-label');

    function refreshArchive() {
      const query = String(search?.value || '').trim().toLowerCase();
      const mode = filter?.value || 'all';
      const items = Array.from(list.querySelectorAll('.managed-item'));
      let shown = 0;
      items.forEach(item => {
        const text = item.textContent.toLowerCase();
        const published = text.includes('pubblicato');
        const statusOk = mode === 'all' || (mode === 'published' ? published : !published);
        const queryOk = !query || text.includes(query);
        item.hidden = !(statusOk && queryOk);
        if (!item.hidden) shown += 1;
      });
      if (count) count.textContent = String(shown);
      if (countLabel) countLabel.textContent = shown === 1 ? 'articolo' : 'articoli';
    }

    search?.addEventListener('input', refreshArchive);
    filter?.addEventListener('change', refreshArchive);

    const listObserver = new MutationObserver(refreshArchive);
    listObserver.observe(list, { childList:true, subtree:true });

    function setBlogView(mode, context = '') {
      const editor = mode === 'editor';
      panel.dataset.blogMode = mode;
      if (pageH1) pageH1.textContent = editor ? (context === 'edit' ? 'Modifica articolo' : 'Nuovo articolo') : 'Articoli';
      if (pageLead) pageLead.textContent = editor ? 'Scrivi, ottimizza e pubblica il contenuto senza lasciare il gestionale.' : 'Gestisci gli articoli del centro, le bozze e i contenuti pubblicati.';
      if (newButton) newButton.hidden = editor;
      if (backButton) backButton.hidden = !editor;
      if (topPageTitle) topPageTitle.textContent = editor ? (context === 'edit' ? 'Modifica articolo' : 'Nuovo articolo') : 'Articoli';
      if (topBreadcrumb) topBreadcrumb.textContent = 'Blog';
      if (!editor) refreshArchive();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const openArchive = () => setBlogView('archive');
    const openNew = () => setTimeout(() => setBlogView('editor', 'new'), 0);
    const openEdit = () => setTimeout(() => setBlogView('editor', 'edit'), 0);

    document.querySelectorAll('[data-panel="blog"],[data-view-link="blog"]').forEach(btn => btn.addEventListener('click', openArchive));
    newButton?.addEventListener('click', openNew);
    backButton?.addEventListener('click', openArchive);
    list.addEventListener('click', event => { if (event.target.closest('[data-edit-post]')) openEdit(); });

    /* Prevent the two older editor initializers from creating duplicate toolbars. */
    const editor = document.getElementById('blog-content');
    if (editor?.parentElement) {
      const guard = new MutationObserver(() => {
        editor.parentElement.querySelectorAll('.blog-editor-toolbar').forEach(node => {
          if (node.id !== 'blog-editor-toolbar') node.remove();
        });
      });
      guard.observe(editor.parentElement, { childList:true });
      editor.parentElement.querySelectorAll('.blog-editor-toolbar').forEach(node => {
        if (node.id !== 'blog-editor-toolbar') node.remove();
      });
    }

    setBlogView('archive');
    refreshArchive();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
