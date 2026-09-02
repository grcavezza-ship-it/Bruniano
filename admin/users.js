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

  function statusChip(user) {
    if (!user.is_active && user.must_change_password) return '<span class="media-status draft">IN ATTESA</span>';
    return `<span class="media-status ${user.is_active ? '' : 'draft'}">${user.is_active ? 'ATTIVO' : 'DISATTIVATO'}</span>`;
  }

  function displayName(u) {
    const full = [u.first_name, u.last_name].filter(Boolean).join(' ').trim();
    return full || (u.username === 'admin' ? 'Amministratore' : u.username || 'Utente');
  }

  function displayIdentifier(u) {
    return u.email ? u.email : `Username: ${u.username || '—'}`;
  }

  function render() {
    const list = $('users-list');
    if (!list) return;
    list.innerHTML = state.items.length ? state.items.map(u => `
      <div class="managed-item">
        <div>
          <strong>${esc(displayName(u))}</strong>
          <small>${esc(displayIdentifier(u))} · Accesso completo</small>
        </div>
        <div class="managed-actions">
          ${statusChip(u)}
          ${u.username !== 'admin' && u.email && u.must_change_password ? `<button class="mini" type="button" data-user-invite="${u.id}">${u.is_active ? 'Reinvia invito' : 'Invia invito'}</button>` : ''}
          <button class="mini" type="button" data-user-edit="${u.id}">Modifica</button>
          ${u.username !== 'admin' ? `<button class="mini danger" type="button" data-user-delete="${u.id}">Cancella</button>` : ''}
          ${u.username !== 'admin' ? `<button class="mini" type="button" data-user-toggle="${u.id}" data-active="${u.is_active}">${u.is_active ? 'Disattiva' : 'Riattiva'}</button>` : ''}
        </div>
      </div>`).join('') : '<div class="form-card note">Nessun utente registrato.</div>';
    const count = $('count-users');
    if (count) count.textContent = state.items.filter(x => x.is_active).length;
  }

  function form(item = {}) {
    const editing = Boolean(item.id);
    const host = $('user-form');
    host.classList.remove('hidden');
    const emailRequired = item.username === 'admin' && !item.email ? '' : 'required';
    host.innerHTML = `<div class="panel-title"><div><p>UTENTE GESTIONALE</p><h3>${editing ? 'Modifica utente' : 'Nuovo utente'}</h3><span>Accesso completo al gestionale. Gli operatori ricevono un invito via email e impostano personalmente la password.</span></div><button class="mini" type="button" id="user-cancel">Annulla</button></div>
      <form id="user-editor">
        <input type="hidden" id="user-id" value="${esc(item.id || '')}">
        <div class="form-row"><label>Nome<input id="user-first-name" required maxlength="80" value="${esc(item.first_name || '')}"></label><label>Cognome<input id="user-last-name" required maxlength="80" value="${esc(item.last_name || '')}"></label></div>
        <label>Email<input id="user-email" type="email" maxlength="160" ${emailRequired} value="${esc(item.email || '')}" placeholder="nome@dominio.it"></label>
        <div class="form-card note"><strong>Accesso</strong><span>${item.username === 'admin' ? 'Account amministratore principale. L’accesso resta con username “admin”.' : 'Username di accesso = email. Nessuna password viene mostrata o comunicata dal gestionale: l’operatore la imposta dal link ricevuto via email.'}</span></div>
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
      if (!id) {
        status.textContent = 'Utente creato. Invito inviato.';
        alert(`Utente creato.\n\nLogin: ${payload.email}\n\nÈ stato inviato un invito a questo indirizzo. L’operatore dovrà impostare personalmente la password.`);
      } else {
        status.textContent = d.invited ? 'Modifiche salvate e invito inviato.' : 'Utente salvato';
      }
      await load();
      $('user-form').classList.add('hidden');
    } catch (error) {
      status.textContent = error.message;
    }
  }

  async function resendInvite(id) {
    const item = state.items.find(x => x.id === id);
    if (!item || !item.email) return;
    if (!confirm(`Inviare un nuovo link di primo accesso a ${item.email}? Il link precedente verrà invalidato.`)) return;
    try {
      const d = await api('/api/users', { method: 'POST', body: JSON.stringify({ action: 'resend-invite', id }) });
      alert(d.message || 'Invito inviato.');
      await load();
    } catch (error) {
      alert(error.message);
    }
  }

  async function toggle(id, active) {
    const item = state.items.find(x => x.id === id);
    if (!item) return;
    const action = active ? 'disattivare' : 'riattivare';
    if (!confirm(`Vuoi ${action} ${displayName(item)}?`)) return;
    try {
      await api('/api/users', { method: 'PUT', body: JSON.stringify({ id, first_name: item.first_name, last_name: item.last_name, email: item.email || '', is_active: !active }) });
      await load();
    } catch (error) { alert(error.message); }
  }

  async function remove(id) {
    const item = state.items.find(x => x.id === id);
    if (!item || item.username === 'admin') return;
    const name = displayName(item);
    const confirmed = confirm(`Stai per cancellare definitivamente ${name}.\n\nL’operatore verrà rimosso dal gestionale e perderà immediatamente ogni accesso. L’operazione non può essere annullata.\n\nContinuare?`);
    if (!confirmed) return;
    try {
      await api('/api/users', { method: 'DELETE', body: JSON.stringify({ id }) });
      await load();
    } catch (error) {
      alert(error.message);
    }
  }

  async function load() {
    try { const d = await api('/api/users'); state.items = d.items || []; render(); }
    catch (error) { const host = $('users-list'); if (host) host.innerHTML = `<div class="form-card note">${esc(error.message)}</div>`; }
  }

  $('add-user')?.addEventListener('click', () => form());
  $('users-list')?.addEventListener('click', e => {
    const edit = e.target.closest('[data-user-edit]');
    const invite = e.target.closest('[data-user-invite]');
    const deleteBtn = e.target.closest('[data-user-delete]');
    const toggleBtn = e.target.closest('[data-user-toggle]');
    if (edit) form(state.items.find(x => x.id === edit.dataset.userEdit));
    if (invite) resendInvite(invite.dataset.userInvite);
    if (deleteBtn) remove(deleteBtn.dataset.userDelete);
    if (toggleBtn) toggle(toggleBtn.dataset.userToggle, toggleBtn.dataset.active === 'true');
  });

  load();
})();
