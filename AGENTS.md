# Eclipse Agents

## Tech stack (Current)
- Next.js 15 (App Router), React 19, TypeScript (strict)
- Tailwind CSS v4 (`@theme` tokens in `src/app/globals.css`)
- Tabler icons (`@tabler/icons-react`)
- Prisma + PostgreSQL (client at `prisma/generated/client`, singleton `src/lib/prisma.ts`)
- Lenis smooth scroll (provider `src/lib/lenis.tsx` in root layout)
- Resend for auth emails (`src/lib/auth-email.ts`)
- pnpm, `@/*` path alias → `./src/*`
- No lint script; verify with `pnpm build` (runs typecheck)

## Links

- [Rules](./.agents/RULES.md)
- [Project Structure](./.agents/STRUCTURE.md)
- [Design](./.agents/DESIGN.md)
