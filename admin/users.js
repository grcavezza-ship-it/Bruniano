(() => {
  const $ = id => document.getElementById(id);
  const state = { items: [] };
  const esc = v => String(v ?? '').replace(/[&<>\"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[s]));

  async function api(url, options = {}) {
    const r = await fetch(url, { credentials: 'same-origin', headers: { 'content-type': 'application/json', ...(options.headers || {}) }, ...options });
    const d = await r.json().catch(() => ({}));
    if (r.status === 401) { window.location.replace('login.html'); throw new Error('Sessione scaduta'); }
    if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
    return d;
  }

  function statusChip(active) {
    return `<span class="media-status ${active ? '' : 'draft'}">${active ? 'ATTIVO' : 'DISATTIVATO'}</span>`;
  }

  function render() {
    const list = $('users-list');
    if (!list) return;
    list.innerHTML = state.items.length ? state.items.map(u => `
      <div class="managed-item">
        <div>
          <strong>${esc([u.first_name, u.last_name].filter(Boolean).join(' '))}</strong>
          <small>${esc(u.email)} · Accesso completo</small>
        </div>
        <div class="managed-actions">
          ${statusChip(u.is_active)}
          <button class="mini" type="button" data-user-edit="${u.id}">Modifica</button>
          <button class="mini" type="button" data-user-toggle="${u.id}" data-active="${u.is_active}">${u.is_active ? 'Disattiva' : 'Riattiva'}</button>
        </div>
      </div>`).join('') : '<div class="form-card note">Nessun utente registrato.</div>';
    const count = $('count-users');
    if (count) count.textContent = state.items.filter(x => x.is_active).length;
  }

  function form(item = {}) {
    const editing = Boolean(item.id);
    const host = $('user-form');
    host.classList.remove('hidden');
    host.innerHTML = `<div class="panel-title"><div><p>UTENTE GESTIONALE</p><h3>${editing ? 'Modifica utente' : 'Nuovo utente'}</h3><span>Accesso completo al gestionale. Nessuna gestione dei ruoli.</span></div><button class="mini" type="button" id="user-cancel">Annulla</button></div>
      <form id="user-editor">
        <input type="hidden" id="user-id" value="${esc(item.id || '')}">
        <div class="form-row"><label>Nome<input id="user-first-name" required maxlength="80" value="${esc(item.first_name || '')}"></label><label>Cognome<input id="user-last-name" required maxlength="80" value="${esc(item.last_name || '')}"></label></div>
        <label>Email<input id="user-email" type="email" required maxlength="160" value="${esc(item.email || '')}" placeholder="nome@dominio.it"></label>
        <div class="form-card note"><strong>Accesso</strong><span>Il sistema usa l’email come identificativo di accesso. La password non viene richiesta in questo modulo.</span></div>
        <div class="form-actions"><button class="primary" type="submit">${editing ? 'Salva modifiche' : 'Crea utente'}</button><span id="user-form-status"></span></div>
      </form>`;
    $('user-cancel').onclick = () => host.classList.add('hidden');
    $('user-editor').onsubmit = save;
    $('user-first-name').focus();
  }

  async function save(e) {
    e.preventDefault();
    const id = $('user-id').value || undefined;
    const payload = { id, first_name: $('user-first-name').value.trim(), last_name: $('user-last-name').value.trim(), email: $('user-email').value.trim() };
    const status = $('user-form-status');
    status.textContent = 'Salvataggio…';
    try {
      const d = await api('/api/users', { method: id ? 'PUT' : 'POST', body: JSON.stringify(payload) });
      if (!id && d.item?.temporary_password) {
        status.textContent = 'Utente creato. Password temporanea generata dal sistema.';
        alert(`Utente creato.\n\nLogin: ${payload.email}\nPassword temporanea: ${d.item.temporary_password}\n\nSalvala ora: verrà mostrata una sola volta.`);
      } else status.textContent = 'Utente salvato';
      await load();
      $('user-form').classList.add('hidden');
    } catch (error) { status.textContent = error.message; }
  }

  async function toggle(id, active) {
    const item = state.items.find(x => x.id === id);
    if (!item) return;
    const action = active ? 'disattivare' : 'riattivare';
    if (!confirm(`Vuoi ${action} ${[item.first_name, item.last_name].filter(Boolean).join(' ')}?`)) return;
    try {
      await api('/api/users', { method: 'PUT', body: JSON.stringify({ id, first_name: item.first_name, last_name: item.last_name, email: item.email, is_active: !active }) });
      await load();
    } catch (error) { alert(error.message); }
  }

  async function load() {
    try { const d = await api('/api/users'); state.items = d.items || []; render(); }
    catch (error) { $('users-list').innerHTML = `<div class="form-card note">${esc(error.message)}</div>`; }
  }

  $('add-user')?.addEventListener('click', () => form());
  $('users-list')?.addEventListener('click', e => {
    const edit = e.target.closest('[data-user-edit]');
    const toggleBtn = e.target.closest('[data-user-toggle]');
    if (edit) form(state.items.find(x => x.id === edit.dataset.userEdit));
    if (toggleBtn) toggle(toggleBtn.dataset.userToggle, toggleBtn.dataset.active === 'true');
  });

  load();
})();
