(() => {
  const $ = (id) => document.getElementById(id);
  const TOOLBAR_ID = 'blog-editor-toolbar';

  async function ensureCloudinary() {
    if (window.BrunianoCloudinary?.uploadImage) return window.BrunianoCloudinary;
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'cloudinary-upload.js';
      script.async = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error('Impossibile caricare il caricatore immagini.'));
      document.head.appendChild(script);
    });
    if (!window.BrunianoCloudinary?.uploadImage) throw new Error('Caricatore Cloudinary non disponibile.');
    return window.BrunianoCloudinary;
  }

  function exec(command, value = null) {
    document.execCommand(command, false, value);
    $('blog-content')?.focus();
    document.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function insertImage(url, alt) {
    const editor = $('blog-content');
    if (!editor) return;
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
        if (!url) throw new Error('Cloudinary non ha restituito l’URL dell’immagine.');
        insertImage(url, info.original_filename || 'Immagine articolo Bruniano');
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

  function buildToolbar() {
    const editor = $('blog-content');
    if (!editor || document.getElementById(TOOLBAR_ID)) return;

    const toolbar = document.createElement('div');
    toolbar.id = TOOLBAR_ID;
    toolbar.className = 'blog-editor-toolbar';
    toolbar.innerHTML = `
      <button type="button" title="Grassetto" data-command="bold"><strong>B</strong></button>
      <button type="button" title="Corsivo" data-command="italic"><em>I</em></button>
      <button type="button" title="Sottolineato" data-command="underline"><u>U</u></button>
      <button type="button" title="Titolo H2" data-format="h2">H2</button>
      <button type="button" title="Titolo H3" data-format="h3">H3</button>
      <button type="button" title="Elenco puntato" data-command="insertUnorderedList">•</button>
      <button type="button" title="Elenco numerato" data-command="insertOrderedList">1.</button>
      <button type="button" title="Citazione" data-format="blockquote">“</button>
      <button type="button" title="Link" data-link="true">↗</button>
      <button type="button" title="Carica immagine da dispositivo" data-blog-image-upload>Immagine</button>
      <span class="blog-editor-spacer"></span>
      <span class="blog-editor-hint">Scrivi, formatta e inserisci immagini senza usare URL.</span>
    `;
    editor.parentNode.insertBefore(toolbar, editor);

    toolbar.addEventListener('mousedown', (event) => event.preventDefault());
    toolbar.addEventListener('click', (event) => {
      const commandButton = event.target.closest('[data-command]');
      const formatButton = event.target.closest('[data-format]');
      const linkButton = event.target.closest('[data-link]');
      const imageButton = event.target.closest('[data-blog-image-upload]');
      if (commandButton) exec(commandButton.dataset.command);
      if (formatButton) exec('formatBlock', formatButton.dataset.format);
      if (linkButton) {
        const url = window.prompt('Inserisci il link HTTPS');
        if (url) exec('createLink', url.trim());
      }
      if (imageButton) uploadBodyImage();
    });
  }

  function setup() {
    buildToolbar();
    const editor = $('blog-content');
    if (!editor) return;
    if (!editor.getAttribute('data-placeholder')) editor.setAttribute('data-placeholder', 'Inizia a scrivere l’articolo…');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup, { once: true });
  else setup();
})();
