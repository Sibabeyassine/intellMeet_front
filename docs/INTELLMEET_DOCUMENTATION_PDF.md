<style>
  .cover {
    min-height: 92vh;
    padding: 72px;
    color: white;
    background: linear-gradient(135deg, #0f172a 0%, #2563eb 48%, #14b8a6 100%);
    display: flex;
    flex-direction: column;
    justify-content: center;
    border-radius: 18px;
    page-break-after: always;
  }
  .cover h1 {
    font-size: 58px;
    line-height: 1.02;
    margin: 0 0 20px;
    letter-spacing: 0;
  }
  .cover .tagline {
    font-size: 23px;
    max-width: 760px;
    margin-bottom: 56px;
  }
  .cover .meta {
    font-size: 17px;
    line-height: 1.7;
    opacity: 0.94;
  }
  .page-break {
    page-break-before: always;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }
  th, td {
    border: 1px solid #d7dde8;
    padding: 9px 10px;
    vertical-align: top;
  }
  th {
    background: #eef4ff;
  }
  .visual-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }
  .visual-slot {
    border: 1px dashed #94a3b8;
    border-radius: 10px;
    min-height: 145px;
    padding: 14px;
    background: #f8fafc;
  }
</style>

<section class="cover">
  <h1>IntellMeet</h1>
  <p class="tagline">Plateforme collaborative de réunions intelligentes, combinant visioconférence, gestion de projet, chat temps réel et synthèse assistée par IA.</p>
  <div class="meta">
    <strong>Documentation technique et fonctionnelle</strong><br>
    Frontend React + Backend Express/MongoDB<br>
    Réalisé par : Yassine - @harsadash<br>
    Date : 21 mai 2026
  </div>
</section>

# Aperçu du Projet

## Vision

IntellMeet vise à réduire la perte d'information après les réunions en centralisant dans un même produit les échanges synchrones, les décisions, les tâches, les fichiers, les notifications et les résumés IA. L'application permet à une équipe de planifier une réunion, d'y participer, de discuter en temps réel, de générer une synthèse, puis de transformer les décisions en actions suivies dans un espace projet.

## Objectifs

- Fournir une expérience de réunion complète : salle vidéo, participants, chat, notes, transcript et contrôles média.
- Relier les réunions à l'exécution opérationnelle : équipes, espaces de travail, projets, tâches, ressources et notifications.
- Sécuriser les accès avec authentification JWT, vérification email, rôles et permissions.
- Préparer un produit déployable avec une architecture frontend/backend séparée, configurable par variables d'environnement.
- Offrir une base maintenable grâce à TypeScript, Zod, tests unitaires backend et séparation claire des modules.

## Utilisateurs Cibles

- Chefs de projet et product owners qui organisent les réunions et suivent les décisions.
- Equipes produit, design, développement et support qui collaborent dans des workspaces.
- Administrateurs qui gèrent les utilisateurs, les rôles et l'état des comptes.
- Membres invités qui rejoignent une réunion ou un espace via invitation.

## Valeur Métier

- Gain de temps après réunion grâce aux synthèses et actions générées.
- Meilleure traçabilité des décisions avec historique de notes, transcript et tâches.
- Réduction de la fragmentation entre outils de visio, chat et suivi projet.
- Amélioration du pilotage par dashboard, notifications et vues projet.

## Objectifs Non Fonctionnels

- Sécurité : JWT, bcrypt, Helmet, CORS contrôlé, validation Zod, limitation de débit.
- Performance : bundling Vite côté client, compression HTTP côté API, requêtes typées et séparation du temps réel.
- Maintenabilité : architecture modulaire, contrats TypeScript, repositories backend, composants UI réutilisables.
- Disponibilité : healthcheck `/api/health`, configuration Vercel/Netlify, scripts de build et démarrage.
- Internationalisation : interface frontend disponible en anglais, français et espagnol.

# Fonctionnalités Clés

| ID | Fonctionnalité | Description | Critères d'Acceptation |
|---|---|---|---|
| F01 | Authentification | Inscription, vérification email, connexion, refresh token, logout et changement de mot de passe. | Un utilisateur non vérifié ne peut pas se connecter ; les mots de passe sont hashés ; les routes privées exigent `Authorization: Bearer <token>`. |
| F02 | Gestion du profil | Consultation et mise à jour du nom complet et de l'avatar depuis l'espace utilisateur. | Les modifications sont persistées par l'API et reflétées dans le shell de l'application. |
| F03 | Workspaces et invitations | Création d'espaces de travail, membres, invitations par token ou identifiant. | Un membre invité peut accepter une invitation valide ; les rôles contrôlent l'accès aux actions sensibles. |
| F04 | Projets | Création, consultation, modification et archivage de projets liés à un workspace. | Les projets sont filtrables par workspace ; l'archivage ne casse pas l'historique. |
| F05 | Tâches | Création, édition, suppression et changement de statut des tâches. | Les tâches respectent les statuts autorisés ; les vues Kanban/liste/calendrier restent synchronisées. |
| F06 | Réunions | Planification, démarrage, participation, fin, extension, suppression et présence. | Un participant autorisé peut rejoindre ; l'hôte peut démarrer/terminer ; la présence est mise à jour. |
| F07 | Salle temps réel | Signalisation WebRTC, état micro/caméra/partage écran, participants et lobby. | Les événements Socket.io `meeting:join`, `meeting:signal`, `participant:*` propagent l'état entre participants connectés. |
| F08 | Chat | Messages temps réel liés aux réunions ou canaux, liste des messages et création de canal. | Les nouveaux messages apparaissent sans rafraîchissement et sont persistés côté backend. |
| F09 | Intelligence IA | Analyse de transcript, résumé, extraction d'actions et suggestions. | Si `OPENAI_API_KEY` existe, l'analyse utilise le modèle configuré ; sinon un fallback déterministe génère résumé et actions. |
| F10 | Notifications | Liste, lecture individuelle et marquage global comme lu. | Les notifications non lues sont visibles ; le compteur diminue après lecture. |
| F11 | Médias | Upload et liste de fichiers associés à réunion/projet/workspace. | Les fichiers respectent les contraintes backend et sont accessibles via `/uploads`. |
| F12 | Dashboard | Vue d'ensemble des indicateurs de workspace et données récentes. | Les statistiques sont accessibles via `/api/dashboard/overview` et cohérentes avec les entités stockées. |

# Stack Technologique

| Catégorie | Technologie | Justification / Alternatives |
|---|---|---|
| Frontend | React 18 + TypeScript | Composants réutilisables, typage fort et écosystème stable. Alternative : Vue ou Angular. |
| Build Front | Vite | Démarrage rapide, bundling moderne et configuration simple. Alternative : Next.js pour SSR. |
| UI | Tailwind CSS + shadcn/ui + Radix UI | Design system modulaire, accessible et rapide à personnaliser. Alternative : MUI ou Chakra UI. |
| Icônes | lucide-react | Icônes cohérentes, légères et faciles à intégrer dans les boutons. |
| Routing | react-router-dom | Navigation SPA protégée par `ProtectedRoute`. Alternative : TanStack Router. |
| State | Zustand + React Query | Stores simples pour l'état applicatif et cache réseau côté client. Alternative : Redux Toolkit. |
| Formulaires / Validation | react-hook-form, Zod | Validation robuste et typée. Zod est aussi utilisé côté backend. |
| i18n | react-i18next | Gestion des langues EN/FR/ES avec détection navigateur et persistance locale. |
| HTTP | Axios | Intercepteurs pour token, refresh, erreurs API et headers no-cache. Alternative : Fetch natif. |
| Temps réel Front | socket.io-client | Compatible avec Socket.io backend pour chat, présence et signalisation. |
| Backend | Node.js + Express + TypeScript | API REST modulaire, typée, facile à déployer. Alternative : NestJS pour architecture plus opinionée. |
| Base de données | MongoDB + Mongoose | Documents flexibles pour réunions, tâches, workspaces et messages. Alternative : PostgreSQL + Prisma. |
| Auth | JWT + bcryptjs | Access/refresh tokens, sessions et hash sécurisé des mots de passe. Alternative : OAuth provider externe. |
| Validation API | Zod | Contrats d'entrée robustes, tests unitaires par schéma. |
| Sécurité HTTP | Helmet, CORS, express-rate-limit | Mitigation OWASP basique : headers sûrs, origines contrôlées et limitation de débit. |
| Temps réel Backend | Socket.io | Rooms par utilisateur/réunion, événements de meeting, chat et workspace. |
| Email | nodemailer | Envoi du code de vérification email SMTP. Alternative : SendGrid, Resend, Mailgun. |
| IA | OpenAI API optionnelle + fallback local | Analyse avancée si clé disponible, continuité fonctionnelle sans service externe. |
| Tests | Vitest front, Jest backend | Tests unitaires et validation TypeScript. |
| Déploiement | Vercel / Netlify | SPA front avec rewrites ; backend Vercel serverless via `api/index.ts`. |

# Diagramme d'Architecture

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                              Utilisateurs                               │
│       Web desktop/mobile, équipes projet, admins, participants invités   │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ HTTPS / WebSocket
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Frontend IntellMeet - React + Vite + TypeScript                         │
│                                                                         │
│ Pages                                                                    │
│ - /login, /register, /dashboard, /meeting/:id, /meetings                 │
│ - /projects, /chat, /settings, /profile, /invite/:token                  │
│                                                                         │
│ Couche client                                                            │
│ - AppShell, Sidebar, Topbar, modals                                      │
│ - Zustand stores : auth, meetings, projects, chat, notifications         │
│ - services/http.ts : Axios + mapping API                                 │
│ - realtime.ts : résolution Socket.io / désactivation serverless          │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ REST /api + Socket.io
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Backend IntellMeet - Express + TypeScript                               │
│                                                                         │
│ Providers partagés                                                       │
│ - LocalsProvider : variables d'environnement validées                    │
│ - MiddlewaresProvider : Helmet, CORS, rate limit, compression            │
│ - ErrorHandlerProvider : format d'erreur unifié                          │
│ - RealtimeProvider : auth socket, rooms, événements                      │
│                                                                         │
│ Modules métier                                                           │
│ - auth, users, workspaces, projects, tasks, meetings                     │
│ - chat, notifications, media, ai, dashboard                              │
└───────────────────────┬─────────────────────┬───────────────────────────┘
                        │                     │
                        ▼                     ▼
        ┌────────────────────────┐   ┌─────────────────────────────┐
        │ MongoDB + Mongoose     │   │ Services externes optionnels │
        │ users, meetings, tasks │   │ SMTP, OpenAI API             │
        │ projects, messages...  │   │                             │
        └────────────────────────┘   └─────────────────────────────┘
```

# Calendrier d'Exécution Détaillé

| Période | Travaux | Jalons / Livrables |
|---|---|---|
| Semaine 1 | Cadrage produit, définition des rôles, entités, parcours utilisateur et architecture générale. | Cahier des modules, routes principales, modèle de données initial. |
| Semaine 2 | Mise en place frontend : Vite, React, Tailwind, shadcn/ui, routing, thème, i18n, shell applicatif. | Navigation fonctionnelle, pages publiques/privées, base UI. |
| Semaine 3 | Backend noyau : Express, providers, MongoDB, middlewares sécurité, format de réponse, gestion d'erreurs. | API initiale, healthcheck, configuration `.env`, connexion database. |
| Semaine 4 | Authentification et utilisateurs : register, verify email, login, refresh, logout, profils, rôles admin/member. | Auth complète, protection des routes, tests de schémas auth/users. |
| Semaine 5 | Workspaces, projets et tâches : CRUD, membres, invitations, vues Kanban/liste/calendrier côté front. | Gestion projet utilisable de bout en bout. |
| Semaine 6 | Réunions et temps réel : salle, présence, chat, signalisation, notes, transcript, démarrage/fin de réunion. | Meeting room connectée aux routes API et événements Socket.io. |
| Semaine 7 | IA, médias, notifications, dashboard et intégration finale front/backend. | Synthèses IA, fichiers, notifications, indicateurs. |
| Semaine 8 | Tests, correction bugs, documentation, déploiement, captures écran et préparation soutenance. | Build validé, collection Postman, PDF final, visuels haute qualité. |

# Points Techniques Clés

## Sécurité

- Authentification JWT avec access token et refresh token ; invalidation après logout ou changement de mot de passe.
- Hash des mots de passe via bcryptjs avec `BCRYPT_SALT_ROUNDS`.
- Vérification email obligatoire avant la connexion.
- Validation des entrées par schémas Zod sur les modules backend.
- Headers de sécurité via Helmet et désactivation de `x-powered-by`.
- CORS limité aux origines configurées par `CORS_ORIGIN` et `FRONTEND_URL`.
- Limitation de débit globale : 500 requêtes par fenêtre de 15 minutes.
- Cache désactivé côté API avec `Cache-Control: no-store`.
- Contrôle d'accès par rôles `admin`, `member`, `owner` selon les modules.
- Authentification Socket.io à partir du token avant accès aux rooms temps réel.

## Mitigation OWASP

- Injection : Mongoose et Zod réduisent l'exposition aux entrées malformées ; les IDs et payloads sont validés.
- Broken Authentication : secrets JWT obligatoires en production, refresh token invalidable, comptes désactivés refusés.
- Sensitive Data Exposure : mots de passe hashés, codes email non exposés dans les réponses API.
- Security Misconfiguration : variables d'environnement validées et erreur bloquante si secrets de développement en production.
- Cross-Origin Risks : CORS explicite et credentials contrôlés.
- Denial of Service basique : rate limiting, limites JSON/urlencoded à 10 MB, compression contrôlée.

## Sanitisation et Validation

- Les DTO entrants sont validés avec Zod par module.
- Les erreurs de validation sont retournées dans le format uniforme `{ succeed, message, errors }`.
- Les champs IA sont tronqués ou filtrés : les action items générés sont limités et nettoyés.
- Les fichiers uploadés passent par le module média et sont exposés via une route dédiée.

## Performance

- Frontend Vite pour build rapide et bundle optimisé.
- React Query et Zustand séparent cache réseau et état UI.
- Axios ajoute les headers no-cache sur GET pour éviter des états obsolètes dans les données collaboratives.
- Compression HTTP côté backend.
- Socket.io évite le polling applicatif pour chat, présence et événements de réunion.
- Séparation des rooms Socket.io par utilisateur et réunion pour limiter la diffusion inutile.

## Défis Rencontrés

- Synchroniser les états meeting entre REST, présence persistée et événements Socket.io.
- Rendre compatible le temps réel avec les déploiements serverless : le front désactive Socket.io si l'URL cible est un host Vercel serverless.
- Garder un contrat front/backend stable malgré des modèles différents : `services/http.ts` mappe les formats backend vers les types UI.
- Prévoir un mode IA robuste sans dépendre obligatoirement d'une clé externe : fallback local sur transcript.
- Structurer le projet pour rester compréhensible malgré plusieurs domaines métier.

# Déploiement & Opérations

## Plateformes

- Frontend : Vercel ou Netlify.
  - `vercel.json` redirige toutes les routes SPA vers `index.html`.
  - `netlify.toml` utilise `npm run build` et publie `dist`.
- Backend : Vercel via `api/index.ts` et `vercel.json`.
  - Toutes les routes sont dirigées vers l'entrée serverless.
  - L'API reste également lançable localement avec `npm run dev`.

## Variables d'Environnement Frontend

```env
VITE_API_URL=http://localhost:8000/api
VITE_WS_URL=http://localhost:8000
VITE_DISABLE_REALTIME=false
```

## Variables d'Environnement Backend

```env
NODE_ENV=production
PORT=8000
API_PREFIX=/api
MONGODB_URI=<mongodb-uri>
JWT_ACCESS_SECRET=<secret-fort>
JWT_REFRESH_SECRET=<secret-fort>
CORS_ORIGIN=<url-front>
FRONTEND_URL=<url-front>
SMTP_HOST=<smtp-host>
SMTP_USER=<smtp-user>
SMTP_PASS=<smtp-pass>
OPENAI_API_KEY=<optionnel>
OPENAI_MODEL=gpt-4o-mini
```

## CI/CD Résumé

- Installation des dépendances.
- Vérification TypeScript : frontend `npm run build`, backend `npm run typecheck`.
- Lint : frontend `npm run lint`, backend `npm run lint`.
- Tests : frontend `npm run test`, backend `npm run test`.
- Build de production.
- Déploiement sur la plateforme cible avec variables d'environnement configurées.

## Surveillance et Bilans de Santé

- Healthcheck API : `GET /api/health`.
- Réponse attendue : uptime, état database, timestamp.
- Logs HTTP via Morgan hors environnement de test.
- Logs serveur structurés au démarrage en cas d'échec.
- Points à ajouter en production : monitoring d'erreurs, métriques temps réel, alerting disponibilité, sauvegarde MongoDB.

# Visuels à Intégrer

Insérer 5 à 10 captures ou GIFs haute qualité dans le PDF final. Les emplacements ci-dessous sont prêts pour l'export ; remplacer les placeholders par les images finales du projet.

<div class="visual-grid">
  <div class="visual-slot"><strong>Visuel 01 - Page d'accueil</strong><br>Capture de la proposition de valeur IntellMeet et accès login/register.</div>
  <div class="visual-slot"><strong>Visuel 02 - Authentification</strong><br>Capture inscription ou connexion avec validation utilisateur.</div>
  <div class="visual-slot"><strong>Visuel 03 - Dashboard</strong><br>Capture des indicateurs clés et données récentes.</div>
  <div class="visual-slot"><strong>Visuel 04 - Meeting Room</strong><br>Capture salle de réunion avec participants, contrôles et panneau IA.</div>
  <div class="visual-slot"><strong>Visuel 05 - Chat temps réel</strong><br>Capture du canal de discussion ou conversation pendant réunion.</div>
  <div class="visual-slot"><strong>Visuel 06 - Projets Kanban</strong><br>Capture des colonnes de tâches et changement de statut.</div>
  <div class="visual-slot"><strong>Visuel 07 - Réunions IA</strong><br>Capture d'une synthèse, transcript ou action items.</div>
  <div class="visual-slot"><strong>Visuel 08 - Diagramme d'architecture</strong><br>Insérer version Draw.io/Excalidraw du diagramme ASCII ci-dessus.</div>
</div>

## Démos en Direct Recommandées

- Créer un utilisateur, vérifier l'email puis se connecter.
- Créer un workspace et inviter un membre.
- Créer un projet puis déplacer une tâche dans le Kanban.
- Planifier et rejoindre une réunion.
- Envoyer un message en temps réel.
- Ajouter un transcript, générer une synthèse IA et vérifier les action items.

# Réflexion Personnelle

Ce projet m'a permis de consolider une approche full-stack orientée produit : partir d'un besoin métier clair, puis le traduire en modules, routes, composants et états applicatifs. La partie la plus formatrice a été la coordination entre le temps réel et l'API REST, car une réunion collaborative exige une cohérence immédiate entre présence, chat, notes et états média.

J'ai également renforcé l'importance d'un contrat front/backend explicite. Le fichier `src/services/api.ts` sert de référence côté client, tandis que les schémas Zod du backend sécurisent les entrées. Cette séparation rend le projet plus simple à faire évoluer sans casser les interfaces.

Les meilleures pratiques retenues sont : valider les données dès la frontière API, isoler les domaines métier, garder des variables d'environnement strictes, prévoir un fallback pour les services externes, et documenter les flux critiques avant la phase de déploiement.

## Idées de Roadmap

- Ajouter l'enregistrement vidéo/audio et la transcription automatique.
- Ajouter une vraie gestion de permissions fine par workspace/projet.
- Mettre en place un pipeline CI complet GitHub Actions.
- Ajouter observabilité production : Sentry, logs structurés, métriques Socket.io.
- Ajouter tests end-to-end Playwright sur les parcours login, projet, réunion.
- Ajouter calendrier externe : Google Calendar ou Outlook.
- Ajouter recherche globale dans messages, réunions, projets et fichiers.
- Ajouter export PDF automatique des comptes rendus de réunion.

# Annexe - Résumé des Routes Backend

| Module | Routes principales |
|---|---|
| Health | `GET /api`, `GET /api/health` |
| Auth | `POST /api/auth/register`, `POST /api/auth/verify-email`, `POST /api/auth/resend-verification`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `PATCH /api/auth/change-password` |
| Users | `GET /api/users/me`, `PATCH /api/users/me`, `GET /api/users`, `GET /api/users/:id`, `PATCH /api/users/:id`, `PATCH /api/users/:id/role`, `PATCH /api/users/:id/status`, `DELETE /api/users/:id` |
| Workspaces | `GET /api/workspaces`, `POST /api/workspaces`, `GET /api/workspaces/:id`, `PATCH /api/workspaces/:id`, gestion membres et invitations |
| Projects | `GET /api/projects`, `POST /api/projects`, `GET /api/projects/:id`, `PATCH /api/projects/:id`, `DELETE /api/projects/:id` |
| Tasks | `GET /api/tasks`, `POST /api/tasks`, `GET /api/tasks/:id`, `PATCH /api/tasks/:id`, `DELETE /api/tasks/:id` |
| Meetings | `GET /api/meetings`, `POST /api/meetings`, `GET /api/meetings/:id`, `PATCH /api/meetings/:id`, `DELETE /api/meetings/:id`, join, start, end, extend, presence, signals |
| Chat | `GET /api/chat/meetings/:meetingId/messages`, `POST /api/chat/meetings/:meetingId/messages` |
| Notifications | `GET /api/notifications`, `PATCH /api/notifications/:id/read`, `PATCH /api/notifications/read-all` |
| Media | `GET /api/media`, `POST /api/media`, `GET /api/media/:id`, `DELETE /api/media/:id` |
| AI | `POST /api/ai/meetings/:meetingId/analyze` |
| Dashboard | `GET /api/dashboard/overview`, `GET /api/dashboard/workspaces/:workspaceId/analytics` |

# Annexe - Commandes Utiles

## Frontend

```bash
npm install
npm run dev
npm run build
npm run lint
npm run test
```

## Backend

```bash
cd /home/yassine/Documents/Code/Backend_intellmeet-group_01
npm install
npm run dev
npm run typecheck
npm run lint
npm run test
```

## Export PDF Conseillé

```bash
pandoc docs/INTELLMEET_DOCUMENTATION_PDF.md \
  -o IntellMeet_Documentation_Yassine_harsadash.pdf \
  --from markdown+raw_html \
  --pdf-engine=wkhtmltopdf
```

Si Pandoc ou wkhtmltopdf n'est pas disponible, ouvrir le Markdown rendu dans un éditeur compatible ou convertir en HTML, puis utiliser "Imprimer > Enregistrer en PDF".
