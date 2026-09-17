---
name: designer
description: Apply Eclipse's visual design system and Tailwind CSS v4 conventions when building or refining frontend UI in this repository.
metadata:
  short-description: Apply Eclipse UI and Tailwind v4 rules
---

# Eclipse Designer

Use this skill for frontend interface work in Eclipse: new pages, dashboard sections, components, responsive layouts, visual refinements, and UI reviews. Preserve the existing product architecture and reuse its tokens and components.

## Source of truth

Figma: [Eclipse dashboard](https://www.figma.com/design/qKcavTfClwVkYs5m6amChL/Sin-t%C3%ADtulo?node-id=0-1)

- Canvas: `UI Design`
- Frame: `dashboard`
- Node: `1:3`

## Implementation context

- Target stack: Next.js 15 App Router, React 19, TypeScript strict, and Tailwind CSS v4.
- Define and reuse theme tokens in `src/app/globals.css`.
- Prefer existing UI primitives, layouts, `DashLayout`, and `Heading` components.
- Use `@tabler/icons-react` for interface icons.
- Keep the sidebar fixed and let the content area expand responsively while preserving the spacing ratios of the 1728px reference design.

## Design principles

- Dark-first interface with strong hierarchy, generous spacing, and low visual noise.
- Flat surfaces with subtle elevation created through contrast, not shadows.
- Minimal borders and rounded corners between 4px and 5px.
- Use monospace only where identity or technical metadata benefits from it.
- Favor consistent spacing over decorative elements.
- Maintain high information density without visual clutter.

## Canvas

| Property | Value |
|---|---:|
| Width | 1728px |
| Height | 1117px |
| Sidebar | 324px fixed |
| Content | Fluid |

## Color palette

Expose colors as semantic CSS theme tokens and use those tokens in components.

| Token | Hex | Purpose |
|---|---|---|
| `background` | `#010101` | Application background |
| `surface` | `#060606` | Sidebar, cards, and rows |
| `surface-raised` | `#111111` | Active navigation and separators |
| `text-primary` | `#FAFAFA` | Primary text |
| `text-secondary` | `#676767` | Secondary text |
| `accent` | `#000BDE` | Primary charts and emphasis |
| `accent-muted` | `#676767` | Secondary charts |
| `status-purple` | `#CB30E0` | Project status |
| `status-cyan` | `#00C0E8` | Project status |
| `status-green` | `#34C759` | Project status |
| `alert-red` | `#FF383C` | Error and attention |

Map these concepts to the existing project tokens where they already exist; do not introduce duplicate hardcoded colors.

## Typography

| Element | Font | Weight | Size |
|---|---|---:|---:|
| Page title | Roboto Flex | 400 | 24px |
| Card title | Roboto Flex | 700 | 24px |
| Section title | Roboto Flex | 600 | 16px |
| Body | Roboto Flex | 400 | 15px |
| Description | Roboto Flex | 300 | 12px |
| Metadata | Roboto Flex | 400 | 12px |
| Date labels | Roboto Flex | 400 | 11px |
| Sidebar username | Roboto Mono | 400 | 12px |
| Sidebar items | Roboto Mono | 400 | 10px |

## Icons

Use 19–20px icons. Active icons use primary text; inactive icons use secondary text.

| Purpose | Suggested icon |
|---|---|
| User | `IconUser` |
| Sidebar toggle | `IconLayoutSidebar` |
| Overview | `IconHome` |
| Mail | `IconMail` |
| Issues | `IconBug` |
| Agents | `IconSparkles` or `IconRobot` |
| Projects | `IconFolders` |
| External link | `IconArrowUpRight` |
| Session | `IconTerminal2` |

## Layout and components

### Sidebar

Use a fixed 324px sidebar with the `surface` background. It contains the user profile, navigation, and settings action.

Navigation items are Overview, My mails, Issues, Agent, and Projects. The selected item uses `surface-raised` and primary text; inactive items have a transparent background and secondary text.

### Header

Include the page title and a one-pixel horizontal divider using `surface-raised`.

### Current Issues

Use an approximately 860 × 140px `surface` card with a 5px radius. Include the issue summary, severity counters, total issues, and a vertical bar chart. Severity colors are Important → red, Medium → amber, and Low → gray. Charts use rectangular bars, `accent` for primary bars, `accent-muted` for secondary bars, minimal axis styling, no gradients, and no animation.

### Projects

Use an approximately 842 × 128px `surface` card with a 4px radius. Include title, description, status indicator, and external actions. An attention state uses a one-pixel `alert-red` border.

### Agent Sessions

Group sessions by date, such as Today and Yesterday. Session rows are approximately 842 × 37px, use a 5px radius and `surface` background, and contain an agent icon and description.

### Component rules

- Cards are flat, use a 4–5px radius, and have no shadows.
- Add borders only for attention states, with an explicit border color.
- Status is represented by colored dots only; do not use badges or pills.
- Extract repeated utility groups into reusable components instead of duplicating long class strings.
- Keep long labels resilient at narrow widths with wrapping, constraints, or line limits appropriate to the content.

## Tailwind CSS v4

Always generate Tailwind v4 code. Do not use Tailwind v3 patterns.

### CSS configuration

Use CSS-first configuration:

```css
@import "tailwindcss";

@theme {
  --color-background: #010101;
  --color-surface: #060606;
  --color-accent: #000bde;
}
```

The project already imports Tailwind from `src/app/globals.css`; extend its existing `@theme` tokens when needed. Never use `@tailwind base`, `@tailwind components`, or `@tailwind utilities`.

### Utility conventions

- Prefer Tailwind utilities over custom CSS for layout: flex, grid, gap, space, container, and aspect-ratio.
- Prefer semantic theme colors such as `bg-background`, `bg-surface`, `text-primary`, and `border-surface` over arbitrary colors.
- Prefer framework spacing and sizing utilities such as `w-4`, `w-8`, `h-10`, `min-w-64`, and `max-w-96`.
- Use arbitrary values only when no equivalent utility exists, such as a precise `w-[278px]` required by the reference layout.
- Use v4 radius names such as `rounded-xs`, `rounded-sm`, `rounded`, and `rounded-lg`.
- Use v4 shadow names such as `shadow-xs`, `shadow-sm`, `shadow`, and `shadow-lg`; cards in this design normally need no shadow.
- Use `outline-hidden` when an outline must be visually hidden.
- Specify border colors explicitly when borders are present, for example `border border-surface`.
- Use modern opacity syntax such as `bg-black/50`, `text-white/40`, and `border-white/20`; never use legacy `*-opacity-*` utilities.

### Avoid

```tsx
<div className="w-[16px] bg-[#010101] bg-opacity-50 outline-none" />
```

Prefer semantic, token-based utilities:

```tsx
<div className="w-4 bg-background outline-hidden" />
```
