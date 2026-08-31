(function(){
  const path=location.pathname.replace(/\/+$/,'')||'/';
  if(path.startsWith('/admin')) return;
  const pages={
    '/':['Bruniano | Fisioterapia e Riabilitazione a San Vitaliano','Bruniano è il Centro Medico Specialistico di San Vitaliano dedicato a fisioterapia, riabilitazione, terapia manuale, postura e movimento.'],
    '/trattamenti.html':['Trattamenti | Bruniano — Centro Medico Specialistico',"Scopri i trattamenti Bruniano a San Vitaliano: Tecar, Laser Ixyon, onde d'urto, terapia manuale e riabilitazione personalizzata."],
    '/studio.html':['Lo studio | Bruniano — Centro Medico Specialistico','Scopri il Centro Medico Specialistico Bruniano a San Vitaliano: ambienti, tecnologie, accoglienza e percorso di cura.'],
    '/team.html':['Team | Bruniano — Centro Medico Specialistico','Conosci i professionisti del Centro Medico Specialistico Bruniano e le loro specializzazioni.'],
    '/promozioni.html':['Promozioni | Bruniano — Centro Medico Specialistico','Scopri le promozioni del Centro Medico Specialistico Bruniano a San Vitaliano.'],
    '/blog.html':['Blog | Bruniano — Centro Medico Specialistico','Approfondimenti Bruniano su fisioterapia, riabilitazione, postura, movimento e tecnologie.'],
    '/recensioni.html':['Recensioni | Bruniano — Centro Medico Specialistico',"Scopri le recensioni e l'esperienza delle persone che hanno scelto Bruniano."],
    '/contatti.html':['Contatti | Bruniano — Centro Medico Specialistico','Contatta Bruniano a San Vitaliano per informazioni, disponibilità e prenotazioni.'],
    '/articolo.html':['Approfondimento | Bruniano — Centro Medico Specialistico','Approfondimento del Centro Medico Specialistico Bruniano su fisioterapia, riabilitazione e benessere.']
  };
  const d=pages[path]||pages['/'];
  document.title=d[0];
  const meta=(name,content,property)=>{let e=document.head.querySelector(`meta[${property?'property':'name'}="${name}"]`);if(!e){e=document.createElement('meta');e.setAttribute(property?'property':'name',name);document.head.appendChild(e);}e.setAttribute('content',content);};
  meta('description',d[1]);
  meta('og:title',d[0],true);meta('og:description',d[1],true);meta('og:type',path==='/articolo.html'?'article':'website',true);meta('og:url',`https://bruniano.it${path}`,true);meta('og:site_name','Bruniano',true);meta('og:locale','it_IT',true);
  meta('twitter:card','summary');meta('twitter:title',d[0]);meta('twitter:description',d[1]);
  let c=document.head.querySelector('link[rel="canonical"]');if(!c){c=document.createElement('link');c.rel='canonical';document.head.appendChild(c);}c.href=`https://bruniano.it${path}`;
  if(!document.getElementById('bruniano-schema')){
    const s=document.createElement('script');s.id='bruniano-schema';s.type='application/ld+json';s.textContent=JSON.stringify({'@context':'https://schema.org','@graph':[{'@type':'MedicalClinic','@id':'https://bruniano.it/#clinic',name:'Bruniano — Centro Medico Specialistico',url:'https://bruniano.it/',telephone:'+39 081 2352977',address:{'@type':'PostalAddress',streetAddress:'Via Nazionale delle Puglie, 283',postalCode:'80030',addressLocality:'San Vitaliano',addressRegion:'NA',addressCountry:'IT'}},{'@type':'WebSite','@id':'https://bruniano.it/#website',url:'https://bruniano.it/',name:'Bruniano',publisher:{'@id':'https://bruniano.it/#clinic'},inLanguage:'it-IT'}]});document.head.appendChild(s);
  }
})();
