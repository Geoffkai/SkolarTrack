# SkolarTrack — Design Tokens ("Clear Path")

Reference spec for all colors, type, and spacing used across the app.
Source of truth for the `@theme` block in `client/src/index.css`.

## Color

| Token name | Hex | OKLCH | Usage |
|---|---|---|---|
| `background` | `#f3faff` | `oklch(98% 0.01 240)` | Page background |
| `surface` | `#f0f6fa` | `oklch(97% 0.008 240)` | Sidebar, cards |
| `border` | `#dfe6eb` | `oklch(92% 0.01 240)` | Hairlines, dividers |
| `chip` | `#dfe9f1` | `oklch(93% 0.015 240)` | Unselected filter pill background |
| `primary` | `#008287` | `oklch(55% 0.1 200)` | CTAs, active nav, active filter, avatar |
| `ink` | `#0e171e` | `oklch(20% 0.02 240)` | Headings, primary text |
| `muted` | `#67737c` | `oklch(55% 0.02 240)` | Labels, meta text |
| `amount` | `#733119` | `oklch(40% 0.1 40)` | Peso amounts |
| `deadline-urgent` | `#a43c2f` | `oklch(50% 0.14 30)` | Close deadlines |
| `success` | `#005725` | `oklch(40% 0.13 150)` | Awarded status |
| `rejected` | `#8c3432` | `oklch(45% 0.12 25)` | Rejected status |

## Type

| Role | Font | Weight |
|---|---|---|
| Display / headings | Space Grotesk | 600–700 |
| Body / UI | Manrope | 500–700 |

## Spacing scale (px)

4 · 6 · 8 · 10 · 12 · 14 · 16 · 18 · 20 · 22 · 24 · 28 · 32

Sidebar width (desktop): fixed 220px.

## Signature element

- **Mobile**: flat scanning list, each row has a 6px vertical color bar on the left (teal by default, swaps by category).
- **Desktop**: same list becomes a sortable table (SCHOLARSHIP / ORGANIZATION / AMOUNT / DEADLINE columns), teal reserved for active filter + primary actions only — restraint is the trust signal, not color coverage.

## Open question

Tracker screen uses a kanban board on mobile in the original design — needs a decision: keep kanban (columns may need horizontal scroll on small screens) or switch to a vertical grouped list for mobile.
