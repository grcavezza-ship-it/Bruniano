# Supabase setup Bruniano

1. Crea un progetto Supabase dedicato a Bruniano, in regione UE.
2. Esegui `schema.sql` nell'SQL Editor.
3. Abilita Email/Password in Auth e crea un solo account amministratore per lo studio.
4. Configura Storage per le immagini/video pubblici del sito.
5. Applica RLS alle tabelle e mantieni il `service_role` solo lato server/Edge Function.
6. Inserisci URL e publishable/anon key nella configurazione pubblica dell'admin. Non inserire mai il service role key nel repository.
7. Per Google Reviews, usa un backend/Edge Function autenticato e conserva eventuali credenziali Google lato server.

Il progetto attuale contiene una dashboard dimostrativa con localStorage: serve a validare UX e flusso di gestione. Non va usata come pannello di produzione finché non è collegata a Supabase Auth + RLS.
