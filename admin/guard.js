(async function(){
  try {
    const response = await fetch('/api/auth',{credentials:'same-origin',cache:'no-store'});
    if (!response.ok) throw new Error('unauthorized');
    const data = await response.json();
    window.BrunianoAdminAuth = data;
    if (data.mustChangePassword) {
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.replace('login.html?change=1&next=' + next);
    }
  } catch {
    window.location.replace('login.html');
  }
})();
