# Eclipse design refresh

## Objective

Apply the PDF reference and the Eclipse `designer` skill to the landing, authentication, verification, dashboard, and not-found views without changing auth contracts or route behavior.

## Constraints

- Preserve the existing local changes in `src/app/globals.css`.
- Preserve `.atl/` and `.codegraph/` workspace artifacts.
- Keep JSX expanded and readable; do not run a mass formatter.
- No commits, endpoint changes, Prisma changes, or silent fallback behavior.
- Strict TDD is enabled for this project; current test/build runner is `pnpm build` unless repository evidence shows otherwise.

## Tasks

- [x] DESIGN-001 — Establish shared semantic design tokens and typography while preserving the existing globals diff.
- [x] DESIGN-002 — Refresh shared marketing, authentication, form, input, button, and error presentation components.
- [x] DESIGN-003 — Refresh dashboard shell, sidebar, heading, overview cards, and shared responsive layout.
- [x] DESIGN-004 — Refresh landing and 404 presentation using the same visual system.
- [x] DESIGN-005 — Run build and visual/responsive checks; record evidence and unresolved gaps.

## Acceptance criteria

- All PDF reference views use the dark Eclipse visual system with semantic tokens, flat surfaces, restrained borders, and readable responsive spacing.
- Existing routes, session behavior, authentication submissions, verification, resend, navigation, and logout remain functional.
- Dashboard sidebar remains fixed at the reference proportion on desktop and remains usable on narrow screens.
- `pnpm build` result is recorded honestly.
- No unrelated local work is overwritten.

## Progress

- Route: delegated direct implementation, with one bounded writer and a separate verification pass.
- Current state: implementation and configured build verification are complete; pre-existing `package.json`, `pnpm-lock.yaml`, `src/app/globals.css`, `.atl/`, and `.codegraph/` were preserved.
- Evidence: `pnpm build` exited 0 with TypeScript passing and 36 static pages generated; two non-blocking Prisma filesystem-tracing warnings were reported. `git diff --check` exited 0. Browser QA confirmed the refreshed landing, sign-in, sign-up, verify-email, forgot-password, 404, and unauthenticated `/dashboard` redirect to `/auth/signin`. Landing and sign-in had no horizontal overflow at 390px.
- Remaining gaps: authenticated dashboard visual QA, logout, and successful verification/resend submissions were not run because no test account/session was available. Screenshot capture was unusable, so visual checks relied on rendered DOM and layout metrics. Native RDD review could not advance because the workspace contained untracked artifacts requiring a schema-bound intended-untracked selection; no review approval is claimed.
