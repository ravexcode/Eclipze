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

## Code Readability

- Always prioritize readable code over compressed or clever code.
- Keep logical blocks, objects, callbacks, conditionals, and JSX elements expanded when that improves scanning.
- Use descriptive names, consistent indentation, and whitespace to make nesting and control flow obvious.
- Do not collapse multiple operations or JSX elements into one line merely to reduce file length.

## Code Organization

- Constants declared outside the main function belong in `src/constants/`, using the main file or directory name as the module name.
- Functions that are not React components belong in `src/utils/`, using the main file or directory name as the module name.
- Reusable React components belong in `src/components/`, using the main file or directory name as the module name.
- Keep the main page or feature file focused on orchestration; import extracted constants, functions, and components from their respective modules.
