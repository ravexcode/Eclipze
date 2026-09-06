# Eclipse Agents

## Do - Don't

### DON'T
1. **NEVER READ / EDIT / DELETE / COMMIT** .env and their variants, only .env.example access
2. **NEVER** commit, let to the developer make the decision.
3. **NEVER** implement not required code or features.
4. **NEVER** Install not required packages.

### DO
1. **ASK WHEN YOU NEED**, not make supositions about the task.
2. **ALWAYS FOLLOW** this pattern: i plan -> i build -> i verify


## Design
./DESIGN.md (dark dev-dashboard, Figma-derived palette, Roboto Flex + Roboto Mono)

## Tech stack (actual)
- Next.js 15 (App Router), React 19, TypeScript (strict)
- Tailwind CSS v4 (`@theme` tokens in `src/app/globals.css`)
- Tabler icons (`@tabler/icons-react`)
- Prisma + PostgreSQL (client at `prisma/generated/client`, singleton `src/lib/prisma.ts`)
- Lenis smooth scroll (provider `src/lib/lenis.tsx` in root layout)
- Resend for auth emails (`src/lib/auth-email.ts`)
- pnpm, `@/*` path alias → `./src/*`
- No lint script; verify with `pnpm build` (runs typecheck)

## Structure & real conventions
- `src/app/` App Router. Root `layout.tsx` wraps children in Lenis; `page.tsx` = marketing landing.
- **Auth guard pattern**: each protected section (`/dashboard`, `/issues`, `/mails`, `/agents`, `/projects`) has a server `layout.tsx` calling `await requireAuthenticatedUser()` from `src/lib/auth.ts` (session cookie `token`, Prisma-backed). `/auth` layout redirects signed-in users to `/dashboard`.
- **Dashboard pages** are client components (`"use client"`) wrapping content in `<DashLayout current="..." router={router}>` (uses `useRouter`). DashLayout fetches `/api/auth/me` for the sidebar user.
- Auth flow (signin/signup/verify-2fa/verify-email/resend-code) is a multi-step client form `src/components/pages/auth.tsx` + `src/components/forms/auth/`. Steps: `credentials` → `verify_email` / `verify_2fa`. API responses use `AuthApiResponse` shape.
- **API routes** (`src/app/api/*`) are plain Next route handlers returning `NextResponse.json({ message, ... })`; server-only auth helpers live in `src/lib/auth.ts` (scrypt hashing, verification codes, session mgmt).
- Components split: `src/components/ui/` (button, heading, header), `src/components/layouts/` (dash, marketing), `src/components/sidebar.tsx`, `src/components/forms/auth/`, `src/components/pages/auth.tsx`.
- Types in `src/types/`, utils (pure fns, e.g. `avatar-url.ts`, `greeting.ts`) in `src/utils/`.
- UI conventions: `rounded-sm`, `bg-background-card`, `bg-background-focus`, `text-foreground-off`, accent `#000bde`; animation utilities from `tailwind-animations` (`animate-fade-in-up`, etc.); buttons via `src/components/ui/button.tsx` variants `main`/`secondary`/`ghost`.
- Placeholder pages (issues/mails/agents/projects) are thin `DashLayout` + `Heading` shells; dashboard/home use hardcoded empty-state content.
- Events: avatar/profile updates dispatch window event `user-updated` to refresh sidebar via token.

## Do - Don't rules
(Applies above global project rules — see top of file.)
- Follow the `layout.tsx` guard + `DashLayout` + `Heading` pattern for any new dashboard page.
- Reuse existing ui components and theme tokens; don't hardcode new hex colors.
- Pure helpers go in `src/utils/`, server-only logic in `src/lib/`, shared types in `src/types/`.
