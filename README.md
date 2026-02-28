# Sportify Rural

MVP d’application web pour créer et rejoindre des sorties sportives (vélo, course, marche) en milieu rural en France.

## Stack

- **Front** : Next.js 14 App Router, TypeScript, Tailwind CSS
- **Backend** : Supabase (Postgres, PostGIS, Auth, Storage, Edge Functions)
- **Emails** : Resend (via Edge Function)
- **Géocodage** : Nominatim (OpenStreetMap)

## Démarrage

1. **Variables d’environnement**  
   Copier `.env.example` vers `.env.local` et renseigner :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (jamais côté client)
   - `NEXT_PUBLIC_APP_URL` (ex. `http://localhost:3000`)
   - `ADMIN_EMAILS` (optionnel, pour `/admin`)
   - `RESEND_API_KEY` (pour les notifications)

2. **Auth Supabase**  
   Dans le dashboard : **Authentication** → **URL Configuration** :
   - **Site URL** : `http://localhost:3000` (ou ta prod)
   - **Redirect URLs** : ajouter `http://localhost:3000/**` et `http://localhost:3000/auth/callback`

3. **Base de données**  
   Exécuter le SQL dans `supabase/migrations/001_init.sql` dans le Supabase SQL Editor (extensions → tables → index → RLS → triggers → RPC).

4. **Installation et lancement**
   ```bash
   npm install
   npm run dev
   ```

5. **Notifications (optionnel)**  
   Déployer l’Edge Function `send-notifications`, configurer les secrets Resend, puis exécuter `supabase/cron-setup.sql` pour pg_cron.

## Structure

- `src/app/(auth)/login` — Connexion / inscription
- `src/app/onboarding` — Onboarding 3 étapes (à compléter)
- `src/app/events` — Liste, détail, création de sorties
- `src/app/profile` — Profil utilisateur
- `src/lib/supabase` — Clients Supabase (browser, server, middleware)

## Build

```bash
npm run build
```

Projet généré selon le prompt maître Sportify Rural et les fichiers fournis (migration SQL, règles Cursor, Edge Function).
