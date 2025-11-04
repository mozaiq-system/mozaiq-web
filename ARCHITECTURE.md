# Project: MOZAIQ Web
> AI Context Reference Document – for AI-assisted development (Continue / Cursor / Claude Code / etc.)

## 1. Stack Overview
- Framework: Next.js 14 (App Router)
- Language: TypeScript (.ts / .tsx)
- Styling: TailwindCSS 4.1 + tw-animate-css
- Package Manager: pnpm
- Build Tool: Next.js built-in compiler
- IDE: VS Code (Continue + Ollama local model)
- Run: `pnpm dev`
- Build: `pnpm build`

## 2. Folder Structure
app/ # Next.js App Router pages
components/ # Main UI & Feature components
components/ui/ # Reusable atomic UI (shadcn-style)
hooks/ # Custom React hooks
lib/ # Core logic, storage adapters, utilities
styles/ # Global CSS & theme tokens
public/ # Static assets

Data flow direction:
`components → hooks → Zustand Store → lib/storage-adapter → storage(local/http)`

## 3. Data Flow & State Management
### Current (Local Mode)
[UI Components]
↕
[Storage Adapter Interface]
↳ LocalStorage Implementation

- Zustand manages in-memory state (tags, playlists, media)
- Adapter abstracts persistence logic using LocalStorage

### Future (Server Mode)
[UI Components]
↕
[Zustand Store] ←→ [Storage Adapter Interface]
↳ HttpStorage (Spring Boot REST API)
↳ PostgreSQL via JPA/QueryDSL

- React Query will handle async server data (cache, retry, error)
- Zustand remains for UI/session-level state

## 4. API Integration
| Layer | Description |
|-------|--------------|
| Frontend | Fetch via `HttpStorageAdapter` |
| Backend | Kotlin + Spring Boot |
| Database | PostgreSQL |
| Base URL | `https://api.mozaiq.app/api/v1` (TBD) |
| Endpoints | `/tags`, `/media`, `/playlists` |
| Auth | Future JWT / cookie session |
_Currently all data stored in LocalStorage._

## 5. Development & Quality Flow
| Task | Command | Tool |
|------|----------|------|
| Run Dev Server | `pnpm dev` | Next.js |
| Build | `pnpm build` | Next.js |
| Lint | `pnpm lint` | ESLint |
| Test | `pnpm test` | Vitest + React Testing Library |
| Format | Prettier on save | Prettier |
| Commit | Conventional Commits | Git |
| Branch | `feat/*`, `fix/*`, `refactor/*` | Git |

## 6. Testing Strategy
- Unit & Integration: Vitest + React Testing Library
- E2E (later): Playwright
- Start with:
  - Tag autocomplete hook
  - Component rendering & accessibility

## 7. Migration Plan
1. Local prototype (current)
2. Introduce `StorageAdapter` interface
3. Add `HttpStorageAdapter`
4. Connect to Spring Boot API
5. Introduce React Query
6. Add PWA & mobile optimizations

## 8. AI Usage Guide
- When adding components: use `components/` or `components/ui/` depending on scope  
- When managing state: use Zustand store (`hooks/` or `stores/`)  
- When persisting data: go through `StorageAdapter` in `lib/`  
- When creating tests: mirror file structure with `.test.ts(x)` suffix  
- Avoid direct localStorage access in components  
- Keep `ARCHITECTURE.md` updated when structure or data flow changes