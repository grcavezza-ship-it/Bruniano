(() => {
  const $ = (id) => document.getElementById(id);

  async function ensureCloudinary() {
    if (window.BrunianoCloudinary?.uploadImage) return window.BrunianoCloudinary;
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'cloudinary-upload.js';
      script.async = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error('Impossibile aprire il caricatore immagini.'));
      document.head.appendChild(script);
    });
    if (!window.BrunianoCloudinary?.uploadImage) throw new Error('Caricatore immagini non disponibile.');
    return window.BrunianoCloudinary;
  }

  function insertBodyImage(url, alt) {
    const editor = $('blog-content');
    if (!editor || !url) return;
    editor.focus();
    const selection = window.getSelection();
    const range = selection && selection.rangeCount ? selection.getRangeAt(0) : null;
    const image = document.createElement('img');
    image.src = url;
    image.alt = alt || 'Immagine articolo Bruniano';
    image.loading = 'lazy';
    image.decoding = 'async';
    if (range && editor.contains(range.commonAncestorContainer)) {
      range.deleteContents();
      range.insertNode(image);
      range.setStartAfter(image);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      editor.appendChild(image);
    }
    const spacer = document.createElement('p');
    spacer.innerHTML = '<br>';
    image.after(spacer);
    document.dispatchEvent(new Event('input', { bubbles: true }));
  }

  async function uploadBodyImage() {
    const button = document.querySelector('[data-blog-image-upload]');
    if (button) {
      button.disabled = true;
      button.textContent = 'Caricamento…';
    }
    try {
      const cloudinary = await ensureCloudinary();
      await cloudinary.uploadImage((info) => {
        const url = info?.secure_url || info?.url || '';
        if (!url) throw new Error('Impossibile utilizzare questa immagine.');
        insertBodyImage(url, info.original_filename || 'Immagine articolo Bruniano');
      });
    } catch (error) {
      window.alert(error?.message || 'Impossibile caricare l’immagine.');
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = 'Immagine';
      }
    }
  }

  function setupBodyImageButton() {
    if (document.body.dataset.blogBodyImageHook === '1') return;
    document.body.dataset.blogBodyImageHook = '1';
    document.addEventListener('click', (event) => {
      if (event.target.closest('[data-blog-image-upload]')) uploadBodyImage();
    });
  }

  function bootBlogShell() {
    const panel = $('panel-blog');
    const layout = panel?.querySelector('.blog-layout');
    const editorPane = layout?.children?.[0];
    const archivePane = layout?.children?.[1];
    const list = $('blog-list');
    const pageHead = panel?.querySelector('.page-head');
    const pageTitle = pageHead?.querySelector('h1');
    const pageLead = pageHead?.querySelector('.lead');
    const topTitle = $('page-title');
    const breadcrumb = $('breadcrumb');
    const newButton = $('new-post');
    const form = $('blog-form');

    if (!panel || !layout || !editorPane || !archivePane || !list || !pageHead) {
      window.setTimeout(bootBlogShell, 150);
      return;
    }
    if (panel.dataset.blogShellReady === '1') return;
    panel.dataset.blogShellReady = '1';

    const style = document.createElement('style');
    style.id = 'bruniano-blog-shell-v3';
    style.textContent = `
      #panel-blog[data-blog-mode="archive"] .blog-layout{display:block!important}
      #panel-blog[data-blog-mode="archive"] .blog-layout>div:first-child{display:none!important}
      #panel-blog[data-blog-mode="archive"] .blog-layout>div:nth-child(2){display:block!important;position:static!important;width:100%!important}
      #panel-blog[data-blog-mode="archive"] .archive-head{display:flex!important}
      #panel-blog[data-blog-mode="archive"] .blog-publish-card,
      #panel-blog[data-blog-mode="archive"] .blog-live-preview,
      #panel-blog[data-blog-mode="archive"] .blog-feedback-card{display:none!important}
      #panel-blog[data-blog-mode="archive"] .blog-insights{display:grid!important}

      #panel-blog[data-blog-mode="editor"] .blog-layout{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(290px,340px)!important;align-items:start!important;gap:24px!important}
      #panel-blog[data-blog-mode="editor"] .blog-layout>div:first-child{display:block!important;min-width:0!important}
      #panel-blog[data-blog-mode="editor"] .blog-layout>div:nth-child(2){display:flex!important;flex-direction:column!important;gap:18px!important;position:sticky!important;top:84px!important;min-width:0!important}
      #panel-blog[data-blog-mode="editor"] .archive-head,
      #panel-blog[data-blog-mode="editor"] #blog-list,
      #panel-blog[data-blog-mode="editor"] .blog-archive-tools,
      #panel-blog[data-blog-mode="editor"] .blog-insights{display:none!important}
      #panel-blog[data-blog-mode="editor"] .blog-publish-card,
      #panel-blog[data-blog-mode="editor"] .blog-live-preview,
      #panel-blog[data-blog-mode="editor"] .blog-feedback-card{display:block!important;width:100%!important;box-sizing:border-box!important}

      #panel-blog[data-blog-mode="editor"] .form-card{width:100%!important;box-sizing:border-box!important;overflow:visible!important}
      #panel-blog[data-blog-mode="editor"] #blog-form{display:block!important;width:100%!important;box-sizing:border-box!important}
      #panel-blog[data-blog-mode="editor"] #blog-form .form-row{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:18px!important}
      #panel-blog[data-blog-mode="editor"] #blog-form>label{display:block!important;width:100%!important;min-width:0!important}
      #panel-blog[data-blog-mode="editor"] #blog-form input,
      #panel-blog[data-blog-mode="editor"] #blog-form textarea,
      #panel-blog[data-blog-mode="editor"] #blog-content{box-sizing:border-box!important;max-width:100%!important}
      #panel-blog[data-blog-mode="editor"] #blog-content{min-height:520px!important;width:100%!important;overflow:auto!important;white-space:normal!important;line-height:1.75!important;padding:20px!important;border:1px solid #dfe5ed!important;border-top-left-radius:0!important;border-top-right-radius:0!important;background:#fff!important}
      #panel-blog[data-blog-mode="editor"] #blog-content p{margin:0 0 1em!important}
      #panel-blog[data-blog-mode="editor"] #blog-content h2{margin:1.4em 0 .6em!important;font-size:27px!important;line-height:1.25!important;color:#0a1528!important}
      #panel-blog[data-blog-mode="editor"] #blog-content h3{margin:1.25em 0 .55em!important;font-size:21px!important;line-height:1.3!important;color:#0a1528!important}
      #panel-blog[data-blog-mode="editor"] #blog-content ul,
      #panel-blog[data-blog-mode="editor"] #blog-content ol{padding-left:1.5em!important;margin:0 0 1em!important}
      #panel-blog[data-blog-mode="editor"] #blog-content blockquote{margin:1em 0!important;padding:13px 16px!important;border-left:4px solid #145cff!important;background:#f6f9ff!important;border-radius:0 12px 12px 0!important;color:#4b5563!important}
      #panel-blog[data-blog-mode="editor"] #blog-content img{display:block!important;max-width:100%!important;height:auto!important;border-radius:12px!important;margin:18px 0!important}
      #panel-blog[data-blog-mode="editor"] .blog-editor-toolbar{display:flex!important;align-items:center!important;flex-wrap:wrap!important;gap:5px!important;box-sizing:border-box!important;margin:0!important;border:1px solid #dfe5ed!important;border-bottom:0!important;border-radius:12px 12px 0 0!important;background:#f7f9fc!important;padding:10px 11px!important}
      #panel-blog[data-blog-mode="editor"] .blog-editor-toolbar+ .editor-content{border-top-left-radius:0!important;border-top-right-radius:0!important}
      #panel-blog[data-blog-mode="editor"] .blog-field-counts{display:flex!important;justify-content:space-between!important;gap:12px!important;margin:5px 0 12px!important;line-height:1.3!important;min-height:14px!important;align-items:flex-start!important}
      #panel-blog[data-blog-mode="editor"] .blog-form-actions{display:flex!important;align-items:center!important;flex-wrap:wrap!important;gap:12px!important}

      #panel-blog .blog-archive-tools{display:flex!important;align-items:center!important;gap:12px!important;flex-wrap:wrap!important;margin:0 0 16px!important;padding:14px 16px!important;background:#fff!important;border:1px solid #e3e8ef!important;border-radius:14px!important;box-shadow:0 8px 24px rgba(15,23,42,.04)!important}
      #panel-blog .blog-archive-summary{display:flex!important;align-items:center!important;gap:8px!important;margin-right:auto!important;font-size:12px!important;color:#667085!important}
      #panel-blog .blog-archive-summary strong{color:#0a1528!important;font-size:16px!important}
      #panel-blog .blog-archive-search{min-width:220px!important;max-width:340px!important;margin:0!important}
      #panel-blog .blog-archive-filter{min-width:150px!important;padding:10px 12px!important;border:1px solid #dfe5ed!important;border-radius:10px!important;background:#fff!important;color:#223047!important;font:inherit!important}
      #panel-blog[data-blog-mode="archive"] #blog-list{display:flex!important;flex-direction:column!important;gap:10px!important}
      #panel-blog[data-blog-mode="archive"] #blog-list .managed-item{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:18px!important;padding:17px 18px!important;border:1px solid #e3e8ef!important;border-radius:14px!important;background:#fff!important;box-shadow:0 7px 22px rgba(15,23,42,.035)!important;margin:0!important;min-width:0!important}
      #panel-blog[data-blog-mode="archive"] #blog-list .managed-item>div:first-child{min-width:0!important;flex:1 1 auto!important}
      #panel-blog[data-blog-mode="archive"] #blog-list .managed-item strong{display:block!important;font-size:15px!important;line-height:1.35!important;color:#0a1528!important;overflow-wrap:anywhere!important}
      #panel-blog[data-blog-mode="archive"] #blog-list .managed-item small{display:block!important;margin-top:6px!important;color:#7b8799!important;font-size:11px!important}
      #panel-blog[data-blog-mode="archive"] #blog-list .managed-actions{display:flex!important;align-items:center!important;gap:8px!important;flex:0 0 auto!important;flex-wrap:wrap!important}

      @media(max-width:1180px){
        #panel-blog[data-blog-mode="editor"] .blog-layout{grid-template-columns:minmax(0,1fr)!important}
        #panel-blog[data-blog-mode="editor"] .blog-layout>div:nth-child(2){position:static!important}
      }
      @media(max-width:900px){
        #panel-blog[data-blog-mode="editor"] #blog-form .form-row{grid-template-columns:minmax(0,1fr)!important}
      }
      @media(max-width:700px){
        #panel-blog .blog-archive-tools{align-items:stretch!important}
        #panel-blog .blog-archive-summary{width:100%!important;margin-right:0!important}
        #panel-blog .blog-archive-search{min-width:0!important;max-width:none!important;flex:1 1 100%!important}
        #panel-blog .blog-archive-filter{width:100%!important}
        #panel-blog[data-blog-mode="archive"] #blog-list .managed-item{align-items:flex-start!important;flex-direction:column!important;gap:12px!important}
        #panel-blog[data-blog-mode="archive"] #blog-list .managed-actions{width:100%!important}
        #panel-blog[data-blog-mode="archive"] #blog-list .managed-actions .mini{flex:1 1 auto!important}
        #panel-blog[data-blog-mode="editor"] #blog-content{min-height:420px!important}
      }
    `;
    document.head.appendChild(style);

    let archiveTools = $('blog-archive-tools-v3');
    if (!archiveTools) {
      archiveTools = document.createElement('div');
      archiveTools.id = 'blog-archive-tools-v3';
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
    }

    const search = $('blog-archive-search');
    const filter = $('blog-archive-filter');
    const count = $('blog-archive-count');
    const countLabel = $('blog-archive-label');

    function refreshArchive() {
      const query = String(search?.value || '').trim().toLowerCase();
      const mode = filter?.value || 'all';
      const items = Array.from(list.querySelectorAll('.managed-item'));
      let shown = 0;
      items.forEach((item) => {
        const text = item.textContent.toLowerCase();
        const published = /\bpubblicato\b/.test(text);
        const statusOk = mode === 'all' || (mode === 'published' ? published : !published);
        const queryOk = !query || text.includes(query);
        item.hidden = !(statusOk && queryOk);
        if (!item.hidden) shown += 1;
      });
      if (count) count.textContent = String(shown);
      if (countLabel) countLabel.textContent = shown === 1 ? 'articolo' : 'articoli';
    }

    function setMode(mode, context = '') {
      const editor = mode === 'editor';
      panel.dataset.blogMode = mode;
      if (pageTitle) pageTitle.textContent = editor ? (context === 'edit' ? 'Modifica articolo' : 'Nuovo articolo') : 'Articoli';
      if (pageLead) pageLead.textContent = editor
        ? 'Scrivi, impagina e pubblica il contenuto del blog.'
        : 'Gestisci gli articoli del centro e le relative statistiche.';
      if (topTitle) topTitle.textContent = editor ? (context === 'edit' ? 'Modifica articolo' : 'Nuovo articolo') : 'Articoli';
      if (breadcrumb) breadcrumb.textContent = 'Blog';
      if (newButton) newButton.hidden = editor;
      const back = $('blog-back');
      if (back) back.hidden = !editor;
      if (!editor) refreshArchive();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    let backButton = $('blog-back');
    if (!backButton) {
      backButton = document.createElement('button');
      backButton.id = 'blog-back';
      backButton.className = 'mini blog-back-button';
      backButton.type = 'button';
      backButton.textContent = '← Torna agli articoli';
      backButton.hidden = true;
      pageHead.appendChild(backButton);
      backButton.addEventListener('click', () => setMode('archive'));
    }

    search?.addEventListener('input', refreshArchive);
    filter?.addEventListener('change', refreshArchive);
    newButton?.addEventListener('click', () => setTimeout(() => setMode('editor', 'new'), 0));
    list.addEventListener('click', (event) => {
      if (event.target.closest('[data-edit-post]')) setTimeout(() => setMode('editor', 'edit'), 0);
    });
    $('cancel-post')?.addEventListener('click', () => setTimeout(() => setMode('archive'), 0));
    window.addEventListener('bruniano:blog-open', () => setMode('archive'));

    const listObserver = new MutationObserver(refreshArchive);
    listObserver.observe(list, { childList: true, subtree: true });

    const formObserver = new MutationObserver(() => {
      const postId = String($('blog-id')?.value || '').trim();
      if (postId && panel.dataset.blogMode !== 'editor') setMode('editor', 'edit');
    });
    if (form) formObserver.observe(form, { childList: true, subtree: true, attributes: true, attributeFilter: ['value'] });

    setMode('archive');
    refreshArchive();
    setupBodyImageButton();
  }

  setupBodyImageButton();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootBlogShell, { once: true });
  else bootBlogShell();
})();
