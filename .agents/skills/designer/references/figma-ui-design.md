# Eclipse Figma reference

## Source file

- File: [Eclipse workspace](https://www.figma.com/design/qKcavTfClwVkYs5m6amChL/Eclipse-workspace)
- Source page: `UI Design`
- Backup page: `UI Design Backup` (reference only if explicitly requested)
- Design frames below were identified in the Figma UI. Frame IDs are Figma node IDs; use them to open the exact frame.

| Frame | Node | Canvas size | Intended use |
| --- | --- | ---: | --- |
| `Landing page` | `1:3` | 1280 × 640 | Public home page |
| `Not found` | `41:303` | 1280 × 640 | App not-found route |
| `Dashboard` | `50:2` | 1280 × 645 | Dashboard visual and landing-page dashboard artwork |

Direct links:

- [Landing page](https://www.figma.com/design/qKcavTfClwVkYs5m6amChL/Eclipse-workspace?node-id=1-3)
- [Not found](https://www.figma.com/design/qKcavTfClwVkYs5m6amChL/Eclipse-workspace?node-id=41-303)
- [Dashboard](https://www.figma.com/design/qKcavTfClwVkYs5m6amChL/Eclipse-workspace?node-id=50-2)

## UI inspection workflow

Use the existing Figma tab when it is already open. Do not create a second tab for the same file unless the existing one is unavailable.

1. Select the target frame in the Layers panel and press `Shift+2` to zoom to selection.
2. Capture the full frame before drilling into details. Record visible text, grouping, layout, image crop, and the frame dimensions.
3. Expand the frame's disclosure caret in Layers. If the accessible row action selects the layer without expanding it, click the visible caret and verify that child rows appear. Expand relevant groups/components; select child layers to read their width, height, position, typography, fills, and color variables in the right inspector.
4. Inspect and export actual image/vector layers through Figma when they are meant to be assets. Use a frame screenshot as a visual reference, not as the live page implementation.
5. Do not edit or rearrange the user's Figma file while inspecting it.

When the Figma design-context connector is available, use its design-to-code workflow and request the screenshot with the initial context call. If the connector reports a quota/access error, use the UI workflow above; do not repeatedly retry the blocked connector.

## Observed frame contents

These descriptions identify the correct frames and provide a starting point; the selected frame and its layers remain authoritative for exact details.

### Landing page

- Black, wide desktop canvas with a minimal header: circular brand mark on the left and a purple `Sign in` action on the right.
- Two-column hero: large three-line headline on the left (`Build Faster`, `Deploy with`, `Confidence`), with `Faster` and `Confidence` in the bright purple accent.
- Supporting copy below the headline, then `Start` and `Learn more` actions.
- A dashboard visual occupies the right side. Inspect its layer and source before choosing an export or crop; the `Dashboard` frame is the current full-screen design reference.

### Dashboard

- Black 1280 × 645 frame with a compact fixed sidebar on the left and a wider content column.
- Sidebar navigation visible in the frame: `Overview`, `Inbox`, `Issues`, `Projects`, and `Agents`; profile sits at the bottom.
- Main content shows `July 2026 Issues` as an activity heatmap, `Agents usage` with 5h/weekly/monthly progress bars, and an `Inbox` message list with an `Open ... messages` action.
- Purple is prominent in the heatmap and usage bars. Read actual fills and variables from the selected layers; do not infer the CSS token from the screenshot alone.

### Not found

- Black 1280 × 640 frame with centered content: `404`, `Page not found`, short supporting copy, and an underlined `Home` link.
- Keep the home action as a real link to `/` and preserve the app's global typography and color tokens.
