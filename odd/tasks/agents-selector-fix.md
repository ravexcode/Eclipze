# Agents selector fix

## Objective

Make the Agents page model selector functional and keep its page-level interaction coherent without changing unrelated Agents workspace behavior.

## Scope

- `src/components/ui/selector.tsx`
- `src/app/agents/page.tsx`

## Constraints

- Preserve existing public selector props and dashboard tokens.
- Keep JSX expanded and readable.
- No new dependencies or environment changes.

## Tasks

- [x] AGENT-SELECTOR-1 — Selector options update the current value and close the menu. Route: delegated writer.
- [x] AGENT-SELECTOR-2 — Agents page removes dead handler and uses a usable selector width. Route: delegated writer.

## Acceptance criteria

- Clicking a model option updates the displayed model and closes the menu.
- The selector uses button/listbox semantics and keeps toggle behavior separate from option selection.
- The Agents page has no dead local send handler and model labels have room to render.

## Verification evidence

- `pnpm typecheck` passed.
- `pnpm build` passed; it emitted pre-existing Prisma/Turbopack dynamic filesystem warnings.
- `git diff --check` passed.
- Build-generated `next-env.d.ts` and `tsconfig.tsbuildinfo` were restored because they were clean and unrelated before validation.

## Next step

User reviews the two-file diff; no commit was created.
