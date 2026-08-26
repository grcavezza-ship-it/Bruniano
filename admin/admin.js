const seed = {
  team:[{id:1,name:"Professionista 01",role:"Fisioterapista",active:true},{id:2,name:"Professionista 02",role:"Fisioterapista",active:true},{id:3,name:"Professionista 03",role:"Fisioterapista",active:true}],
  promos:[{id:1,title:"10 + 2 omaggio",status:"Attiva",expires:"Da configurare"}],
  blog:[{id:1,title:"Mal di schiena: quando è il momento di farsi valutare?",status:"Pubblicato"},{id:2,title:"Tecar e altre terapie strumentali: come orientarsi?",status:"Pubblicato"},{id:3,title:"Recuperare dopo un infortunio: cosa aspettarsi",status:"Pubblicato"}]
};
const state = JSON.parse(localStorage.getItem("bruniano-admin") || "null") || seed;
localStorage.setItem("bruniano-admin", JSON.stringify(state));

function persist(){localStorage.setItem("bruniano-admin", JSON.stringify(state)); render();}
function esc(value){return String(value).replace(/[&<>\"]/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[s]));}

function renderTeam(){const el=document.getElementById("team-list");el.innerHTML=state.team.map(x=>`<div class="managed-item"><div><strong>${esc(x.name)}</strong><small>${esc(x.role)} · ${x.active?"Pubblicato":"Disattivato"}</small></div><div class="managed-actions"><button class="mini" data-edit-team="${x.id}">Modifica</button><button class="mini" data-toggle-team="${x.id}">${x.active?"Disattiva":"Attiva"}</button></div></div>`).join("");document.getElementById("count-team").textContent=state.team.filter(x=>x.active).length;}
function renderPromos(){const el=document.getElementById("promo-list");el.innerHTML=state.promos.map(x=>`<div class="managed-item"><div><strong>${esc(x.title)}</strong><small>${esc(x.status)} · scadenza ${esc(x.expires)}</small></div><div class="managed-actions"><button class="mini">Modifica</button><button class="mini">Scadenza</button></div></div>`).join("");document.getElementById("count-promos").textContent=state.promos.filter(x=>x.status==="Attiva").length;}
function renderBlog(){const el=document.getElementById("blog-list");el.innerHTML=state.blog.map(x=>`<div class="managed-item"><div><strong>${esc(x.title)}</strong><small>${esc(x.status)}</small></div><div class="managed-actions"><button class="mini">Modifica</button><button class="mini">SEO</button></div></div>`).join("");document.getElementById("count-blog").textContent=state.blog.filter(x=>x.status==="Pubblicato").length;}
function render(){renderTeam();renderPromos();renderBlog();document.getElementById("last-check").textContent=`Ultimo controllo: ${new Date().toLocaleString("it-IT")}`;}

document.querySelectorAll(".dash-card").forEach(btn=>btn.addEventListener("click",()=>{document.querySelectorAll(".dash-card").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".panel").forEach(x=>x.classList.remove("active"));btn.classList.add("active");document.getElementById(`panel-${btn.dataset.panel}`).classList.add("active");}));

document.getElementById("add-team").addEventListener("click",()=>{const box=document.getElementById("team-form");box.classList.toggle("hidden");box.innerHTML=`<h3>Nuovo professionista</h3><input id="new-team-name" placeholder="Nome e cognome" style="width:100%;padding:12px;margin:10px 0;border:1px solid #dfe5ed;border-radius:10px"><input id="new-team-role" placeholder="Qualifica" style="width:100%;padding:12px;margin-bottom:12px;border:1px solid #dfe5ed;border-radius:10px"><button class="primary" id="save-team">Salva</button>`;document.getElementById("save-team").onclick=()=>{state.team.push({id:Date.now(),name:document.getElementById("new-team-name").value||"Nuovo professionista",role:document.getElementById("new-team-role").value||"Fisioterapista",active:true});box.classList.add("hidden");persist();};});
document.getElementById("team-list").addEventListener("click",e=>{const toggle=e.target.closest("[data-toggle-team]");if(toggle){const item=state.team.find(x=>x.id==toggle.dataset.toggleTeam);item.active=!item.active;persist();}});
document.getElementById("add-promo").addEventListener("click",()=>{state.promos.push({id:Date.now(),title:"Nuova promozione",status:"Bozza",expires:"Da configurare"});persist();});
document.getElementById("add-post").addEventListener("click",()=>{state.blog.push({id:Date.now(),title:"Nuovo articolo",status:"Bozza"});persist();});
document.getElementById("refresh-reviews").addEventListener("click",()=>{const status=document.getElementById("system-status");status.textContent="Controllo richiesto — Google da collegare";});

render();
