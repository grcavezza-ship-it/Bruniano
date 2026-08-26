const state = { team: [], promos: [], blog: [] };

const $ = (id) => document.getElementById(id);
const esc = (value) => String(value ?? '').replace(/[&<>\"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[s]));

async function api(url, options = {}) {
  const response = await fetch(url, { headers: { 'content-type': 'application/json', ...(options.headers || {}) }, ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
  return data;
}

function setStatus(message, error = false) {
  $('system-status').textContent = message;
  $('system-status').style.color = error ? '#c0392b' : '';
}

function renderBlog() {
  const list = $('blog-list');
  list.innerHTML = state.blog.length ? state.blog.map(post => `
    <div class="managed-item">
      <div><strong>${esc(post.title)}</strong><small>${esc(post.category || 'Senza categoria')} · ${post.is_published ? 'Pubblicato' : 'Bozza'}</small></div>
      <div class="managed-actions">
        <button class="mini" data-edit-post="${post.id}">Modifica</button>
        <button class="mini" data-delete-post="${post.id}">Elimina</button>
      </div>
    </div>`).join('') : '<div class="form-card note">Nessun articolo presente. Crea il primo articolo dal pulsante + Nuovo articolo.</div>';
  $('count-blog').textContent = state.blog.filter(post => post.is_published).length;
}

function resetPostForm() {
  $('blog-form').reset();
  $('blog-id').value = '';
  $('blog-form-title').textContent = 'Nuovo articolo';
  $('blog-form-status').textContent = '';
  $('blog-content').innerHTML = '';
}

function fillPostForm(post) {
  $('blog-id').value = post.id;
  $('blog-title').value = post.title || '';
  $('blog-slug').value = post.slug || '';
  $('blog-category').value = post.category || '';
  $('blog-author').value = post.author || '';
  $('blog-published-at').value = post.published_at ? new Date(post.published_at).toISOString().slice(0,16) : '';
  $('blog-excerpt').value = post.excerpt || '';
  $('blog-content').innerHTML = post.content || '';
  $('blog-cover').value = post.cover_image_url || '';
  $('blog-meta').value = post.meta_description || '';
  $('blog-is-published').checked = Boolean(post.is_published);
  $('blog-form-title').textContent = 'Modifica articolo';
  document.querySelector('[data-panel="blog"]').click();
  window.scrollTo({ top: document.getElementById('panel-blog').offsetTop - 30, behavior: 'smooth' });
}

async function loadBlog() {
  try {
    const data = await api('/api/blog?admin=1');
    state.blog = data.items || [];
    renderBlog();
    setStatus('Backend collegato');
  } catch (error) {
    state.blog = [];
    renderBlog();
    setStatus('Backend non configurato', true);
  }
}

function ensureSelectionInsideEditor() {
  const editor = $('blog-content');
  if (document.activeElement !== editor && !editor.contains(document.activeElement)) editor.focus();
}

function execEditor(command, value = null) {
  ensureSelectionInsideEditor();
  document.execCommand(command, false, value);
  $('blog-content').focus();
}

function insertLink() {
  ensureSelectionInsideEditor();
  const url = prompt('Inserisci URL del link');
  if (!url) return;
  execEditor('createLink', url);
}

function insertImage() {
  ensureSelectionInsideEditor();
  const url = prompt('Inserisci URL dell\'immagine');
  if (!url) return;
  execEditor('insertImage', url);
}

function setupEditor() {
  document.querySelectorAll('.editor-btn').forEach(button => {
    button.addEventListener('mousedown', event => event.preventDefault());
    button.addEventListener('click', () => {
      const cmd = button.dataset.cmd;
      const block = button.dataset.block;
      const action = button.dataset.action;
      if (action === 'link') return insertLink();
      if (action === 'image') return insertImage();
      if (block) return execEditor('formatBlock', block);
      if (cmd === 'formatBlock') return execEditor(cmd, button.dataset.value);
      if (cmd) execEditor(cmd);
    });
  });

  $('blog-content').addEventListener('paste', event => {
    event.preventDefault();
    const text = event.clipboardData?.getData('text/plain') || '';
    execEditor('insertText', text);
  });

  $('blog-content').addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') {
      event.preventDefault();
      execEditor('bold');
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'i') {
      event.preventDefault();
      execEditor('italic');
    }
  });
}

async function savePost(event) {
  event.preventDefault();
  const status = $('blog-form-status');
  status.textContent = 'Salvataggio…';
  const content = $('blog-content').innerHTML.trim();
  $('blog-content-html').value = content;

  const payload = {
    id: $('blog-id').value || undefined,
    title: $('blog-title').value,
    slug: $('blog-slug').value,
    category: $('blog-category').value,
    author: $('blog-author').value,
    published_at: $('blog-published-at').value ? new Date($('blog-published-at').value).toISOString() : null,
    excerpt: $('blog-excerpt').value,
    content,
    cover_image_url: $('blog-cover').value,
    meta_description: $('blog-meta').value,
    is_published: $('blog-is-published').checked
  };

  try {
    const saved = await api('/api/blog', { method: payload.id ? 'PUT' : 'POST', body: JSON.stringify(payload) });
    const index = state.blog.findIndex(post => post.id === saved.id);
    if (index >= 0) state.blog[index] = saved; else state.blog.unshift(saved);
    renderBlog();
    fillPostForm(saved);
    status.textContent = 'Articolo salvato';
    setStatus('Backend collegato');
  } catch (error) {
    status.textContent = error.message;
    setStatus('Errore backend', true);
  }
}

async function deletePost(id) {
  if (!confirm('Eliminare definitivamente questo articolo?')) return;
  try {
    await api('/api/blog', { method: 'DELETE', body: JSON.stringify({ id }) });
    state.blog = state.blog.filter(post => post.id !== id);
    renderBlog();
    resetPostForm();
  } catch (error) {
    alert(error.message);
  }
}

document.querySelectorAll('.dash-card').forEach(btn => btn.addEventListener('click', () => {
  document.querySelectorAll('.dash-card').forEach(x => x.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(x => x.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(`panel-${btn.dataset.panel}`).classList.add('active');
}));

autoStub('add-team', () => alert('La gestione Team verrà collegata allo stesso backend del CMS.'));
autoStub('add-gallery', () => alert('La gestione Galleria verrà collegata allo storage media del CMS.'));
autoStub('add-promo', () => alert('La gestione Promozioni verrà collegata allo stesso backend del CMS.'));

document.getElementById('new-post').addEventListener('click', () => { resetPostForm(); document.querySelector('[data-panel="blog"]').click(); });
document.getElementById('cancel-post').addEventListener('click', resetPostForm);
document.getElementById('blog-form').addEventListener('submit', savePost);
document.getElementById('blog-list').addEventListener('click', (event) => {
  const edit = event.target.closest('[data-edit-post]');
  const del = event.target.closest('[data-delete-post]');
  if (edit) fillPostForm(state.blog.find(post => post.id === edit.dataset.editPost));
  if (del) deletePost(del.dataset.deletePost);
});
document.getElementById('refresh-reviews').addEventListener('click', () => setStatus('Google Reviews da collegare'));

function autoStub(id, fn) { const el = document.getElementById(id); if (el) el.addEventListener('click', fn); }

$('last-check').textContent = `Ultimo controllo: ${new Date().toLocaleString('it-IT')}`;
setupEditor();
loadBlog();
