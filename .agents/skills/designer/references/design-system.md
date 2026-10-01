# Eclipse implementation conventions

## Stack and code placement

- Next.js 15 App Router, React 19, strict TypeScript, Tailwind CSS v4, pnpm, and Tabler icons.
- Tailwind is imported and configured in `src/app/globals.css` with CSS-first `@theme` tokens. Do not use Tailwind v3 directives or patterns.
- Constants outside the main component belong in `src/constants/<feature>.ts`.
- Non-component helpers belong in `src/utils/<feature>.ts`.
- Reusable React components belong in `src/components/<feature>/` or the existing component convention for that feature.
- Keep route/page files focused on orchestration. Read `.agents/STRUCTURE.md` and `.agents/RULES.md` when they affect the requested work.

## Existing theme tokens

Reuse these semantic values from `src/app/globals.css`; confirm the live file before changing them.

| Token | Value | Use |
| --- | --- | --- |
| `background` | `#010101` | Main canvas |
| `background-card`, `surface` | `#060606` | Cards and quiet surfaces |
| `background-focus`, `surface-raised` | `#111111` | Active or raised surface |
| `foreground` | `#FAFAFA` | Primary text |
| `foreground-off` | `#676767` | Secondary text |
| `accent` | `#0C47B4` | Primary interaction accent |
| `accent-strong` | `#000BDE` | Strong interaction accent |
| `status-purple` | `#CB30E0` | Purple status |
| `status-cyan` | `#00C0E8` | Cyan status |
| `status-green` | `#34C759` | Green status |
| `alert-red` | `#FF383C` | Error/attention |

Some Figma layers use direct fills or variables that differ from similarly named app tokens. Inspect the selected layer and map it to the closest existing semantic token; add or adjust tokens only when the design evidence requires it.

## Layout and responsive behavior

- Preserve the proportions and alignment of the exact Figma frame at its reference size, then adapt via responsive grid/flex layouts for smaller screens.
- Prefer existing layouts, buttons, headers, and feature primitives over new parallel implementations.
- Use flat dark surfaces, minimal borders, small radii, and spacing that follows the Figma hierarchy. Avoid decorative shadows or gradients unless they appear in the target frame.
- Use Tabler icons and the project's existing icon sizing. Do not replace a Figma asset with a hand-drawn approximation when the actual asset is available.
- Keep keyboard focus and links/buttons accessible; visual fidelity does not override working semantics.
