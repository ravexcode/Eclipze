# DESIGN.md — "Eclipse" Dashboard

Source of truth: Figma file [Sin título](https://www.figma.com/design/qKcavTfClwVkYs5m6amChL/Sin-t%C3%ADtulo?node-id=0-1) (frame `dashboard`, node `1:3`, canvas "UI Design").

This app is a dark developer-dashboard ("Overview" page) with a sidebar, an issues summary panel with a bar graph, a projects list, and agent session history.

## Canvas

- Desktop frame: **1728 × 1117**
- Main layout: fixed sidebar (324px) + fluid content area (1404px)

## Color palette

| Token | Hex | Usage |
|---|---|---|
| `background` | `#010101` | Page / frame background |
| `surface` | `#060606` | Sidebar container, cards, session rows |
| `surface-raised` | `#111111` | Selected sidebar option, heading divider line |
| `text-primary` | `#fafafa` | Headings, active labels, primary text |
| `text-secondary` | `#676767` | Inactive nav options, descriptions, timestamps |
| `accent` | `#000bde` | Graph bars (data series) |
| `accent-muted` | `#676767` | Graph bars (secondary series) |
| `status-purple` | `#cb30e0` | Project status dot (e.g. "Nex0 App") |
| `status-cyan` | `#00c0e8` | Project status dot (e.g. "Web scrapper"; card has red `#ff383c` border) |
| `status-green` | `#34c759` | Project status dot (e.g. "Documents scanner") |
| `alert-red` | `#ff383c` | Attention border on project cards |

## Typography

Monospace brand: **Roboto Mono** · UI text: **Roboto Flex**

| Style | Font | Weight | Size |
|---|---|---|---|
| Page title ("Overview") | Roboto Flex | 400 | 24px |
| Card title ("Nex0 App") | Roboto Flex | 700 | 24px |
| Section subtitle ("Current issues", "Projects", "Agents sessions") | Roboto Flex | 600 | 16px |
| Session row text | Roboto Flex | 400 | 15px |
| Meta text ("36 issues") | Roboto Flex | 400 | 12px |
| Card description | Roboto Flex | 300 | 12px |
| Date group label ("Today", "Yesterday") | Roboto Flex | 400 | 11px |
| Sidebar user name | Roboto Mono | 400 | 12px |
| Sidebar option label | Roboto Mono | 400 | 10px |

## Icons

**All icons come from [Tabler Icons](https://tabler.io/icons)** — use `@tabler/icons-react` (already a dependency).

Rules:

- Use filled-frame 19–20px icon slots in the sidebar; default color `#f6f5f4` / white on active, `#676767` for inactive options.
- Suggested mapping (Figma vectors are unnamed, choose the closest Tabler equivalent):
  - Sidebar user avatar → `IconUser`
  - Sidebar collapse/expand toggle (two-stroke vector) → `IconLayoutSidebar`
  - Nav options (Overview, My mails, Issues, Agent, Projects) → `IconHome`, `IconMail`, `IconBug`, `IconSparkles` (or `IconRobot`), `IconFolders`
  - Project card "link button" → `IconLink` / `IconArrowUpRight`
  - Session rows → `IconTerminal2` (or contextual agent icon)

## Layout / components

1. **Sidebar** (324px, `#060606`, full height)
   - User row: profile image (radius 40), name "Ravexcode" (Roboto Mono 12px), top-right settings/menu icon.
   - Nav list at y≈50, item height ~25px, 3px corner radius:
     - Selected state: `#111111` background, `#fafafa` text.
     - Unselected: transparent, `#676767` text.
   - Options: Overview (selected), My mails, Issues, Agent, Projects.
2. **Header** (content area): page title "Overview" (Roboto Flex 400 24px) + 1px divider line `#111111` full width at y=50.
3. **Current issues panel** (860×140 card, `#060606`, radius 5):
   - Rows for issues with severity labels: `important`, `medium`, `low` (map to red/amber/gray status indicators; placeholder counts in mock).
   - Counter text "36 issues" and a **bar graph** (401×104) built from small rectangles — primary series `#000bde`, secondary `#676767`.
4. **Projects section** — stacked cards (842×128, `#060606`, radius 4):
   - Title (Roboto Flex 700 24px), truncated description (Roboto Flex 300 12px, `#676767`), status dot ellipse, two icon buttons (link button).
   - A card needing attention gets a 1px `#ff383c` border.
5. **Agents sessions** — grouped by date ("Today" / "Yesterday" labels, Roboto Flex 11px `#676767`):
   - Session rows (842×37, `#060606`, radius 5): leading Tabler icon + description text (Roboto Flex 400 15px, `#ffffff`).

## App scaffolding conventions

- Framework: **SolidStart** (`eclipse/`) with **Tailwind CSS v4** — use Tailwind utilities with the palette above as CSS variables/custom theme tokens in `src/app.css`.
- Icons only from `@tabler/icons-react`.
- Keep spacing/typography proportional to the 1728px design; the content column is fluid, the sidebar is fixed at 324px.
