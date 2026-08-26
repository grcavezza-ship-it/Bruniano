# Bruniano — sito web e mini-CMS

Sito custom per Bruniano con area amministrativa.

## Funzioni
- Home, trattamenti, tecnologie, studio
- Galleria foto/video
- Team gestibile da pannello
- Promozioni con date e scadenza
- Recensioni Google
- Blog / approfondimenti
- Contatti e Google Maps
- Prenotazione WhatsApp

## Stack
- GitHub: codice e versionamento
- Cloudflare Workers Static Assets: hosting
- Cloudflare Worker: API backend
- Cloudflare D1: database SQL
- Cloudflare R2: foto e video
- Cloudflare Access / Zero Trust: protezione admin

## Sicurezza
Le scritture API richiedono un contesto Cloudflare Access. In produzione `/admin/*` deve essere protetto da una Cloudflare Access Application. Nessun secret privato deve essere committato.

## Stato
Frontend e mini-CMS sono già predisposti. D1/R2/Workers sono configurati nel repository; resta da creare il database D1, il bucket R2 e collegare il pannello alle API.

## Dati del materiale cliente
- Via Nazionale delle Puglie, 283 — San Vitaliano (NA)
- Prenotazioni: +39 334 3755885
- Telefono: +39 081 2352977
