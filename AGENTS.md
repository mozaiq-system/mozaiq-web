# Repository Guidelines

## Project Structure & Module Organization
The Next.js app router lives in `app/`. Shared UI sits in `components/`, with `components/ui` housing shadcn primitives imported through the `@/components` alias from `components.json`. Hooks belong in `hooks/` and should expose a single `use*` entry point. Cross-cutting utilities live in `lib/`, including helpers like `lib/utils.ts`. Global styles and Tailwind tokens are managed in `app/globals.css` and `styles/`, while static assets go in `public/`. Consult `ARCHITECTURE.md` before mapping new feature areas.

## Build, Test, and Development Commands
- `pnpm install`: Sync dependencies after branching or pulling.
- `pnpm dev`: Launch the Next dev server on port 3000 with hot reload.
- `pnpm build`: Produce an optimized production bundle; run before shipping.
- `pnpm lint`: Execute the Next + TypeScript ESLint rules; commits should pass cleanly.
- `pnpm start`: Serve the compiled build locally for smoke testing.

## Coding Style & Naming Conventions
Use TypeScript with two-space indentation and follow existing module patterns. Components are `PascalCase` (`CustomerDrawer.tsx`), hooks are `camelCase` prefixed with `use`, and utility modules use noun-based filenames (`dateFormatter.ts`). Favor server components inside `app/`; add `"use client"` only when browser APIs are required. Tailwind CSS powers layout: order classes layout → spacing → color, and lean on `class-variance-authority` when variants emerge. Run `pnpm lint` before pushing.

## Testing Guidelines
Automated testing is not yet configured. For each feature, document manual QA steps in the PR and evaluate whether introducing Vitest + Testing Library is justified—coordinate with maintainers first. Place any new tests alongside their source (`components/Header.test.tsx`) and focus on critical flows such as validation and navigation guards.

## Commit & Pull Request Guidelines
Follow the existing convention: `MOZREQ-<ticket> | concise summary` (example: `MOZREQ-12 | add onboarding hero`). Group logical changes into separate commits. PRs should outline the problem, highlight the solution, and list validation evidence. Link the Mozaiq ticket, attach UI screenshots or recordings for visual updates, and call out new environment variables or migrations. Request review from at least one core engineer.

## Environment & Security
Store secrets only in `.env.local` and never commit them. Prefix client-exposed values with `NEXT_PUBLIC_` so they can be safely referenced in components. If leakage is suspected, rotate credentials immediately and notify the team via the security channel.

## Folder Structure
app/ # Next.js App Router pages
components/ # Main UI & Feature components
components/ui/ # Reusable atomic UI (shadcn-style)
hooks/ # Custom React hooks
lib/ # Core logic, storage adapters, utilities
styles/ # Global CSS & theme tokens
public/ # Static assets

