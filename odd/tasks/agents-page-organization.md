# Agents page organization

## Objective
Organize the Agents page by moving types/constants, pure helpers, and reusable UI into their project-standard locations while keeping behavior unchanged.

## Problem
`src/app/agents/page.tsx` currently contains data models, constants, normalization/API helpers, shared UI primitives, stateful orchestration, and the full JSX surface in one 1150-line file.

## Scope
- `src/app/agents/page.tsx`
- `src/constants/agents.ts`
- `src/utils/agents/`
- `src/components/agents/`
- No backend, package, environment, or visual redesign changes.

## Constraints
- Preserve expanded JSX/readability and existing Eclipse tokens.
- Preserve current API behavior and user-visible copy.
- No automatic commit.

## Tasks
- [x] AGENTS-ORG-1 Extract Agents constants and domain types — `src/constants/agents.ts`.
- [x] AGENTS-ORG-2 Extract pure normalization/request/date/status helpers — `src/utils/agents/normalizers.ts`.
- [x] AGENTS-ORG-3 Extract reusable Agents UI components and keep page orchestration-focused — `src/components/agents/primitives.tsx`.
- [x] AGENTS-ORG-4 Run checks and review the diff for scope drift — `pnpm build` passed; `git diff --check` passed.

## Acceptance criteria
- The page remains behaviorally equivalent and imports extracted modules cleanly.
- Constants live in `src/constants/agents.ts`.
- Non-component helpers live under `src/utils/agents/`.
- Reusable UI components live under `src/components/agents/`.
- `pnpm build` passes.

## Verification
- `pnpm build`
- `git diff --check`

## Progress
- Completed without commits; source and task files remain as local changes for user review.
- Route: direct inline because no delegated worker surface is available in this runtime; CodeGraph was used before inspection.
- TDD: strict TDD instruction is present globally, but this is a structural refactor without new behavior tests; use the repository build and diff checks.
