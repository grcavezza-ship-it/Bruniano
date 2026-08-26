(function(){
  document.documentElement.style.visibility='hidden';
  fetch('/api/auth',{credentials:'same-origin',cache:'no-store'})
    .then(async response=>{if(!response.ok)throw new Error('unauthorized');return response.json();})
    .then(data=>{
      window.BrunianoAdminAuth=data;
      if(data.mustChangePassword){window.location.replace('login.html?change=1');return;}
      document.documentElement.style.visibility='visible';
      document.getElementById('admin-logout')?.addEventListener('click',async()=>{try{await fetch('/api/auth',{method:'POST',headers:{'content-type':'application/json'},credentials:'same-origin',body:JSON.stringify({action:'logout'})})}finally{window.location.replace('login.html');}});
    })
    .catch(()=>window.location.replace('login.html'));
})();
