(() => {
  const $ = (id) => document.getElementById(id);

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
    if (!window.BrunianoCloudinary?.uploadImage) {
      throw new Error('Caricatore Cloudinary non disponibile.');
    }
    return window.BrunianoCloudinary;
  }

  async function uploadBlogCover() {
    const button = $('blog-cover-upload');
    const input = $('blog-cover');
    const status = $('blog-cover-status');
    if (!button || !input || !status) return;

    button.disabled = true;
    button.textContent = 'Apertura…';
    status.textContent = 'Seleziona la foto dal tuo dispositivo.';

    try {
      const cloudinary = await ensureCloudinary();
      button.textContent = 'Caricamento…';
      await cloudinary.uploadImage((info) => {
        const url = info?.secure_url || info?.url || '';
        if (!url) throw new Error('Cloudinary non ha restituito l’URL dell’immagine.');
        input.value = url;
        status.textContent = `Immagine caricata correttamente: ${info.original_filename || 'foto copertina'}`;
        button.textContent = 'Sostituisci immagine';
      });
    } catch (error) {
      status.textContent = error?.message || 'Impossibile caricare l’immagine.';
      button.textContent = 'Carica immagine';
    } finally {
      button.disabled = false;
    }
  }

  document.addEventListener('click', (event) => {
    if (event.target.closest('#blog-cover-upload')) uploadBlogCover();
  });
})();
