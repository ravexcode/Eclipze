# Agents page redesign

## Objective

Redesign the Agents page as a clear, responsive prompt workspace while preserving the current prompt and model selection behavior.

## Problem and rationale

The page currently presents only a compact prompt field and model selector in a centered box. It lacks a page heading, guidance, and a responsive visual hierarchy. The route has no submit or run action, so the redesign must not imply that prompts execute.

## Authorized scope

- `src/app/agents/page.tsx`
- Keep all work and commits on `master`, as requested.
- Commit the pre-existing selector changes before starting this redesign: `9e9b132`.

## Constraints

- Keep the controlled prompt and model state and preserve `SelectorInput` behavior.
- Reuse `Heading`, `DashLayout`, existing Eclipse theme tokens, and current components.
- Use readable JSX and responsive spacing; no new dependencies or invented status/data.
- Do not add a submit/run affordance while the page has no execution action.
- Keep the implementation to `page.tsx`; no shared component changes are needed.

## TDD and checks

- TDD mode: unknown. No project or session TDD setting was found in the inspected configuration or Engram results.
- This task is presentation-only and preserves existing interactions, so no behavior tests are planned and no test runner is selected.
- Applicable checks: `pnpm build` (project-documented typecheck/build) and `git diff --check`.

## Delivery plan

- Route: direct inline.
- Route evidence: the implementation is a single-page composition change; mapping across the existing page, input, selector, layout, and tokens was delegated before implementation.
- Forecast: approximately 100 authored changed lines, excluding generated files.
- Delivery strategy: `ask-on-risk` (default); forecast is below the approximately 400-line delivery budget.
- Branch: `master`, per explicit user instruction.

## Tasks

- [x] AGENT-PAGE-1 — Built a responsive Agents heading and prompt workspace with token-based hierarchy and accessible labeling, preserving the current controlled prompt and model selector. No execution behavior was added. Route: direct inline.

## Acceptance criteria

- The Agents page has a clear page title, concise prompt guidance, and a responsive composer.
- The prompt remains editable and model selection continues to update the displayed model.
- Existing design tokens provide colors and focus treatment; surfaces remain flat with compact radii.
- The page does not present a send/run action or fabricated agent activity.

## Progress and verification evidence

- Exploration complete: `DashLayout` supplies the dashboard shell; `Heading` provides the shared title/divider; `AgentsInput` and `SelectorInput` retain the current input and selector interactions.
- Baseline checkpoint committed on `master`: `9e9b132 fix(agents): make model selector functional`.
- `git diff --check` passed.
- `pnpm build` passed after correcting a JSX closing-tag error from the first build attempt. The successful build still reports three dynamic-filesystem tracing warnings in the generated Prisma client and existing `src/lib/agent-runner.ts` path.
- Build changed `next-env.d.ts`, which was clean before validation; restored it to `HEAD`.
- Browser rendering and interaction QA were not run; the existing prompt and selector wiring were preserved and the production build passed.
- Work-unit commit for AGENT-PAGE-1 is pending.

## Next step

Create the work-unit commit for AGENT-PAGE-1 on `master`, then record its commit identity in this document and the Engram mirror.
