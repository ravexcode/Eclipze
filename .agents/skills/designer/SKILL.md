---
name: designer
description: "Trigger: Eclipse frontend UI, Figma-to-code, visual refinements. Reproduce approved Figma frames using Eclipse's design system and project conventions."
license: UNLICENSED
metadata:
  author: Eclipse
  version: "2.0"
---

## Activation Contract

Load for any frontend interface work in `/home/ravexcode/eclipse`, especially when implementing or refining a screen from the Eclipse Figma file.

## Hard Rules

- Treat the `UI Design` page in the linked Eclipse workspace file as the current design source. Do not use `UI Design Backup` unless the user asks.
- Inspect the exact target frame and its relevant child layers before coding. For `get_design_context`, follow the Figma `figma-design-to-code` skill, request its screenshot, and use its high-fidelity response. If unavailable, inspect the already-open Figma tab through the UI as described in [figma-ui-design.md](references/figma-ui-design.md).
- Match the frame's content, hierarchy, assets, colors, and typography. Use the exact Figma asset for each designed image, store it locally, and verify its placement and crop. Do not leave temporary asset URLs or substitute a full-frame screenshot for interactive app UI.
- Preserve existing app behavior, routing, auth, data, and reusable components. Do not introduce mock product content to make a screen resemble the design.
- Use Next.js 15 App Router, React 19, TypeScript strict, Tailwind CSS v4, and Tabler icons. Reuse existing theme tokens from `src/app/globals.css`; add a token only when the design requires a value not already represented.
- Keep code readable. Extract reusable components into `src/components/`, non-component helpers into `src/utils/`, and constants into `src/constants/`.

## Decision Gates

| Situation | Action |
| --- | --- |
| Figma design-context tools work | Read the target frame context and screenshot, then inspect the relevant child frames/assets. |
| Figma connector is rate-limited or unavailable | Inspect the existing Figma browser tab; select the named frame, zoom to selection with `Shift+2`, and expand its layers in the UI. |
| A frame or asset cannot be inspected clearly | Ask the user to expand or select that item, or provide its frame URL; do not guess its appearance. |

## Execution Steps

1. Read the applicable project `AGENTS.md`, inspect target files and existing components, and record the working-tree state.
2. Resolve the screen to a named frame in [figma-ui-design.md](references/figma-ui-design.md). Inspect full-frame layout first, then expand and inspect only the nested layers needed to identify text, assets, sizing, and styles.
3. Map the design to existing routes, data, tokens, and components. Keep dynamic data dynamic and preserve the current product behavior.
4. Implement responsive layouts with Tailwind v4 and the existing tokens. Keep the reference frame's proportions at its target size while adapting cleanly to smaller screens.
5. Compare the requested screen with the Figma frame at a similar viewport. Fix visible mismatches in hierarchy, spacing, typography, colors, and image crop before finishing.
6. Run `pnpm build` for the repository's standard type/build check. Do not add or run tests unless the user asks. Report exactly what passed and any remaining visual/runtime gap.

## Output Contract

Report the changed files, the Figma frames used, the verification performed, and any remaining mismatch or access limitation. Link local files with absolute paths.

## References

- [Figma frames and UI inspection workflow](references/figma-ui-design.md)
- [Eclipse stack, tokens, and interface conventions](references/design-system.md)
