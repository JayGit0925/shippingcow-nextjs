# T11 — CSS Module Extraction

## State
- 1 file: `app/globals.css` — 876 lines
- Global import only (layout.tsx)
- No CSS modules, no CSS-in-JS
- 326 className uses across codebase (Tailwind + custom classes)

## Plan
1. Split globals.css:
   - `styles/reset.css` — CSS reset/normalize (~20 lines)
   - `styles/variables.css` — custom properties, brand colors (~30 lines)
   - `styles/typography.css` — headings, body, links (~40 lines)
   - `styles/layout.css` — grid, flex, spacing, container (~60 lines)
   - `styles/components.css` — buttons, forms, cards, footer (~300 lines)
   - Remainder: keep as `globals.css` (~400 lines of Tailwind + utilities)
2. Import chain: layout.tsx imports globals.css → @import each module
3. Verify zero visual regression

## Defer
- Per-component CSS modules (massive refactor — wait for design system)
- Tailwind purge (326 uses = actively used, keep)

## Effort: 45 min
