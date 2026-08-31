# Bruniano — sito web e mini-CMS

Sito custom per Bruniano con area amministrativa, API server-side e database Neon.

## Funzioni
- Home, trattamenti, tecnologie e studio
- Galleria foto/video
- Team gestibile da pannello
- Promozioni con date e scadenza
- Recensioni Google
- Blog / approfondimenti
- Contatti e Google Maps
- Prenotazione WhatsApp
- Area operatori con autenticazione server-side

## Stack
- GitHub: codice e versionamento
- Vercel: hosting e deploy
- Neon Postgres: database applicativo
- Node.js/Vercel Functions: API server-side

## Sicurezza
- Sessioni amministrative server-side con cookie `__Host-bruniano_session`
- Cookie `HttpOnly`, `Secure`, `SameSite=Lax`
- Password hashate con scrypt + salt
- Rate limiting sugli accessi
- API CMS amministrative protette da sessione
- Validazione input e URL HTTPS
- Sanitizzazione del contenuto HTML del blog
- Security headers e Content Security Policy configurati in `vercel.json`
- Nessun secret privato deve essere committato nel repository

## Password recovery
Il backend supporta il recupero password tramite token casuale monouso, hashato nel database e con scadenza di 30 minuti. La consegna email richiede la configurazione delle variabili `RESEND_API_KEY`, `ADMIN_RESET_EMAIL`, `MAIL_FROM` e `PUBLIC_SITE_URL`.

## Stato
Il frontend è in fase di rifinitura finale. L'autenticazione amministrativa e le API CMS sono già collegate al database. Restano da completare il test end-to-end in produzione, la configurazione della posta del dominio, la pulizia finale del repository e i passaggi conclusivi di SEO, privacy/cookie, performance e collaudo.

## Dati del materiale cliente
- Via Nazionale delle Puglie, 283 — San Vitaliano (NA)
- Prenotazioni: +39 334 3755885
- Telefono: +39 081 2352977
