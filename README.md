# IntellMeet — Frontend

A production-ready React + Vite + TypeScript frontend for an AI-powered meeting platform (HD video, real-time chat, AI summaries & action items, multi-team Kanban).

> **Status**: All UI flows are functional with a swappable mock backend (`localStorage`). Wire your real backend by replacing `src/services/mock` with an HTTP/Socket.io implementation. See `/mnt/documents/architecture/` for full backend specs.

---

## Stack

- **React 18** + **Vite 5** + **TypeScript 5**
- **Tailwind v3** + **shadcn/ui** + Lucide icons
- **Zustand** (state) · **react-router-dom** (routing) · **react-i18next** (EN/FR/ES)
- **date-fns** · **Zod** · **sonner** (toasts)

## Quick start

```bash
bun install
bun run dev
```

App runs at `http://localhost:5173`. Default language is **English** (auto-detected, persisted in `localStorage` under `intellmeet.lang`).

## Project structure

```
src/
├── pages/              # Route-level screens (Dashboard, Projects, Chat, MeetingRoom, Auth, …)
├── components/         # Reusable UI (AppShell, modals, theme, language switcher)
├── features/meeting/   # Meeting room widgets (controls, sidebar, AI panel, tiles)
├── store/              # Zustand stores (auth, projects, chat, meetings, ui, notifications)
├── services/
│   ├── api.ts          # ⭐ Backend contract — implement this to plug a real API
│   ├── types.ts        # Domain types (User, Team, Project, Task, Meeting, …)
│   ├── mock/           # localStorage-backed mock implementation
│   └── index.ts        # Single export point: `export const api = mockApi;`
├── i18n/               # Locales + react-i18next setup
└── assets/             # Images
```

## Switching to a real backend

`src/services/api.ts` defines every method the app uses. To plug a real backend:

1. Create `src/services/http.ts` implementing the `API` interface (Auth/Meetings/Projects/Chat/Notifications/AI).
2. Edit **one line** in `src/services/index.ts`:
   ```ts
   export const api = httpApi; // was: mockApi
   ```
3. Set env vars (`.env`):
   ```env
   VITE_API_URL=http://localhost:8000/api
   VITE_WS_URL=http://localhost:8000
   ```

For local integration, make sure the backend `CORS_ORIGIN` includes the frontend URL, usually `http://localhost:8080`.

A complete backend spec (REST endpoints, Socket.io events, WebRTC signaling, Postgres schema, Helm/K8s deployment) lives in `/mnt/documents/architecture/`:
- `01_ARCHITECTURE.md` — overview, stack, security, observability, migration plan
- `02_API_CONTRACTS.md` — all Zod schemas + REST routes
- `03_FRONTEND_ADAPTER.md` — `http.ts` skeleton + `useWebRTC` hook

## Domain model (key entities)

| Entity   | Notes                                                                  |
|----------|------------------------------------------------------------------------|
| `User`   | id, email, fullName, role (`owner`/`admin`/`member`)                  |
| `Team`   | Top-level grouping (Product, Engineering, Design, …)                  |
| `Project`| Belongs to a Team. Holds tasks. Has `key` (e.g. `Q2`), `color`        |
| `Task`   | Belongs to a Project. Has `status` (5 columns), `priority`, `dueDate` |
| `Meeting`| `scheduled`/`live`/`ended`, participants, AI summary, transcript      |
| `Channel`| Chat channel (`channel` or `dm`)                                       |

Tasks are scoped per project. The Projects page exposes a **team switcher → project switcher → 3 view modes** (Kanban with drag-and-drop, sortable list, monthly calendar).

## i18n

Translations live in `src/i18n/locales/{en,fr,es}.json`. EN is the source of truth — keep keys identical across files. Add a new language:

1. Create `src/i18n/locales/<code>.json` (copy `en.json` and translate).
2. Register it in `src/i18n/index.ts` (`SUPPORTED_LANGUAGES` + `resources`).

## Scripts

```bash
bun run dev       # dev server
bun run build     # production build
bun run preview   # serve build
bunx vitest run   # unit tests
```

## License

Proprietary — IntellMeet © 2026.
