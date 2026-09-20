# Agents Workspace + Code Runner

## Objective

Build a complete `/agents` workspace with Eclipse UI, agent/session CRUD, selectable skills, connected repositories, and a bounded code-runner contract.

## Constraints

- Preserve existing auth and provider credential handling.
- Use existing Eclipse tokens and readable expanded JSX.
- Do not commit automatically.
- No plaintext secrets in prompts, logs, or responses.
- Runner must isolate per-user/session workspaces and enforce command/resource limits.

## TDD

- Mode: strict TDD enabled by project instructions.
- Runner: `pnpm test` if available; otherwise `pnpm build` plus focused API checks.
- Evidence source: repository instructions and current package scripts.

## Tasks

- [x] AG-1 Define repository, skill, run, and event types; extend Prisma schema and migrations.
- [x] AG-2 Implement repository/skill/run APIs with ownership, validation, limits, and event persistence.
- [x] AG-3 Implement isolated runner service with allowlisted commands, cancellation, cleanup, and streaming events.
- [x] AG-4 Implement complete Agents page UI: composer, CRUD, skills, session list, activity, diff/error states.
- [ ] AG-5 Add focused tests and complete manual browser QA.

## Acceptance Criteria

- Authenticated user can create/update/delete agents.
- User can connect a repository, select skills, start/cancel a run, inspect events, and see final status.
- Commands outside allowlist require approval or are blocked.
- Runner cannot access another user's workspace.
- UI works at mobile and desktop widths and uses semantic Eclipse tokens.

## Route Evidence

- AG-1/AG-2/AG-3: delegated writer; multi-file backend and schema work.
- AG-4: delegated writer; multi-file React/UI work.
- AG-5: delegated verification after implementation.

## Progress

- Plan accepted by user.
- Branch: `codex/agents-code-runner`.
- Implementation complete through AG-4. AG-5 remains open: no test script/focused tests and no authenticated browser QA. External repository materialization remains explicitly blocked until provider credentials/contracts are available.

## Verification Evidence

- `pnpm lint` — pass; one pre-existing unused `index` warning in `src/components/sidebar.tsx`.
- `pnpm typecheck` — pass.
- `pnpm prisma validate` — pass.
- `pnpm build` — pass; Prisma/Turbopack dynamic filesystem tracing warnings remain.
- `git diff --check` — pass.
- Structural follow-up remains open: split oversized `src/app/agents/page.tsx`, harden canonical workspace containment, and make event sequence allocation race-safe.
- No commit created. No `.env` file changed. No packages installed.
