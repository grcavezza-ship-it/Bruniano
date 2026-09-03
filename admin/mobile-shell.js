(() => {
  const menu = document.getElementById('mobile-menu');
  const sidebar = document.getElementById('sidebar');
  if (!menu || !sidebar) return;

  const backdrop = document.createElement('div');
  backdrop.className = 'mobile-sidebar-backdrop';
  backdrop.setAttribute('aria-hidden', 'true');
  document.body.appendChild(backdrop);

  const brand = document.createElement('a');
  brand.className = 'mobile-brand';
  brand.href = '../index.html';
  brand.setAttribute('aria-label', 'Bruniano');
  brand.innerHTML = '<img src="../assets/logo-symbol.svg" alt=""><span>bruniano</span>';
  const title = document.querySelector('.topbar-title');
  if (title) title.parentNode.insertBefore(brand, title);

  const account = document.createElement('button');
  account.type = 'button';
  account.className = 'mobile-account';
  account.setAttribute('aria-label', 'Apri profilo');
  account.setAttribute('aria-expanded', 'false');
  account.innerHTML = '<span class="mobile-account-avatar"></span>';
  const accountMenu = document.createElement('div');
  accountMenu.className = 'mobile-account-menu';
  accountMenu.innerHTML = '<a href="../index.html">Vai al sito <span>↗</span></a><button type="button" id="mobile-logout">Esci <span>→</span></button>';
  document.querySelector('.topbar')?.append(account, accountMenu);

  function openMenu() {
    sidebar.classList.add('mobile-open');
    backdrop.classList.add('is-visible');
    menu.setAttribute('aria-expanded', 'true');
    menu.setAttribute('aria-label', 'Chiudi menu');
    document.body.classList.add('mobile-nav-open');
  }
  function closeMenu() {
    sidebar.classList.remove('mobile-open');
    backdrop.classList.remove('is-visible');
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Apri menu');
    document.body.classList.remove('mobile-nav-open');
  }
  function toggleMenu() { sidebar.classList.contains('mobile-open') ? closeMenu() : openMenu(); }

  menu.addEventListener('click', toggleMenu);
  backdrop.addEventListener('click', closeMenu);
  sidebar.querySelectorAll('.nav-item').forEach(item => item.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') { closeMenu(); closeAccount(); } });

  function syncAccount() {
    const avatar = document.getElementById('user-avatar');
    const target = account.querySelector('.mobile-account-avatar');
    if (target) target.textContent = avatar?.textContent || 'A';
  }
  function openAccount() {
    syncAccount();
    accountMenu.classList.add('is-visible');
    account.setAttribute('aria-expanded', 'true');
  }
  function closeAccount() {
    accountMenu.classList.remove('is-visible');
    account.setAttribute('aria-expanded', 'false');
  }
  account.addEventListener('click', event => { event.stopPropagation(); accountMenu.classList.contains('is-visible') ? closeAccount() : openAccount(); });
  document.addEventListener('click', event => { if (!accountMenu.contains(event.target)) closeAccount(); });
  accountMenu.querySelector('#mobile-logout')?.addEventListener('click', () => document.getElementById('admin-logout')?.click());

  const observer = new MutationObserver(syncAccount);
  const avatar = document.getElementById('user-avatar');
  if (avatar) observer.observe(avatar, { childList: true, characterData: true, subtree: true });
  syncAccount();
})();
